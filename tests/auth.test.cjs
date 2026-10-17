const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const cache = new Map();
/** Loads a TypeScript source in a sandbox. Shared contracts and zod are real; everything else must be mocked. */
function load(file, mocks = {}, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const real = name => {
    if (name === 'zod') return require('zod');
    if (name === '@/contracts' || name === '../contracts') return shared('src/contracts/index.ts');
    if (name.startsWith('./') && file.startsWith('src/contracts/')) return shared(`src/contracts/${name.slice(2)}.ts`);
    return undefined;
  };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => { if (name in mocks) return mocks[name]; const found = real(name); if (found) return found; throw Error(name); }, URL, Headers, AbortSignal, TextEncoder, process: { env: {} }, ...globals });
  return module.exports;
}
function shared(file) {
  if (!cache.has(file)) cache.set(file, load(file));
  return cache.get(file);
}
const redirects = load('src/lib/auth/redirect.ts');
test('OAuth destinations reject external, protocol-relative and unknown routes', () => {
  for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/auth/callback', null]) assert.equal(redirects.authDestination(value), '/access-pending');
  assert.equal(redirects.authDestination('/reset-password'), '/reset-password');
  assert.equal(redirects.authDestination('/verify-email'), '/verify-email');
  assert.equal(redirects.authDestination('/verify-email?next=https://evil.test'), '/access-pending');
  assert.equal(redirects.authDestination('https://vortex.test/auth/callback?next=%2Finvite%2Factivate%3Ftoken%3Dabc'), '/access-pending');
  assert.equal(redirects.authFailureDestination('/reset-password'), '/reset-password?error=invalid_link');
  assert.equal(redirects.authDestination('/invite/activate?token=a%26b&next=https://evil.test'), '/invite/activate?token=a%26b');
});
test('API relies on same-origin cookies, preserves idempotency and status codes', async () => {
  const calls = [];
  const api = load('src/frontend/api.ts', {}, { fetch: async (url, init) => { calls.push({url, init}); return { ok: true, json: async () => ({}) }; } });
  await api.request('session'); await api.request('workspace');
  await api.request('commands', { headers: { 'Idempotency-Key': 'stable' } });
  assert.equal(calls[0].init.credentials, 'same-origin');
  assert.equal(calls[1].init.headers.get('Authorization'), null);
  assert.equal(calls[2].init.headers.get('Idempotency-Key'), 'stable');
  await assert.rejects(api.request('https://storage.test/signed'));
  assert.equal(calls.length, 3);
});
const next = { NextResponse: { redirect: (url, init) => ({ url: String(url), init }), json: (data, init) => ({ data, ...init, headers: new Headers(init?.headers) }) } };
class FakeResponse {
  constructor(body, init = {}) { this.body = body; this.status = init.status ?? 200; this.headers = new Headers(init.headers); }
  static json(data, init = {}) { const r = new FakeResponse(JSON.stringify(data), init); r.data = data; return r; }
}
function authProxy(upstream, calls = []) {
  return load('src/app/api/auth/[...all]/route.ts', { 'next/server': { NextResponse: FakeResponse } }, { process: { env: { AUTH_API_URL: 'http://api.test:3001' } },
    fetch: async (url, init) => { calls.push({ url: String(url), init }); return upstream(url, init); } });
}
const authReq = (method, path, headers = {}, body) => ({ method, nextUrl: new URL('https://vortex.test' + path), headers: new Headers(headers), text: async () => body ?? '' });
test('auth proxy relays Better Auth requests, redirects and every Set-Cookie untouched', async () => {
  const calls = [];
  const route = authProxy(async () => ({ status: 200, headers: new Headers([['content-type', 'application/json'], ['set-cookie', 'vortex.session_token=a; Domain=.talentlistx.com; Path=/; HttpOnly; Secure'], ['set-cookie', 'vortex.session_data=b; Domain=.talentlistx.com; Path=/']]), arrayBuffer: async () => new TextEncoder().encode('{"ok":true}').buffer }), calls);
  const res = await route.POST(authReq('POST', '/api/auth/sign-in/email?x=1', { 'content-type': 'application/json', cookie: 'a=1', origin: 'https://vortex.test', 'user-agent': 'UA', 'x-forwarded-for': '203.0.113.9', authorization: 'Bearer leaked' }, '{"email":"a@b.c"}'), { params: Promise.resolve({ all: ['sign-in', 'email'] }) });
  assert.equal(calls[0].url, 'http://api.test:3001/api/auth/sign-in/email?x=1');
  assert.equal(calls[0].init.redirect, 'manual'); assert.equal(calls[0].init.body, '{"email":"a@b.c"}');
  for (const [k, v] of [['cookie', 'a=1'], ['origin', 'https://vortex.test'], ['user-agent', 'UA'], ['x-forwarded-for', '203.0.113.9'], ['content-type', 'application/json']]) assert.equal(calls[0].init.headers.get(k), v);
  assert.equal(calls[0].init.headers.get('authorization'), null);
  assert.equal(res.status, 200);
  assert.deepEqual(res.headers.getSetCookie(), ['vortex.session_token=a; Domain=.talentlistx.com; Path=/; HttpOnly; Secure', 'vortex.session_data=b; Domain=.talentlistx.com; Path=/']);
  const redirect = authProxy(async () => ({ status: 302, headers: new Headers([['location', '/verify-email'], ['set-cookie', 's=1; Domain=.talentlistx.com']]) }));
  const moved = await redirect.GET(authReq('GET', '/api/auth/verify-email?token=t&callbackURL=%2Fverify-email'), { params: Promise.resolve({ all: ['verify-email'] }) });
  assert.equal(moved.status, 302); assert.equal(moved.headers.get('location'), '/verify-email'); assert.equal(moved.body, null);
  assert.equal(moved.headers.getSetCookie()[0], 's=1; Domain=.talentlistx.com');
});
test('auth proxy refuses admin and one-time-code routes, other methods, and reports outages', async () => {
  const calls = [];
  const route = authProxy(async () => { throw Error('down'); }, calls);
  for (const all of [['admin', 'list-users'], ['email-otp', 'send-verification-otp']]) assert.equal((await route.POST(authReq('POST', '/api/auth/' + all.join('/')), { params: Promise.resolve({ all }) })).status, 404);
  assert.equal(calls.length, 0);
  assert.equal((await route.GET(authReq('PUT', '/api/auth/get-session'), { params: Promise.resolve({ all: ['get-session'] }) })).status, 405);
  assert.equal((await route.GET(authReq('GET', '/api/auth/get-session'), { params: Promise.resolve({ all: ['get-session'] }) })).status, 503);
  assert.equal(route.PUT, undefined); assert.equal(route.DELETE, undefined);
  const urls = [];
  const defaults = load('src/app/api/auth/[...all]/route.ts', { 'next/server': { NextResponse: FakeResponse } }, { fetch: async url => { urls.push(String(url)); return { status: 204, headers: new Headers() }; } });
  await defaults.GET(authReq('GET', '/api/auth/get-session'), { params: Promise.resolve({ all: ['get-session'] }) });
  assert.equal(urls[0], 'http://vortex-api:3001/api/auth/get-session');
});
test('proxy forwards cookies and idempotency, never a Bearer; rejects open proxy and cross-origin writes', async () => {
  const calls = [];
  const route = load('src/app/api/v1/[...path]/route.ts', { 'next/server': next, '@/lib/auth/access': { resolveAccess: async () => ({status:'APPROVED'}), AccessFailure: class extends Error {} } }, { process: { env: { FRONTEND_API_URL: 'https://nest.test/api/v1/' } }, fetch: async (url, init) => { calls.push({ url: String(url), init }); return { ok: true, status: 200, text: async () => '{}', headers: { getSetCookie: () => [] } }; } });
  const req = { method: 'POST', nextUrl: new URL('https://vortex.test/api/v1/commands'), headers: new Headers({ origin: 'https://vortex.test', Cookie: 'vortex.session_token=s', 'Idempotency-Key': 'stable' }), text: async () => '{}' };
  await route.POST(req, { params: Promise.resolve({ path: ['commands'] }) });
  assert.equal(calls[0].init.headers.get('Authorization'), null);
  assert.equal(calls[0].init.headers.get('Cookie'), 'vortex.session_token=s');
  assert.equal(calls[0].init.headers.get('Origin'), 'https://vortex.test');
  assert.equal(calls[0].init.headers.get('Idempotency-Key'), 'stable');
  assert.equal((await route.POST(req, { params: Promise.resolve({ path: ['evil'] }) })).status, 404);
  req.headers.set('origin', 'https://evil.test');
  assert.equal((await route.POST(req, { params: Promise.resolve({ path: ['commands'] }) })).status, 403);
  assert.equal(calls.length, 1);
});
test('proxy body limit uses UTF-8 bytes, including multibyte JSON payloads', async () => {
  let forwarded = 0;
  const route = load('src/app/api/v1/[...path]/route.ts', { 'next/server': next, '@/lib/auth/access': { resolveAccess: async () => ({status:'APPROVED'}), AccessFailure: class extends Error {} } }, {
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
  let outcome = { status: 'PENDING_APPROVAL', destination: '/access-pending' };
  class ApiError extends Error { constructor(code) { super(); this.code = code; } }
  const flow = load('src/frontend/auth-flow.ts', { './api': { ApiError, request: async () => { if (outcome instanceof Error) throw outcome; return outcome; } } }, { crypto: require('node:crypto').webcrypto, sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) } });
  const first = flow.saveOnboarding({ email: 'test@example.com', password: 'private', organizationName: 'shop' });
  assert.equal(flow.saveOnboarding({ email: 'test@example.com', password: 'private', organizationName: 'shop' }).idempotencyKey, first.idempotencyKey);
  assert.equal(JSON.stringify(flow.readOnboarding()).includes('private'), false);
  assert.equal(await flow.businessDestination(), '/access-pending');
  outcome = { status: 'APPROVED', destination: '/onboarding' }; assert.equal(await flow.businessDestination(), '/onboarding');
  outcome = { destination: '/app/dashboard' }; await assert.rejects(flow.businessDestination(), /inattendue/);
  outcome = { status: 'ROOT', destination: '/app/dashboard' }; await assert.rejects(flow.businessDestination(), /inattendue/);
  outcome = new ApiError('FORBIDDEN'); await assert.rejects(flow.businessDestination());
  outcome = { status: 'APPROVED', destination: '/app/dashboard' }; assert.equal(await flow.businessDestination(), '/app/dashboard');
  assert.match(flow.authError({ code: 'EMAIL_NOT_VERIFIED' }), /Confirmez/);
  assert.match(flow.authError({ code: 'INVALID_EMAIL_OR_PASSWORD' }), /incorrect/);
  assert.match(flow.authError({ code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' }), /existe/);
  assert.match(flow.authError({ status: 429 }), /patienter/);
  assert.equal(flow.emailNotVerified({ code: 'EMAIL_NOT_VERIFIED', status: 403 }), true);
  assert.equal(flow.parseOnboarding(JSON.stringify(first)).idempotencyKey, first.idempotencyKey);
  assert.equal(flow.parseOnboarding('{broken'), null);
});
test('API propagates onboarding, membership, forbidden and unavailable distinctly', async () => {
  for (const [status, code] of [[409, 'ONBOARDING_REQUIRED'], [403, 'NO_MEMBERSHIP'], [403, 'FORBIDDEN'], [503, undefined], [401, undefined]]) {
    const api = load('src/frontend/api.ts', {}, { fetch: async () => ({ ok: false, status, json: async () => ({ code }) }) });
    await assert.rejects(api.request('session'), e => e.status === status && e.code === code);
  }
});
function authForm(path, sdk, values = {}, identity = null, action = async () => ({})) {
  const calls = [], navigation = [], storage = [];
  const state = [values, path === '/signup' ? 3 : 0, false, '', '', {}, { organization: { name: 'Team' } }, '', false, false];
  const React = { ...require('react'), useState: () => [state.shift(), () => {}], useEffect: () => {}, useRef: value => ({current:value}) };
  const form = load('src/frontend/auth-page.tsx', {
    react: React, 'react/jsx-runtime': require('react/jsx-runtime'), 'next/link': { default: 'a' }, 'next/navigation': { usePathname: () => path, useRouter: () => ({replace: value => navigation.push(value)}) },
    '@/components/layout/app-logo': { AppLogo:'a' },
    'lucide-react': new Proxy({}, { get: () => 'svg' }), './ui': { Alert: 'aside', Field: 'label' },
    './auth-shell': { AuthShell: 'main' }, './auth-fields': { AuthField: 'label', AuthNotice: 'aside' }, './auth-design.module.css': {default:{}}, './types': {roleLabels:{}},
    './api': { api: { auth: async (...args) => { calls.push(args); return action(...args); } } },
    './auth-provider': { pendingLoginKey: 'vortex:pending-login', useAuth: () => ({ user: identity, loading: false, signOut: async () => { if (sdk.signOut) await sdk.signOut(); } }) },
    '@/lib/auth/client': { getAuthClient: () => sdk },
    './form-schemas': shared('src/frontend/form-schemas.ts'), './auth-flow': { authError: e => e.code, emailNotVerified: e => e.code === 'EMAIL_NOT_VERIFIED', businessDestination: async () => '/app/dashboard', saveOnboarding: () => ({ payload: { organizationName: 'Shop' }, idempotencyKey: 'stable' }), readOnboarding: () => null },
  }, { location: { origin: 'https://vortex.test', search: '?token=invitation', protocol: 'https:', assign: value => navigation.push(value) }, URLSearchParams, sessionStorage: {setItem(calls_key, value){ storage.push([calls_key, value]); }}, document: { cookie: '' }, requestAnimationFrame: () => {} });
  const tree = form.AuthScreen({path});
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) { const match = find(child, predicate); if (match) return match; }
    return null;
  }
  return { storage, submit: () => find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} }), google: () => find(tree, node => node.type === 'button' && Array.isArray(node.props.children) && node.props.children.some(child => typeof child === 'string' && child.includes('Continuer avec Google'))).props.onClick(), calls, navigation };
}
test('email login accepts session, rejects invalid and unverified identities', async () => {
  for (const code of [null, 'INVALID_EMAIL_OR_PASSWORD', 'EMAIL_NOT_VERIFIED']) {
    let submitted;
    const form = authForm('/login', { signIn: { email: async input => { submitted = input; return { data: code ? null : { user: { id: 'one' } }, error: code ? { code } : null }; } } }, { email: 'user@example.com', password: 'password' });
    await form.submit(); assert.equal(submitted.email, 'user@example.com');
    assert.equal(form.navigation.length, code === 'INVALID_EMAIL_OR_PASSWORD' ? 0 : 1);
    if (code === 'EMAIL_NOT_VERIFIED') assert.equal(form.navigation[0], '/verify-email');
  }
});
test('signup stores the access request and onboarding draft on the user and awaits email verification', async () => {
  let input;
  const form = authForm('/signup', { signUp: { email: async value => { input = value; return { data: { token: null, user: {} }, error: null }; } } }, { email: 'user@example.com', password: 'password-12345', name: 'Owner', organizationName: 'Shop', phone: '+229', country: 'Bénin', currency: 'XOF', timezone: 'Africa/Porto-Novo', storeName: 'Main', city: 'Cotonou' });
  await form.submit(); assert.equal(form.calls.length, 0);
  assert.equal(input.callbackURL, '/verify-email');
  assert.equal(input.accessRequest, true); assert.equal(input.company, 'Shop'); assert.equal(input.phone, '+229'); assert.equal(input.name, 'Owner');
  assert.equal(typeof input.onboarding, 'string');
  assert.equal(JSON.parse(input.onboarding).payload.organizationName, 'Shop');
  assert.equal(input.onboarding.includes('password-12345'), false);
  assert.equal('accessStatus' in input, false);
  assert.equal(form.navigation[0], '/verify-email');
  const failing = authForm('/signup', { signUp: { email: async () => ({ data: null, error: { code: 'USER_ALREADY_EXISTS' } }) } }, { email: 'user@example.com', password: 'password-12345', name: 'Owner', organizationName: 'Shop' });
  await failing.submit(); assert.equal(failing.navigation.length, 0);
});
test('forgot password sends a reset link to /reset-password and Google uses Better Auth social sign-in', async () => {
  let reset, social;
  await authForm('/forgot-password', { requestPasswordReset: async input => { reset = input; return { error: null }; } }, { email: 'user@example.com' }).submit();
  assert.equal(reset.email, 'user@example.com'); assert.equal(reset.redirectTo, '/reset-password');
  const login = authForm('/login', { signIn: { social: async input => { social = input; return { error: null }; } } });
  await login.google();
  assert.equal(social.provider, 'google'); assert.equal(social.callbackURL, '/access-pending');
  assert.deepEqual(login.storage[0], ['vortex:pending-login', 'google']);
});
test('verify-email resends the link with a /verify-email callback', async () => {
  let sent;
  await authForm('/verify-email', { sendVerificationEmail: async input => { sent = input; return { error: null }; } }, { email: 'user@example.com' }).submit();
  assert.deepEqual({ ...sent }, { email: 'user@example.com', callbackURL: '/verify-email' });
});
test('invitation accepts only after identity; existing and new identities are separate', async () => {
  for (const [identity, newAccount] of [[{ email: 'user@example.com' }, 'no'], [null, 'no']]) {
    const form = authForm('/invite/activate', { signIn: { email: async () => ({ data: { user: {} }, error: null }) } }, { email: 'user@example.com', password: 'private-123456', newAccount }, identity);
    await form.submit();
    assert.deepEqual(form.calls[0][0], 'activate');
    assert.equal(form.calls[0][1].token, 'invitation');
    assert.equal('password' in form.calls[0][1], false);
    assert.equal(form.navigation[0], '/app/dashboard');
  }
  let signup;
  const created = authForm('/invite/activate', { signUp: { email: async input => { signup = input; return { data: {}, error: null }; } } }, { email: 'user@example.com', password: 'private-123456', newAccount: 'yes' }, null);
  await created.submit();
  assert.equal(created.calls.length, 0, 'a new account cannot activate before verifying its email');
  assert.equal(signup.callbackURL, '/invite/activate?token=invitation');
  assert.equal(created.navigation.length, 0);
  const form = authForm('/invite/activate', {}, {}, { email: 'user@example.com' }, async () => { throw Error('expired'); });
  await form.submit(); assert.equal(form.navigation.length, 0);
});
test('reset submits the token and new password to Better Auth', async () => {
  for (const failed of [false, true]) {
    let updated, signedOut = 0;
    const form = authForm('/reset-password', { resetPassword: async input => { updated = input; return { error: failed ? {} : null }; }, signOut: async () => { signedOut++; } }, { password: 'new-password-123', confirmation: 'new-password-123' }, null);
    await form.submit();
    assert.equal(updated.newPassword, 'new-password-123'); assert.equal(updated.token, 'invitation');
    assert.equal(signedOut, 0);
  }
});
test('AuthProvider loads the Better Auth session, signs out and records a pending login preference', async () => {
  const setters = [], effects = []; let signedOut = false, removed, cookie = '';
  const storage = new Map([['vortex:pending-login', 'google']]);
  const React = { ...require('react'), useState: initial => [initial, value => setters.push(value)], useEffect: fn => effects.push(fn) };
  const provider = load('src/frontend/auth-provider.tsx', {
    react: React, 'react/jsx-runtime': require('react/jsx-runtime'), 'next/navigation': { usePathname: () => '/app/dashboard' },
    '@/lib/auth/client': { getAuthClient: () => ({
      getSession: async () => ({ data: { user: { id: 'one', emailVerified: true } }, error: null }),
      signOut: async () => { signedOut = true; return { error: null }; },
    }) },
  }, { sessionStorage: { getItem: key => storage.get(key) ?? null, removeItem: key => { removed = key; storage.delete(key); } }, document: { get cookie() { return cookie; }, set cookie(value) { cookie = value; } }, location: { protocol: 'https:' } });
  const tree = provider.AuthProvider({ children: null }); const cleanup = effects[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(setters[0].id, 'one');
  assert.match(cookie, /^vortex_last_login=google;/); assert.match(cookie, /Secure/);
  await tree.props.value.signOut(); assert.equal(signedOut, true); assert.equal(removed, 'vortex:onboarding');
  assert.equal(setters.includes(null), true);
  cleanup();
});

test('initial live workspace and organization changes let NestJS choose the default UUID store', async () => {
  const calls = [];
  const api = load('src/frontend/api.ts', {}, { fetch: async (url) => { calls.push(url); return { ok: true, json: async () => ({}) }; } });
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
  const api=load('src/frontend/api.ts',{},{fetch:async(url)=>{
    calls.push(url);const page=new URL(url,'http://localhost').searchParams.get('page');
    if(!page){attempt++;return {ok:true,json:async()=>({session:{organization:{id:'org'}},data:{products:[{id:attempt===1?'stale':'first'}],sales:[]},pagination:{page:1,pageSize:1,hasMore:true,snapshotVersion:String(attempt)}})};}
    if(attempt===1)return{ok:false,status:409,json:async()=>({})};
    return{ok:true,json:async()=>({session:{organization:{id:'org'}},data:{products:[{id:'second'}],sales:[]},pagination:{page:2,pageSize:1,hasMore:false,snapshotVersion:'2'}})};
  }});
  const result=await api.api.snapshot('store','2026-10-01','2026-10-06');
  assert.deepEqual(JSON.parse(JSON.stringify(result.data.products)),[{id:'first'},{id:'second'}]);assert.equal(calls.length,4);assert.ok(calls[3].includes('snapshotVersion=2'));
});
test('business validation displays the precise French form error', async()=>{
 const api=load('src/frontend/api.ts',{},{fetch:async()=>({ok:false,status:422,json:async()=>({fields:{_form:'Ouvrez la caisse avant un paiement en espèces.'}})})});
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
 assert.equal(policy.accessDecision(true,undefined,true).status,"PENDING_APPROVAL");
 assert.equal(policy.accessDecision(true,'SUSPENDED',true).destination,'/access-pending');
 assert.equal(policy.parseAccessStatus('nonsense'),'PENDING_APPROVAL');
 assert.equal(policy.parseAccessStatus(undefined),undefined);
 assert.equal(policy.parseAccessStatus('APPROVED'),'APPROVED');
});
function accessWith(responses, calls = []) {
 return load('src/lib/auth/access.ts', { 'server-only': {}, '@/lib/access-policy': load('src/lib/access-policy.ts') },
  { process: { env: { FRONTEND_API_URL: 'https://nest.test/api/v1/' } }, fetch: async (url, init) => {
   calls.push({ url: String(url), init });
   const next = responses.shift();
   if (next instanceof Error) throw next;
   return { ok: next.status >= 200 && next.status < 300, status: next.status, json: async () => next.body ?? {} };
  } });
}
const cookieReq = cookie => ({ headers: new Headers(cookie ? { cookie } : {}) });
test('access distinguishes a backend outage (503) from an invalid session (401)', async () => {
 await assert.rejects(accessWith([]).resolveAccess(cookieReq()), e => e.status === 401 && e.code === 'UNAUTHENTICATED');
 for (const response of [{ status: 401 }, { status: 400 }, { status: 403 }, { status: 429 }, { status: 500 }, { status: 503 }, new Error('network')]) {
  const invalid = response.status === 401;
  await assert.rejects(accessWith([response]).resolveAccess(cookieReq('vortex.session_token=s')),
   error => error.status === (invalid ? 401 : 503) && error.code === (invalid ? 'UNAUTHENTICATED' : 'ACCESS_UNAVAILABLE'));
 }
 await assert.rejects(load('src/lib/auth/access.ts', { 'server-only': {}, '@/lib/access-policy': load('src/lib/access-policy.ts') }, { fetch: async () => ({}) }).resolveAccess(cookieReq('c=1')), e => e.status === 503);
});
test('resolveAccess maps backend statuses and relays the session cookie (PENDING_EMAIL, APPROVED matrix)', async () => {
 for (const [status, destination] of [['PENDING_EMAIL', '/verify-email'], ['PENDING_APPROVAL', '/access-pending'], ['CONTACTED', '/access-pending'], ['REJECTED', '/access-pending'], ['SUSPENDED', '/access-pending'], ['nonsense', '/access-pending']]) {
  const calls = [];
  const decision = await accessWith([{ status: 200, body: { status } }], calls).resolveAccess(cookieReq('vortex.session_token=s'));
  assert.equal(decision.destination, destination); assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://nest.test/api/v1/access'); assert.equal(calls[0].init.headers.Cookie, 'vortex.session_token=s');
  assert.equal(calls[0].init.headers.Authorization, undefined);
 }
 const approved = { status: 200, body: { status: 'APPROVED' } };
 const outcomes = [
  [{ status: 200, body: { stores: [{ id: 'one' }] } }, '/app/dashboard'], [{ status: 200, body: { stores: [] } }, '/onboarding'],
  [{ status: 403, body: { code: 'ONBOARDING_REQUIRED' } }, '/onboarding'], [{ status: 403, body: { code: 'NO_MEMBERSHIP' } }, '/onboarding?state=no_membership'],
  [{ status: 403, body: { code: 'FORBIDDEN' } }, '/access-pending'],
 ];
 for (const [session, destination] of outcomes) {
  const calls = [];
  assert.equal((await accessWith([approved, session], calls).resolveAccess(cookieReq('c=1'))).destination, destination);
  assert.equal(calls[1].url, 'https://nest.test/api/v1/session'); assert.equal(calls[1].init.headers.Cookie, 'c=1');
 }
 await assert.rejects(accessWith([approved, { status: 401 }]).resolveAccess(cookieReq('c=1')), e => e.status === 401);
 await assert.rejects(accessWith([approved, { status: 500 }]).resolveAccess(cookieReq('c=1')), e => e.status === 503);
});
test('proxy refuses pending onboarding and business access before forwarding', async()=>{
 for(const status of ['PENDING_EMAIL','PENDING_APPROVAL','CONTACTED','REJECTED','SUSPENDED']) {
  let calls=0;
  const route=load('src/app/api/v1/[...path]/route.ts',{'next/server':next,'@/lib/auth/access':{resolveAccess:async()=>({status}),AccessFailure:class extends Error{}}},{process:{env:{FRONTEND_API_URL:'https://nest.test/api/v1/'}},fetch:async()=>{calls++;}});
  const req={method:'POST',nextUrl:new URL('https://vortex.test/api/v1/onboarding'),headers:new Headers({origin:'https://vortex.test'})};
  for(const path of ['onboarding','workspace','commands']) assert.equal((await route.POST(req,{params:Promise.resolve({path:[path]})})).status,403);
  assert.equal(calls,0);
 }
});

test('Back Admin proxy forwards the session cookie to NestJS and refuses cross-origin writes', async () => {
  const calls=[];
  const route=load('src/app/api/admin/access-requests/route.ts', { 'next/server':next },{process:{env:{FRONTEND_API_URL:'https://nest.test/api/v1/'}},fetch:async(url,init)=>{calls.push({url:String(url),init});return{status:403,json:async()=>({error:'Accès refusé.'})};}});
  const req={method:'POST',headers:new Headers({origin:'https://vortex.test'}),nextUrl:new URL('https://vortex.test/api/admin/access-requests'),json:async()=>({status:'APPROVED'})};
  assert.equal((await route.POST(req)).status,401);
  req.headers.set('cookie','vortex.session_token=fixture');assert.equal((await route.POST(req)).status,403);
  assert.equal(calls[0].url,'https://nest.test/api/v1/admin/access-requests');
  assert.equal(calls[0].init.headers.Cookie,'vortex.session_token=fixture');
  assert.equal(calls[0].init.headers.Authorization,undefined);
  req.headers.set('origin','https://evil.test');assert.equal((await route.POST(req)).status,403);assert.equal(calls.length,1);
});
