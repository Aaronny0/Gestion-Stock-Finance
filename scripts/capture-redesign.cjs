// Run against a local preview. PLAYWRIGHT_MODULE may point to an installed runtime.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome', args:['--no-sandbox']});
  try {
    const page = await browser.newPage({locale:'fr-FR', viewport:{width:1440,height:1000}});
    const base = process.env.TEST_BASE_URL || 'http://localhost:3101';
    fs.mkdirSync('output/redesign',{recursive:true});
    await page.goto(base + '/demo');
    await page.getByRole('heading',{name:/Bonjour/}).waitFor();
    await page.locator('.recharts-surface').first().waitFor();
    await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
    await page.screenshot({path:'public/product-dashboard.png'});
    await page.screenshot({path:'output/redesign/dashboard-desktop.png',fullPage:true});
    for (const [path,name] of [['/','public-desktop'],['/login','login-desktop'],['/demo/stock','stock-desktop']]) {
      await page.goto(base + path); await page.locator('main h1').waitFor();
      await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
      await page.screenshot({path:`output/redesign/${name}.png`,fullPage:true});
    }
    await page.setViewportSize({width:375,height:812});
    for (const [path,name] of [['/demo','dashboard-mobile'],['/signup','signup-mobile']]) {
      await page.goto(base + path); await page.locator('main h1').waitFor();
      await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
      await page.screenshot({path:`output/redesign/${name}.png`,fullPage:true});
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
