// Better Auth identity fixture for UI tests only: /api/auth/get-session is answered in the browser.
// No application authentication bypass: the server never sees this identity.
const user = { id: '00000000-0000-4000-8000-000000000001', email: 'qa@example.test', emailVerified: true, name: 'QA', company: null, phone: null, accessRequest: false, accessStatus: 'PENDING_APPROVAL', onboarding: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
const handlers = new WeakMap();
const sessionBody = () => ({ session: { id: 'qa-session', userId: user.id, token: 'qa-token', expiresAt: new Date(Date.now() + 3600_000).toISOString(), createdAt: user.createdAt, updatedAt: user.updatedAt }, user });
/** Signed-out default: Better Auth answers 200 with a null body. */
async function installSignedOut(page) {
  await page.route('**/api/auth/get-session', route => route.fulfill({ json: null }));
}
async function removeBrowserIdentity(page) {
  const handler = handlers.get(page);
  if (handler) { handlers.delete(page); await page.unroute('**/api/auth/get-session', handler); }
}
async function installBrowserIdentity(page) {
  await removeBrowserIdentity(page);
  const handler = route => route.fulfill({ json: sessionBody() });
  handlers.set(page, handler);
  await page.route('**/api/auth/get-session', handler);
}
module.exports = { installBrowserIdentity, removeBrowserIdentity, installSignedOut, user };
