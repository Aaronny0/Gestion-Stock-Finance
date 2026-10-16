// Real end-to-end check: Next.js (production) -> /api/auth/* relay -> vortex-backend (Better Auth) -> PostgreSQL + SMTP sink.
// Requires Docker, a built ../vortex-backend (override with VORTEX_BACKEND_DIR) and a production build here (pnpm build).
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
    r = await admin.call('/api/v1/admin/access-requests', { method: 'POST', body: { id: found.id, decisionId: randomUUID(), expectedStatus: 'PENDING_APPROVAL', status: 'APPROVED', reason: '' } }); assert.equal(r.status, 201, JSON.stringify(r.json));
    r = await user.call('/api/auth/sign-in/email', { method: 'POST', body: { email, password: newPassword } }); assert.equal(r.status, 200);
    r = await user.call('/api/v1/access'); assert.deepEqual(r.json, { status: 'APPROVED', destination: '/onboarding' });
    console.log('Auth E2E passed: signup, EMAIL_NOT_VERIFIED, verification link via relay, session cookie, /api/v1/access (401/PENDING_APPROVAL/APPROVED), update-user guard, reset password, blocked admin routes.');
  } finally { next?.kill(); stack.stop(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
