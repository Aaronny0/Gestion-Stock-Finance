// Isolated visual regression: no form submissions or real Auth requests.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { installBrowserIdentity, user } = require('./browser-auth-fixture.cjs');
const base = process.env.TEST_BASE_URL || 'http://localhost:3100';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/google-chrome',
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.route('**/auth/v1/settings', r => r.fulfill({ json: { external: { google: true } } }));
    await page.route('**/auth/v1/user', r => r.fulfill({ json: user }));
    await page.route('**/api/v1/access', r => r.fulfill({ json: { status: 'PENDING_APPROVAL', destination: '/access-pending' } }));
    await page.route('**/api/v1/auth/invitation', r => r.fulfill({ json: { organization: { name: 'Équipe QA' }, role: 'cashier' } }));
    let checked = 0;
    async function checkActions(route) {
      const actions = page.locator('[class*="auth-design"]:is(a, button)').filter({ visible: true });
      for (const action of await actions.all()) {
        if (await action.isDisabled()) continue;
        await page.mouse.move(0, 0);
        await action.evaluate(el => el.blur());
        const style = () => action.evaluate(el => {
          const css = getComputedStyle(el);
          return { color: css.color, background: css.backgroundColor, outline: css.outlineStyle, width: parseFloat(css.outlineWidth), focused: el.matches(':focus-visible'), decoration: css.textDecorationLine };
        });
        const normal = await style();
        await page.keyboard.press('Tab');
        await action.focus();
        const focused = await style();
        assert.equal(focused.color, normal.color, `${route}: text changes on keyboard focus`);
        assert.ok(focused.focused && focused.outline !== 'none' && focused.width > 0, `${route}: missing keyboard focus indicator`);
        await action.hover();
        const hovered = await style();
        if ((await action.getAttribute('class')).includes('_primary')) {
          assert.equal(hovered.color, 'rgb(250, 252, 252)', `${route}: primary text disappears on hover + focus`);
          assert.equal(hovered.decoration, 'none', `${route}: primary link is underlined`);
        }
        checked++;
      }
    }
    for (const width of [375, 768, 959, 960, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/invite/activate?token=qa']) {
        await page.goto(base + route);
        await page.getByRole('heading', { level: 1 }).waitFor();
        if (route === '/login') await page.getByRole('button', { name: 'Continuer avec Google', exact: true }).waitFor();
        if (route === '/reset-password') await page.getByRole('alert').filter({ hasText: 'Lien invalide ou expiré' }).waitFor();
        if (route.startsWith('/invite')) await page.getByText('Équipe QA', { exact: true }).waitFor();
        await checkActions(route);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}: overflow at ${width}px`);
      }
    }
    await installBrowserIdentity(page, base);
    for (const route of ['/verify-email', '/reset-password', '/invite/activate?token=qa']) {
      await page.goto(base + route);
      if (route === '/verify-email') await page.getByRole('link', { name: 'Consulter mon accès' }).waitFor();
      if (route === '/reset-password') await page.getByLabel('Nouveau mot de passe', { exact: true }).waitFor();
      if (route.startsWith('/invite')) await page.getByRole('button', { name: 'Utiliser un autre compte' }).waitFor();
      await checkActions(route);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(base + '/verify-email');
    await page.getByRole('link', { name: 'Consulter mon accès' }).waitFor();
    await checkActions('/verify-email (reduced motion)');
    console.log(`Auth focus QA passed: ${checked} controls, six routes, five viewports, confirmed email, password reset, Google and invitation actions.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
