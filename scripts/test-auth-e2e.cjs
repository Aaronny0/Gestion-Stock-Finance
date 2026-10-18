// Real end-to-end check: Next.js (production) -> /api/auth/* relay -> vortex-backend (Better Auth) -> PostgreSQL + SMTP sink.
// Requires Docker, ../vortex-backend installed with `bun install` + `prisma generate` (override with VORTEX_BACKEND_DIR) and a production build here (pnpm build).
const assert = require('node:assert/strict');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { randomBytes, randomUUID } = require('node:crypto');
const { startStack } = require('./qa-stack.cjs');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class Browser {
  cookies = new Map();
  static count = 0;
  constructor(base, origin) { this.base = base; this.origin = origin; this.ip = `198.51.100.${++Browser.count}`; } // each client has its own address (rate limiting is per IP)
  async call(path, { method = 'GET', body, origin = this.origin, base = this.base } = {}) {
    const res = await fetch(base + path, { method, redirect: 'manual', headers: { 'content-type': 'application/json', 'x-forwarded-for': this.ip, origin, cookie: [...this.cookies].map(([k, v]) => k + '=' + v).join('; ') }, body: body && JSON.stringify(body) });
    const setCookies = res.headers.getSetCookie();
    for (const c of setCookies) { const [pair] = c.split(';'); const [k, ...v] = pair.split('='); if (/Max-Age=0|expires=Thu, 01 Jan 1970/i.test(c) || !v.join('=')) this.cookies.delete(k.trim()); else this.cookies.set(k.trim(), v.join('=')); }
    const text = await res.text(); let json; try { json = JSON.parse(text); } catch {}
    return { status: res.status, json, headers: res.headers, setCookies };
  }
}
const freePort = () => new Promise(resolve => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); }); });

(async () => {
  const appPort = await freePort();
  const stack = await startStack({ appPort });
  let next;
  try {
    next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', String(appPort)], {
      env: { PATH: process.env.PATH, NODE_ENV: 'production', AUTH_API_URL: stack.apiUrl, FRONTEND_API_URL: stack.apiUrl + '/api/v1', APP_URL: stack.appUrl }, stdio: ['ignore', 'ignore', 'inherit'] });
    for (let i = 0; ; i++) {
      if (next.exitCode !== null) throw new Error('Next.js stopped during startup.');
      try { if ((await fetch(stack.appUrl + '/login')).ok) break; } catch {}
      if (i > 80) throw new Error('Next.js did not start.');
      await delay(500);
    }
    const app = stack.appUrl;
    const email = `applicant-${randomUUID().slice(0, 8)}@example.test`, password = randomBytes(12).toString('hex');
    const user = new Browser(app, app);

    // 1. Sign-up through the relay: no session before the email is verified.
    let r = await user.call('/api/auth/sign-up/email', { method: 'POST', body: { email, password, name: 'Test Applicant', company: 'Entreprise Test', phone: '+2290100000000', accessRequest: true, onboarding: JSON.stringify({ payload: { email, organizationName: 'Entreprise Test', storeName: 'Boutique', city: 'Cotonou' }, idempotencyKey: randomUUID() }), callbackURL: '/verify-email' } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(user.cookies.size, 0, 'no session before verification');
    // 2. Login is refused until the email is verified (403 EMAIL_NOT_VERIFIED).
    r = await user.call('/api/auth/sign-in/email', { method: 'POST', body: { email, password } });
    assert.equal(r.status, 403); assert.equal(r.json.code, 'EMAIL_NOT_VERIFIED');
    // 3. The verification link points at this origin, passes through the relay, signs in and redirects.
    let mail = await stack.waitForMail();
    stack.mails.length = 0;
    let link = mail.match(/https?:\/\/[^\s"<]*verify-email[^\s"<]*/)[0].replace(/&amp;/g, '&');
    assert.ok(link.startsWith(app + '/api/auth/verify-email'), 'link on the app origin: ' + link);
    r = await user.call(link.slice(app.length));
    assert.equal(r.status, 302, 'verification redirects'); assert.match(r.headers.get('location'), /\/verify-email$/);
    assert.ok(r.setCookies.some(c => /^vortex\.session_token=/.test(c)), 'session cookie relayed as is');
    assert.ok(r.setCookies.every(c => !/;\s*domain=/i.test(c)), 'each site keeps its own host-only session cookie (no Domain): app and admin sessions stay independent');
    assert.ok(r.setCookies.some(c => /max-age=604800/i.test(c) && /httponly/i.test(c) && /samesite=lax/i.test(c)), 'persistent, HttpOnly, SameSite=Lax');
    // 4. Session and access status via the relay (/api/auth/get-session, /api/v1/access).
    r = await user.call('/api/auth/get-session');
    assert.equal(r.json.user.emailVerified, true); assert.equal(r.json.user.company, 'Entreprise Test'); assert.equal(r.json.user.accessRequest, true);
    r = await user.call('/api/v1/access'); assert.deepEqual(r.json, { status: 'PENDING_APPROVAL', destination: '/access-pending' });
    assert.equal((await new Browser(app, app).call('/api/v1/access')).status, 401, 'no cookie => 401');
    assert.equal((await new Browser(app, app).call('/api/v1/access', { base: app })).json.code, 'UNAUTHENTICATED');
    assert.equal((await user.call('/api/v1/workspace')).status, 403, 'business API refused before approval');
    // accessStatus is not writable by the browser.
    await user.call('/api/auth/update-user', { method: 'POST', body: { accessStatus: 'APPROVED', phone: '+2290111111111' } });
    r = await user.call('/api/v1/access'); assert.equal(r.json.status, 'PENDING_APPROVAL');
    // Sign out / sign in again.
    r = await user.call('/api/auth/sign-out', { method: 'POST', body: {} }); assert.equal(r.status, 200);
    assert.equal((await user.call('/api/auth/get-session')).json, null);
    r = await user.call('/api/auth/sign-in/email', { method: 'POST', body: { email, password } }); assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal((await user.call('/api/v1/access')).json.status, 'PENDING_APPROVAL');
    // 5. Password reset: link -> /reset-password?token=... -> new password.
    stack.mails.length = 0;
    r = await new Browser(app, app).call('/api/auth/request-password-reset', { method: 'POST', body: { email, redirectTo: '/reset-password' } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    mail = await stack.waitForMail();
    link = mail.match(/https?:\/\/[^\s"<]*reset-password[^\s"<]*/)[0].replace(/&amp;/g, '&');
    r = await user.call(link.slice(app.length));
    assert.equal(r.status, 302); const reset = new URL(r.headers.get('location'), app);
    assert.equal(reset.pathname, '/reset-password'); const token = reset.searchParams.get('token'); assert.ok(token);
    const newPassword = randomBytes(12).toString('hex');
    r = await user.call('/api/auth/reset-password', { method: 'POST', body: { newPassword, token } }); assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal((await new Browser(app, app).call('/api/auth/sign-in/email', { method: 'POST', body: { email, password } })).status, 401, 'old password refused');
    assert.equal((await new Browser(app, app).call('/api/auth/sign-in/email', { method: 'POST', body: { email, password: newPassword } })).status, 200);
    // 6. Reserved routes and methods are refused by the relay.
    for (const path of ['/api/auth/admin/list-users', '/api/auth/email-otp/send-verification-otp']) assert.equal((await user.call(path, { method: 'POST', body: {} })).status, 404, path);
    assert.equal((await user.call('/api/auth/get-session', { method: 'PUT', body: {} })).status, 405);
    // 7. Approval decided in the backend (admin one-time code, never reachable through this origin) is seen through the relay.
    const admin = new Browser(stack.apiUrl, 'https://admin.example.test');
    stack.mails.length = 0;
    r = await admin.call('/api/auth/email-otp/send-verification-otp', { method: 'POST', body: { email: 'admin@example.test', type: 'sign-in' } }); assert.equal(r.status, 200, JSON.stringify(r.json));
    const code = (await stack.waitForMail()).match(/\b(\d{6})\b/)[1];
    r = await admin.call('/api/auth/sign-in/email-otp', { method: 'POST', body: { email: 'admin@example.test', otp: code } }); assert.equal(r.status, 200, JSON.stringify(r.json));
    const list = await admin.call('/api/v1/admin/access-requests'); const found = list.json.requests.find(x => x.email === email);
    assert.ok(found && found.status === 'PENDING_APPROVAL');
    assert.equal((await user.call('/api/admin/access-requests')).status, 403, 'applicant cannot list requests via the Next admin proxy');
    r = await admin.call('/api/v1/admin/access-requests', { method: 'POST', body: { id: found.id, decisionId: randomUUID(), expectedStatus: 'PENDING_APPROVAL', status: 'APPROVED', reason: '' } }); assert.equal(r.status, 200, JSON.stringify(r.json));
    // The applicant is told by email, with a link to the login page.
    const approval = await stack.waitForMail(); assert.ok(approval.includes(app + '/login'), 'approval email links to the login page');
    r = await user.call('/api/auth/sign-in/email', { method: 'POST', body: { email, password: newPassword } }); assert.equal(r.status, 200);
    r = await user.call('/api/v1/access'); assert.deepEqual(r.json, { status: 'APPROVED', destination: '/app/dashboard' }, 'approved access lands on the dashboard, where the onboarding modal opens');
    // 8. Onboarding through the relay: an approved identity without a company reaches the dashboard, whose modal creates the space.
    assert.equal((await user.call('/api/v1/session')).json.code, 'ONBOARDING_REQUIRED', 'approved account without company');
    const key = randomUUID();
    const company = { name: 'Test Applicant', organizationName: 'Entreprise E2E', country: 'Bénin', currency: 'XOF', timezone: 'Africa/Porto-Novo', storeName: 'Boutique E2E', city: 'Cotonou' };
    const send = (body, headers = { 'idempotency-key': key }) => fetch(app + '/api/v1/onboarding', { method: 'POST', headers: { 'content-type': 'application/json', origin: app, cookie: [...user.cookies].map(([k, v]) => k + '=' + v).join('; '), ...headers }, body: JSON.stringify(body) }).then(async res => ({ status: res.status, json: await res.json().catch(() => ({})) }));
    assert.equal((await send({ ...company, email: 'autre@example.test' })).status, 422, 'the body never carries an email');
    r = await send(company); assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.user.role, 'owner'); assert.equal(r.json.organization.name, 'Entreprise E2E'); assert.equal(r.json.stores.length, 1);
    const replay = await send(company); assert.equal(replay.status, 200); assert.equal(replay.json.organization.id, r.json.organization.id, 'same key, same company');
    assert.equal((await send({ ...company, organizationName: 'Autre' })).status, 409, 'same key, different content');
    r = await user.call('/api/v1/access'); assert.deepEqual(r.json, { status: 'APPROVED', destination: '/app/dashboard' });
    r = await user.call('/api/v1/workspace?start=2026-10-01&end=2026-10-07'); assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.session.organization.name, 'Entreprise E2E'); assert.equal(r.json.data.products.length, 0);
    assert.equal(r.json.reporting.daily.length, 7); assert.equal(r.json.reporting.kpis.revenue, 0);
    assert.equal((await new Browser(app, app).call('/api/v1/workspace?start=2026-10-01&end=2026-10-07')).status, 401, 'dashboard data needs a session');
    // 9. Stock commands through the relay: catalogue, entry, idempotent replay, validation and tenant isolation.
    const today = new Date(), shift = days => new Date(today.getTime() + days * 86_400_000).toISOString().slice(0, 10);
    const stockPeriod = `start=${shift(-2)}&end=${shift(2)}`;
    r = await user.call(`/api/v1/workspace?${stockPeriod}`); assert.equal(r.status, 200, JSON.stringify(r.json));
    const organizationId = r.json.session.organization.id, storeId = r.json.session.defaultStoreId;
    assert.equal(r.json.data.accounts.length, 12, 'the onboarding creates the 12-account chart'); assert.equal(r.json.data.periods.length, 1);
    const sendCommand = (type, payload, { key = randomUUID(), organization = organizationId } = {}) =>
      fetch(app + '/api/v1/commands', { method: 'POST', headers: { 'content-type': 'application/json', origin: app, 'idempotency-key': key, cookie: [...user.cookies].map(([k, v]) => k + '=' + v).join('; ') }, body: JSON.stringify({ type, storeId, idempotencyKey: key, payload: { organizationId: organization, ...payload } }) })
        .then(async res => ({ status: res.status, json: await res.json().catch(() => ({})) }));
    const product = { brand: 'Apple', model: 'iPhone 15', variant: '128 Go', condition: 'Neuf', price: 425000, threshold: 3, supplierId: '' };
    r = await sendCommand('product.save', product); assert.equal(r.status, 200, JSON.stringify(r.json)); assert.match(r.json.reference, /^PRD-\d{4}-\d{6}$/);
    r = await sendCommand('product.save', product); assert.equal(r.status, 422, JSON.stringify(r.json)); assert.match(r.json.fields._form, /identique/, 'the business message reaches the form through the relay');
    r = await user.call(`/api/v1/workspace?${stockPeriod}`); const created = r.json.data.products.find(p => p.model === 'iPhone 15');
    assert.ok(created && created.quantity === 0 && created.cost === 0, 'a product starts empty');
    const entryKey = randomUUID();
    r = await sendCommand('stock.entry', { productId: created.id, quantity: 3, cost: 100, reason: 'Réception e2e' }, { key: entryKey });
    assert.equal(r.status, 200, JSON.stringify(r.json)); assert.match(r.json.reference, /^ENT-\d{4}-\d{6}$/);
    const entryReference = r.json.reference;
    const replayed = await sendCommand('stock.entry', { productId: created.id, quantity: 3, cost: 100, reason: 'Réception e2e' }, { key: entryKey });
    assert.equal(replayed.status, 200); assert.equal(replayed.json.reference, entryReference, 'same key, same reference');
    r = await user.call(`/api/v1/workspace?${stockPeriod}`);
    const stocked = r.json.data.products.find(p => p.id === created.id);
    assert.equal(stocked.quantity, 3, 'the replay did not add stock twice'); assert.equal(stocked.cost, 100);
    assert.equal(r.json.data.stockEntries.length, 1); assert.equal(r.json.data.stockEntries[0].reference, entryReference); assert.equal(r.json.data.stockEntries[0].amount, 300);
    assert.equal(r.json.data.entries.length, 1); assert.deepEqual(r.json.data.entries[0].lines.map(l => [l.account, l.debit, l.credit]), [['31', 300, 0], ['101', 0, 300]]);
    assert.equal(r.json.data.audit.length, 2, 'one audit line per command');
    r = await sendCommand('stock.entry', { productId: created.id, quantity: 0, cost: 100 }); assert.equal(r.status, 422); assert.ok(r.json.fields.quantity);
    r = await sendCommand('stock.entry', { productId: created.id, quantity: 1, cost: 100 }, { key: entryKey }); assert.equal(r.status, 409, 'same key, different content');
    r = await sendCommand('stock.adjust', { productId: created.id, quantity: 2, reason: 'Casse' }); assert.equal(r.status, 200, JSON.stringify(r.json));
    r = await user.call(`/api/v1/workspace?${stockPeriod}`); assert.equal(r.json.data.products.find(p => p.id === created.id).quantity, 2);
    // Another company is refused (403), without any write.
    r = await sendCommand('product.save', { ...product, model: 'Etranger' }, { organization: randomUUID() }); assert.equal(r.status, 403, JSON.stringify(r.json)); assert.equal(r.json.code, 'FORBIDDEN');
    assert.equal((await new Browser(app, app).call('/api/v1/commands', { method: 'POST', body: {} })).status, 401, 'commands need a session');
    console.log('Auth E2E passed: signup, EMAIL_NOT_VERIFIED, verification link via relay, session cookie, /api/v1/access (401/PENDING_APPROVAL/APPROVED), update-user guard, reset password, blocked admin routes, onboarding, dashboard workspace, stock commands (product, entry, adjust, replay, conflict, foreign company).');
  } finally { next?.kill(); stack.stop(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
