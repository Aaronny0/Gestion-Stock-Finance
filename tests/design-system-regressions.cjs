// Isolated API fixtures validate presentation without touching a real workspace.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { createDemo } = require('../src/frontend/demo.ts');
const { money } = require('../src/frontend/accounting.ts');
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const snapshot = createDemo();
    snapshot.session.organization.currency = 'EUR';
    const template = snapshot.data.sales[0];
    snapshot.data.sales = Array.from({ length: 25 }, (_, i) => ({ ...template, id: `qa-sale-${i}`, reference: `QA-${String(i).padStart(3, '0')}`, storeId: 's1', date: new Date().toISOString() }));
    await page.route('**/api/v1/workspace?*', route => route.fulfill({ json: snapshot }));
    await page.route('**/api/v1/session', route => route.fulfill({ json: snapshot.session }));
    await page.goto(base + '/stock');
    const row = page.getByRole('row', { name: 'Ouvrir le détail p0', exact: true });
    await row.waitFor();
    assert.ok((await row.innerText()).includes(money(snapshot.data.products[0].price, 'EUR')), 'Stock uses the workspace currency and integer minor units');
    const checkbox = row.getByRole('checkbox');
    await checkbox.focus();
    await page.keyboard.press('Space');
    assert.equal(await checkbox.getAttribute('data-state'), 'checked');
    assert.ok(page.url().endsWith('/stock'), 'Space selects without navigating to the product');
    await page.goto(base + '/sales');
    await page.getByRole('button', { name: 'Page suivante', exact: true }).click();
    await page.getByText('Page 2 sur 3', { exact: true }).waitFor();
    const secondPageRow = page.getByRole('row', { name: 'Ouvrir le détail qa-sale-10', exact: true });
    await secondPageRow.click();
    await page.waitForURL('**/sales/qa-sale-10');
    await page.getByRole('button', { name: 'Revenir à la page précédente' }).click();
    await page.waitForURL('**/sales');
    await secondPageRow.waitFor();
    assert.equal(await page.getByText('Page 2 sur 3', { exact: true }).count(), 1, 'Pagination survives a detail round-trip');
    assert.deepEqual(errors, []);
    console.log('3 regression checks passed: workspace currency, checkbox keyboard activation, pagination restoration.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
