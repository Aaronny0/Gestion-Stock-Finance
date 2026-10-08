// Run preview.py first. Playwright is a verification tool, not an app dependency.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = `http://127.0.0.1:${process.env.PREVIEW_PORT || 3217}`;
const files = ['Design System.dc.html', 'Auth.dc.html', 'Tableau de bord.dc.html', 'Ventes.dc.html', 'Rôles et écrans.dc.html', 'Sidebar alternative.dc.html'];

(async () => {
  const browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
    headless: true,
    args: ['--no-sandbox'],
  });
  const results = [], external = [], errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.route('**/*', route => {
      const url = route.request().url();
      if (!url.startsWith(`${origin}/`) && !url.startsWith('data:')) {
        external.push(url);
        return route.abort();
      }
      return route.continue();
    });
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`);
    });
    for (const name of files) {
      const response = await page.goto(`${origin}/claude-original/${encodeURIComponent(name)}`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.body.innerText.length > 200 && !/\{\{[^}]+\}\}/.test(document.body.innerText));
      await page.evaluate(() => document.fonts.ready);
      const unresolved = /\{\{[^}]+\}\}/.test(await page.locator('body').innerText());
      results.push({ name, status: response.status(), unresolved });
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify({ results, external, errors }, null, 2));
  if (results.some(result => result.status !== 200 || result.unresolved) || external.length || errors.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
