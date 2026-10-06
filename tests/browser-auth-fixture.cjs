// Supabase identity fixture for UI tests only. No application authentication bypass.
const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'qa@example.test', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
async function installBrowserIdentity(page, base) {
  const url = process.env.QA_SUPABASE_URL;
  if (!url) throw new Error('Run this test via pnpm test:browser:isolated to use a private Auth fixture.');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const encode = data => Buffer.from(JSON.stringify(data)).toString('base64url');
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: 'authenticated', role: 'authenticated', iss: `${url}/auth/v1`, exp: expires, iat: expires - 3600 })}.${Buffer.from('test-only-signature').toString('base64url')}`;
  const session = { access_token: token, refresh_token: 'test-only-refresh', token_type: 'bearer', expires_in: 3600, expires_at: expires, user };
  await page.context().addCookies([{ name: `sb-${new URL(url).hostname.split('.')[0]}-auth-token`, value: `base64-${encode(session)}`, url: base, sameSite: 'Lax' }]);
}
module.exports = { installBrowserIdentity, user };
