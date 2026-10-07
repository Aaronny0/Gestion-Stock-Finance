const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
function load(file, mocks = {}, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => { if (name in mocks) return mocks[name]; throw Error(name); }, URL, Headers, AbortSignal, TextEncoder, ...globals });
  return module.exports;
}
const redirects = load('src/lib/supabase/redirect.ts');
test('OAuth destinations reject external, protocol-relative and unknown routes', () => {
  for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/auth/callback', null]) assert.equal(redirects.authDestination(value), '/access-pending');
  assert.equal(redirects.authDestination('/reset-password'), '/reset-password');
  assert.equal(redirects.authDestination('https://vortex.test/auth/callback?next=%2Finvite%2Factivate%3Ftoken%3Dabc', 'https://vortex.test'), '/invite/activate?token=abc');
  assert.equal(redirects.authDestination('https://evil.test/auth/callback?next=%2Finvite%2Factivate%3Ftoken%3Dabc', 'https://vortex.test'), '/access-pending');
  assert.equal(redirects.authDestination('/invite/activate?token=a%26b&next=https://evil.test'), '/invite/activate?token=a%26b');
});
test('API reads a new Bearer for each call, preserves idempotency and status codes', async () => {
  let token = 'first'; const calls = [];
  const api = load('src/frontend/api.ts', {
    '@/lib/supabase/client': { getSupabase: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: token } } }) } }) },
    '@/lib/supabase/config': { supabaseConfig: () => ({}) },
  }, { fetch: async (url, init) => { calls.push({url, init}); return { ok: true, json: async () => ({}) }; } });
  await api.request('session'); token = 'refreshed'; await api.request('workspace');
  await api.request('commands', { headers: { 'Idempotency-Key': 'stable' } });
  assert.equal(calls[0].init.headers.get('Authorization'), 'Bearer first');
  assert.equal(calls[1].init.headers.get('Authorization'), 'Bearer refreshed');
  assert.equal(calls[2].init.headers.get('Idempotency-Key'), 'stable');
  await assert.rejects(api.request('https://storage.test/signed'));
  assert.equal(calls.length, 3);
});
const next = { NextResponse: { redirect: (url, init) => ({ url: String(url), init }), json: (data, init) => ({ data, ...init, headers: new Headers(init?.headers) }) } };
test('callback exchanges code and handles missing code, invalid code and provider errors', async () => {
  for (const [query, fails, expected] of [['?code=ok', false, '/access-pending'], ['', false, '/login?error=auth_callback'], ['?code=bad', true, '/login?error=auth_callback'], ['?error=access_denied&code=ok', false, '/login?error=auth_callback']]) {
    let exchanges = 0;
    const route = load('src/app/auth/callback/route.ts', { 'next/server': next, '@/lib/supabase/redirect': redirects, '@/lib/supabase/server': { createSupabaseServer: async () => ({ auth: { exchangeCodeForSession: async () => { exchanges++; return { error: fails ? {} : null }; } } }) } });
    const url = new URL('https://vortex.test/auth/callback'+query); const result = await route.GET({ nextUrl: url });
    assert.equal(result.url, 'https://vortex.test'+expected);
    assert.equal(exchanges, query.includes('code=') && !query.includes('error=') ? 1 : 0);
  }
});
test('proxy forwards Bearer, cookies and idempotency; rejects open proxy and cross-origin writes', async () => {
  const calls = [];
  const route = load('src/app/api/v1/[...path]/route.ts', { 'next/server': next, '@/lib/supabase/access': { resolveAccess: async () => ({status:'APPROVED'}), AccessFailure: class extends Error {} } }, { process: { env: { FRONTEND_API_URL: 'https://nest.test/api/v1/' } }, fetch: async (url, init) => { calls.push({ url: String(url), init }); return { ok: true, status: 200, text: async () => '{}', headers: { getSetCookie: () => [] } }; } });
  const req = { method: 'POST', nextUrl: new URL('https://vortex.test/api/v1/commands'), headers: new Headers({ origin: 'https://vortex.test', Authorization: 'Bearer identity', Cookie: 'legacy=1', 'Idempotency-Key': 'stable' }), text: async () => '{}' };
  await route.POST(req, { params: Promise.resolve({ path: ['commands'] }) });
  assert.equal(calls[0].init.headers.get('Authorization'), 'Bearer identity');
  assert.equal(calls[0].init.headers.get('Cookie'), 'legacy=1');
  assert.equal(calls[0].init.headers.get('Origin'), 'https://vortex.test');
  assert.equal(calls[0].init.headers.get('Idempotency-Key'), 'stable');
  assert.equal((await route.POST(req, { params: Promise.resolve({ path: ['evil'] }) })).status, 404);
  req.headers.set('origin', 'https://evil.test');
  assert.equal((await route.POST(req, { params: Promise.resolve({ path: ['commands'] }) })).status, 403);
  assert.equal(calls.length, 1);
});
test('proxy body limit uses UTF-8 bytes, including multibyte JSON payloads', async () => {
  let forwarded = 0;
  const route = load('src/app/api/v1/[...path]/route.ts', { 'next/server': next, '@/lib/supabase/access': { resolveAccess: async () => ({status:'APPROVED'}), AccessFailure: class extends Error {} } }, {
    process: { env: { FRONTEND_API_URL: 'https://nest.test/api/v1/' } },
    fetch: async () => { forwarded++; return { ok: true, status: 200, text: async () => '{}', headers: { getSetCookie: () => [] } }; },
  });
  const req = {
    method: 'POST', nextUrl: new URL('https://vortex.test/api/v1/commands'),
    headers: new Headers({ origin: 'https://vortex.test' }),
    text: async () => JSON.stringify({ reason: 'é'.repeat(1_000_000) }),
  };
  const ctx = { params: Promise.resolve({ path: ['commands'] }) };
  assert.equal((await route.POST(req, ctx)).status, 413);
  assert.equal(forwarded, 0);
  req.text = async () => JSON.stringify({ reason: 'a'.repeat(1_000_000) });
  assert.equal((await route.POST(req, ctx)).status, 200);
  assert.equal(forwarded, 1);
});
test('onboarding retains retry key and excludes password; VORTEX states are distinguished', async () => {
  const storage = new Map();
  let outcome = { destination: '/access-pending' };
  class ApiError extends Error { constructor(code) { super(); this.code = code; } }
  const flow = load('src/frontend/auth-flow.ts', { './api': { ApiError, request: async () => { if (outcome instanceof Error) throw outcome; return outcome; } } }, { crypto: require('node:crypto').webcrypto, sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) } });
  const first = flow.saveOnboarding({ email: 'test@example.com', password: 'private', organizationName: 'shop' });
  assert.equal(flow.saveOnboarding({ email: 'test@example.com', password: 'private', organizationName: 'shop' }).idempotencyKey, first.idempotencyKey);
  assert.equal(JSON.stringify(flow.readOnboarding()).includes('private'), false);
  assert.equal(await flow.businessDestination(), '/access-pending');
  outcome = { destination: '/onboarding' }; assert.equal(await flow.businessDestination(), '/onboarding');
  outcome = new ApiError('FORBIDDEN'); await assert.rejects(flow.businessDestination());
  outcome = { destination: '/app/dashboard' }; assert.equal(await flow.businessDestination(), '/app/dashboard');
  assert.match(flow.authError({ code: 'email_not_confirmed' }), /Confirmez/);
  assert.match(flow.authError({ code: 'invalid_credentials' }), /incorrect/);
});
test('confirmation verifies OTP type and never treats an unverified link as success', async () => {
  for (const [query, failed, expected] of [
    ['?token_hash=valid&type=signup', false, '/access-pending'],
    ['?token_hash=valid&type=signup&next=' + encodeURIComponent('https://vortex.test/auth/callback?next=%2Finvite%2Factivate%3Ftoken%3Dabc'), false, '/invite/activate?token=abc'],
    ['?token_hash=valid&type=recovery', false, '/reset-password'],
    ['?token_hash=expired&type=recovery', true, '/reset-password?error=invalid_link'],
    ['?type=signup', false, '/login?error=auth_callback'],
    ['?token_hash=x&type=admin', false, '/login?error=auth_callback'],
  ]) {
    const route = load('src/app/auth/confirm/route.ts', { 'next/server': next, '@/lib/supabase/redirect': redirects, '@/lib/supabase/server': { createSupabaseServer: async () => ({ auth: { verifyOtp: async () => ({ error: failed ? {} : null }) } }) } });
    assert.equal((await route.GET({ nextUrl: new URL('https://vortex.test/auth/confirm'+query) })).url, 'https://vortex.test'+expected);
  }
});
test('API propagates onboarding, membership, forbidden and unavailable distinctly', async () => {
  for (const [status, code] of [[409, 'ONBOARDING_REQUIRED'], [403, 'NO_MEMBERSHIP'], [403, 'FORBIDDEN'], [503, undefined], [401, undefined]]) {
    const api = load('src/frontend/api.ts', { '@/lib/supabase/client': {}, '@/lib/supabase/config': { supabaseConfig: () => null } }, { fetch: async () => ({ ok: false, status, json: async () => ({ code }) }) });
    await assert.rejects(api.request('session'), e => e.status === status && e.code === code);
  }
});
function authForm(path, sdk, values = {}, identity = null, action = async () => ({})) {
  const calls = [], navigation = [];
  const state = [values, false, false, '', '', { organization: { name: 'Team' } }];
  const React = { ...require('react'), useState: () => [state.shift(), () => {}], useEffect: () => {} };
  const form = load('src/frontend/auth-page.tsx', {
    react: React, 'react/jsx-runtime': require('react/jsx-runtime'), 'next/link': { default: 'a' }, 'next/navigation': { usePathname: () => path, useRouter: () => ({replace: value => navigation.push(value)}) },
    '@/components/layout/app-logo': { AppLogo:'a' },
    'lucide-react': new Proxy({}, { get: () => 'svg' }), './ui': { Alert: 'aside', Field: 'label' },
    './api': { api: { auth: async (...args) => { calls.push(args); return action(...args); } } },
    './auth-provider': { useAuth: () => ({ user: identity, loading: false }) },
    '@/lib/supabase/client': { getSupabase: () => ({ auth: sdk }) },
    './auth-flow': { authError: e => e.code, businessDestination: async () => '/app/dashboard', saveOnboarding: () => ({ payload: { organizationName: 'Shop' }, idempotencyKey: 'stable' }), readOnboarding: () => null },
  }, { location: { origin: 'https://vortex.test', search: '?token=invitation', assign: value => navigation.push(value) }, URLSearchParams });
  const tree = form.default();
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) { const match = find(child, predicate); if (match) return match; }
    return null;
  }
  return { submit: () => find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} }), google: () => find(tree, node => node.type === 'button' && Array.isArray(node.props.children) && node.props.children.some(child => typeof child === 'string' && child.includes('Continuer avec Google'))).props.onClick(), calls, navigation };
}
test('email login accepts session, rejects invalid and unconfirmed identities', async () => {
  for (const code of [null, 'invalid_credentials', 'email_not_confirmed']) {
    let submitted;
    const form = authForm('/login', { signInWithPassword: async input => { submitted = input; return { data: { session: code ? null : {} }, error: code ? { code } : null }; } }, { email: 'user@example.com', password: 'password' });
    await form.submit(); assert.equal(submitted.email, 'user@example.com');
    assert.equal(form.navigation.length, code === 'invalid_credentials' ? 0 : 1);
    if (code === 'email_not_confirmed') assert.equal(form.navigation[0], '/verify-email');
  }
});
test('signup separates Supabase identity from business onboarding and awaits confirmation', async () => {
  for (const session of [null, {}]) {
    let options;
    const form = authForm('/signup', { signUp: async input => { options = input.options; return { data: { session }, error: null }; } }, { email: 'user@example.com', password: 'password', name: 'Owner' });
    await form.submit(); assert.equal(form.calls.length, 0);
    assert.equal(options.data.vortex_access_request, true);
    assert.equal(options.data.vortex_onboarding, undefined);
    assert.equal(form.navigation[0], session ? '/access-pending' : '/verify-email');
  }
});
test('forgot password uses Supabase recovery callback and Google uses OAuth', async () => {
  let reset, oauth;
  await authForm('/forgot-password', { resetPasswordForEmail: async (...args) => { reset = args; return { error: null }; } }, { email: 'user@example.com' }).submit();
  assert.equal(reset[1].redirectTo, 'https://vortex.test/auth/callback?next=/reset-password');
  await authForm('/login', { signInWithOAuth: async input => { oauth = input; return { error: null }; } }).google();
  assert.equal(oauth.provider, 'google');
  assert.equal(new URL(oauth.options.redirectTo).searchParams.get('next'), '/access-pending');
});
test('invitation accepts only after identity; existing and new identities are separate', async () => {
  for (const [identity, newAccount] of [[{ email: 'user@example.com' }, 'no'], [null, 'no'], [null, 'yes']]) {
    const auth = async () => ({ data: { session: {} }, error: null });
    const form = authForm('/invite/activate', { signInWithPassword: auth, signUp: auth }, { email: 'user@example.com', password: 'private', newAccount }, identity);
    await form.submit();
    assert.deepEqual(form.calls[0][0], 'activate');
    assert.equal(form.calls[0][1].token, 'invitation');
    assert.equal('password' in form.calls[0][1], false);
    assert.equal(form.navigation[0], '/app/dashboard');
  }
  const form = authForm('/invite/activate', {}, {}, { email: 'user@example.com' }, async () => { throw Error('expired'); });
  await form.submit(); assert.equal(form.navigation.length, 0);
});
test('reset submits the new password through Supabase and signs out after success', async () => {
  for (const failed of [false, true]) {
    const state = ['new-password-123', 'new-password-123', false, false, '', false];
    let updated, signedOut = 0;
    const page = load('src/app/reset-password/page.tsx', {
      react: { ...require('react'), useState: () => [state.shift(), () => {}], useEffect: () => {} },
      'react/jsx-runtime': require('react/jsx-runtime'), 'next/link': { default: 'a' },
      '@/frontend/auth-provider': { useAuth: () => ({ loading: false, user: {}, signOut: async () => { signedOut++; } }) },
      '@/lib/supabase/client': { getSupabase: () => ({ auth: { updateUser: async input => { updated = input; return { error: failed ? {} : null }; } } }) },
      '@/frontend/ui': { Alert: 'aside', Field: 'label' },
    });
    const form = page.default().props.children.props.children[1];
    await form.props.onSubmit({ preventDefault() {} });
    assert.equal(updated.password, 'new-password-123');
    assert.equal(signedOut, failed ? 0 : 1);
  }
});
test('AuthProvider handles initial session, auth events, cleanup and SDK logout', async () => {
  const setters = [], effects = []; let listener, unsubscribed = false, signedOut = false, removed;
  const React = { ...require('react'), useState: initial => [initial, value => setters.push(value)], useEffect: fn => effects.push(fn) };
  const provider = load('src/frontend/auth-provider.tsx', {
    react: React, 'react/jsx-runtime': require('react/jsx-runtime'), 'next/navigation': { usePathname: () => '/app/dashboard' },
    '@/lib/supabase/config': { supabaseConfig: () => ({}) },
    '@/lib/supabase/client': { getSupabase: () => ({ auth: {
      onAuthStateChange: callback => { listener = callback; return { data: { subscription: { unsubscribe: () => { unsubscribed = true; } } } }; },
      getSession: async () => ({ data: { session: { user: { id: 'one' }, access_token: 'first' } }, error: null }),
      signOut: async () => { signedOut = true; return { error: null }; },
    } }) },
  }, { sessionStorage: { removeItem: key => { removed = key; } } });
  const tree = provider.AuthProvider({ children: null }); const cleanup = effects[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(setters[0].access_token, 'first');
  listener('TOKEN_REFRESHED', { user: { id: 'one' }, access_token: 'second' });
  listener('SIGNED_IN', { user: { id: 'two' } });
  assert.ok(setters.some(value => value?.user?.id === 'two'));
  await tree.props.value.signOut(); assert.equal(signedOut, true); assert.equal(removed, 'vortex:onboarding');
  cleanup(); assert.equal(unsubscribed, true);
});

test('initial live workspace and organization changes let NestJS choose the default UUID store', async () => {
  const calls = [];
  const api = load('src/frontend/api.ts', { '@/lib/supabase/client': {}, '@/lib/supabase/config': { supabaseConfig: () => null } }, { fetch: async (url) => { calls.push(url); return { ok: true, json: async () => ({}) }; } });
  await api.api.snapshot('', '2026-10-01', '2026-10-05');
  assert.equal(calls[0], '/api/v1/workspace?start=2026-10-01&end=2026-10-05');
  await api.api.snapshot('store-uuid', '2026-10-01', '2026-10-05', undefined, 'organization-uuid');
  assert.match(calls[1], /storeId=store-uuid/); assert.match(calls[1], /organizationId=organization-uuid/);
  const effects = [], updates = [], user = { id: 'identity' };
  let requestedStore;
  const react = { ...require('react'), useState: initial => [typeof initial === 'function' ? initial() : initial, value => updates.push(value)], useRef: value => ({ current: value }), useCallback: value => value, useEffect: (run, deps) => effects.push({ run, deps }), useLayoutEffect: (run, deps) => effects.push({ run, deps }) };
  const provider = load('src/frontend/provider.tsx', { react, 'react/jsx-runtime': require('react/jsx-runtime'), 'next/navigation': { usePathname: () => '/app/dashboard', useRouter: () => ({ replace() {} }) }, './history': {}, './navigation': {canonical: p=>p,routePermission: ()=>'dashboard.read'}, './auth-provider': { useAuth: () => ({ user, loading: false, error: '' }) }, './api': { api: { snapshot: async store => { requestedStore = store; return { session: { stores: [{ id: 'uuid' }], defaultStoreId: 'uuid' } }; } } }, './demo': {}, './types': {} }, { AbortController, Date });
  provider.WorkspaceProvider({ children: null });
  const effect = effects.find(e => e.deps?.length > 10);
  assert.ok(effect); const cleanup = effect.run();
  await Promise.resolve(); await Promise.resolve();
  assert.equal(requestedStore, ''); assert.ok(updates.includes('uuid')); cleanup();
});
test('workspace resets between demo/live and account changes', () => {
  let path = '/demo', user = { id: 'one' };
  const overrides = { react: require('react'), 'react/jsx-runtime': require('react/jsx-runtime'), 'next/navigation': { usePathname: () => path, useRouter: () => ({replace: value => navigation.push(value)}) }, './auth-provider': { useAuth: () => ({ user }) }, './provider': { WorkspaceProvider: function WorkspaceProvider() {} } };
  const mocks = new Proxy(overrides, { has: () => true, get: (target, name) => target[name] ?? {} });
  const shell = load('src/frontend/shell.tsx', mocks);
  const demo = shell.FrontendShell({ children: null }); path = '/';
  const live = shell.FrontendShell({ children: null }); user = { id: 'two' };
  const next = shell.FrontendShell({ children: null });
  assert.notEqual(demo.key, live.key); assert.notEqual(live.key, next.key);
});

test('team update projects only accepted fields and understands backend statuses', async () => {
  const member = { id: 'member', label: 'Alice', email: 'alice@example.com', role: 'cashier', status: 'active', stores: ['store'], permissions: [], defaultStoreId: 'store', date: '2026-10-05', unexpected: 'read-only' };
  const calls = [];
  const overrides = {
    react: { ...require('react'), useState: initial => [initial, () => {}], useRef: value => ({ current: value }), useMemo: run => run() },
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@/frontend/provider': { useWorkspace: () => ({ storeId: 'store', snapshot: { session: { stores: [] } }, command: async (...args) => calls.push(args) }), useUnsavedChanges: () => () => true },
    '@/frontend/types': { permissions: [], rolePermissions: { cashier: [] }, roleLabels: { cashier: 'Caissier' } },
  };
  const mocks = new Proxy(overrides, { has: () => true, get: (target, name) => target[name] ?? {} });
  const component = load('src/features/team/team-member-dialog.tsx', mocks);
  const tree = component.TeamMemberDialog({ open: true, member, onOpenChange() {} });
  const form = tree.props.children.props.children[1];
  await form.props.onSubmit({ preventDefault() {} });
  assert.equal(calls[0][0], 'team.update');
  assert.deepEqual(Object.keys(calls[0][1]).sort(), ['defaultStoreId', 'email', 'id', 'label', 'permissions', 'role', 'status', 'stores'].sort());
  assert.equal(calls[0][1].status, 'Actif');
});

test('rights refresh keeps the selected organization and discards data loaded with former permissions', async () => {
  const snapshot = { session: { organization: { id: 'selected-org' }, permissions: ['stock.cost.read'], stores: [{ id: 'store' }] }, data: { products: [{ cost: 999 }] } };
  const effects = [], updates = [], paths = [];
  let state = 0, check;
  const react = { ...require('react'), useState: initial => [state++ === 0 ? snapshot : initial, value => updates.push(value)], useRef: value => ({ current: value }), useCallback: value => value, useEffect: (run, deps) => effects.push({ run, deps }), useLayoutEffect: (run, deps) => effects.push({ run, deps }) };
  const component = load('src/frontend/provider.tsx', { react, 'react/jsx-runtime': require('react/jsx-runtime'), 'next/navigation': { usePathname: () => '/app/dashboard', useRouter: () => ({ replace() {} }) }, './history': {}, './navigation': {canonical: p=>p,routePermission: ()=>'dashboard.read'}, './auth-provider': { useAuth: () => ({ user: { id: 'one' }, loading: false, error: '' }) }, './api': { request: async path => { paths.push(path); return { organization: { id: 'selected-org' }, permissions: [], stores: [{ id: 'store' }], defaultStoreId: 'store' }; } }, './demo': {}, './types': {} }, { document: { visibilityState: 'visible' }, window: { addEventListener: (_name, callback) => { check = callback; }, removeEventListener() {} }, setInterval: () => 1, clearInterval() {}, Date });
  component.WorkspaceProvider({ children: null });
  const cleanup = effects.find(e => e.deps?.includes(snapshot)).run();
  check(); await Promise.resolve(); await Promise.resolve();
  assert.equal(paths[0], 'session?organizationId=selected-org');
  assert.ok(updates.includes(null), 'The former snapshot must be removed before fetching new permissions');
  assert.ok(updates.some(value => typeof value === 'function'), 'The workspace is reloaded');
  cleanup();
});
test('workspace assembles all server pages and restarts after a concurrent command', async () => {
  const calls=[];let attempt=0;
  const api=load('src/frontend/api.ts',{'@/lib/supabase/client':{},'@/lib/supabase/config':{supabaseConfig:()=>null}},{fetch:async(url)=>{
    calls.push(url);const page=new URL(url,'http://localhost').searchParams.get('page');
    if(!page){attempt++;return {ok:true,json:async()=>({session:{organization:{id:'org'}},data:{products:[{id:attempt===1?'stale':'first'}],sales:[]},pagination:{page:1,pageSize:1,hasMore:true,snapshotVersion:String(attempt)}})};}
    if(attempt===1)return{ok:false,status:409,json:async()=>({})};
    return{ok:true,json:async()=>({session:{organization:{id:'org'}},data:{products:[{id:'second'}],sales:[]},pagination:{page:2,pageSize:1,hasMore:false,snapshotVersion:'2'}})};
  }});
  const result=await api.api.snapshot('store','2026-10-01','2026-10-06');
  assert.deepEqual(JSON.parse(JSON.stringify(result.data.products)),[{id:'first'},{id:'second'}]);assert.equal(calls.length,4);assert.ok(calls[3].includes('snapshotVersion=2'));
});
test('business validation displays the precise French form error', async()=>{
 const api=load('src/frontend/api.ts',{'@/lib/supabase/client':{},'@/lib/supabase/config':{supabaseConfig:()=>null}},{fetch:async()=>({ok:false,status:422,json:async()=>({fields:{_form:'Ouvrez la caisse avant un paiement en espèces.'}})})});
 await assert.rejects(api.request('commands'),e=>e.message==='Ouvrez la caisse avant un paiement en espèces.');
});

test('access matrix: verified email alone never authorizes onboarding', () => {
 const policy=load('src/lib/access-policy.ts');
 for(const status of [undefined,'PENDING_APPROVAL','CONTACTED','REJECTED','SUSPENDED']) {
  assert.equal(policy.accessDecision(true,status,false).destination,'/access-pending');
 }
 assert.equal(policy.accessDecision(false,'APPROVED',true).destination,'/verify-email');
 assert.equal(policy.accessDecision(true,'APPROVED',false).destination,'/onboarding');
 assert.equal(policy.accessDecision(true,'APPROVED',true).destination,'/app/dashboard');
 assert.equal(policy.accessDecision(true,undefined,true).legacy,true);
 assert.equal(policy.accessDecision(true,'SUSPENDED',true).destination,'/access-pending');
 assert.equal(policy.declaredAccess({vortex_access_status:'nonsense'}),'PENDING_APPROVAL');
});
test('proxy refuses pending onboarding and business access before forwarding', async()=>{
 for(const status of ['PENDING_EMAIL','PENDING_APPROVAL','CONTACTED','REJECTED','SUSPENDED']) {
  let calls=0;
  const route=load('src/app/api/v1/[...path]/route.ts',{'next/server':next,'@/lib/supabase/access':{resolveAccess:async()=>({status}),AccessFailure:class extends Error{}}},{process:{env:{FRONTEND_API_URL:'https://nest.test/api/v1/'}},fetch:async()=>{calls++;}});
  const req={method:'POST',nextUrl:new URL('https://vortex.test/api/v1/onboarding'),headers:new Headers({origin:'https://vortex.test'})};
  for(const path of ['onboarding','workspace','commands']) assert.equal((await route.POST(req,{params:Promise.resolve({path:[path]})})).status,403);
  assert.equal(calls,0);
 }
});

test('Back Admin requires a server-controlled admin claim and rejects unsafe approval', async () => {
  const policy = load('src/lib/access-policy.ts');
  let actor = null, verified = false, writes = [], notifications = [], mailAvailable = true;
  const id = '00000000-0000-4000-8000-000000000002';
  const route = load('src/app/api/admin/access-requests/route.ts', {
    'next/server': next, 'zod': require('zod'), '@/lib/access-policy': policy,
    '@/lib/supabase/config': {supabaseConfig:()=>({url:'https://identity.test'})},
    '@/lib/supabase/server': {createSupabaseServer:async()=>({auth:{getUser:async()=>({data:{user:actor}}),getSession:async()=>({data:{session:{access_token:'fixture'}}})}})},
    '@supabase/supabase-js': {createClient:()=>({auth:{admin:{getUserById:async()=>({data:{user:{id,email:'prospect@example.test',email_confirmed_at:verified?'now':null,app_metadata:{preserve:'value'}}}}),updateUserById:async(...args)=>{writes.push(args);return{};}}}})},
  }, {process:{env:{SUPABASE_SERVICE_ROLE_KEY:'fixture-only',FRONTEND_API_URL:'https://nest.test/api/v1/'}},fetch:async(url,init)=>{notifications.push({url:String(url),init});return {ok:mailAvailable,json:async()=>({notification:'queued'})};}});
  const req = {headers:new Headers({origin:'https://vortex.test'}),nextUrl:new URL('https://vortex.test/api/admin/access-requests'),json:async()=>({id,status:'APPROVED'})};
  assert.equal((await route.POST(req)).status,401);
  actor={id:'00000000-0000-4000-8000-000000000001',app_metadata:{},user_metadata:{vortex_admin:true}};
  assert.equal((await route.POST(req)).status,403);
  actor.app_metadata.vortex_admin=true;
  assert.equal((await route.POST(req)).status,409);
  verified=true;
  const approved=await route.POST(req);
  assert.equal(approved.data.status,'APPROVED');
  assert.equal(approved.data.notification,'queued');
  assert.equal(JSON.parse(notifications[0].init.body).email,'prospect@example.test');
  assert.equal(notifications[0].init.headers.Authorization,'Bearer fixture');
  assert.equal(writes.length,1);
  assert.equal(writes[0][1].app_metadata.preserve,'value');
  assert.equal(writes[0][1].app_metadata.vortex_access_decision.actor,actor.id);
  req.headers.set('origin','https://evil.test');
  assert.equal((await route.POST(req)).status,403);
  assert.equal(writes.length,1);
  req.headers.set('origin','https://vortex.test');mailAvailable=false;
  const withoutMail=await route.POST(req);
  assert.equal(withoutMail.data.status,'APPROVED');
  assert.equal(withoutMail.data.notification,'unavailable');
  assert.equal(writes.length,2);
});

test('recent login preference is recorded only after a successful callback', async () => {
  for (const [provider, failed] of [['google', false], ['email', false], ['google', true]]) {
    const saved = [];
    const route = load('src/app/auth/callback/route.ts', {
      'next/server': { NextResponse: { redirect: url => ({ url: String(url), cookies: { set: (...args) => saved.push(args) } }) } },
      '@/lib/supabase/redirect': redirects,
      '@/lib/supabase/server': { createSupabaseServer: async () => ({ auth: { exchangeCodeForSession: async () => ({ data: { user: { app_metadata: { provider } } }, error: failed ? {} : null }) } }) },
    });
    await route.GET({ nextUrl: new URL('https://vortex.test/auth/callback?code=test') });
    assert.equal(saved.length, failed ? 0 : 1);
    if (!failed) {
      assert.equal(saved[0][0], 'vortex_last_login');
      assert.equal(saved[0][1], provider);
      assert.equal(saved[0][2].secure, true);
    }
  }
});
