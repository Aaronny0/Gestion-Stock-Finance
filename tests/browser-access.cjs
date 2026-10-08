const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const {installBrowserIdentity} = require('./browser-auth-fixture.cjs');
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
(async()=>{
  const browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',args:['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport:{width:1280,height:900}});
    const calls=[];page.on('request',r=>{if(/\/api\/v1\/|\/auth\/v1\//.test(r.url()))calls.push(r.url());});
    await page.goto(base+'/demo');await page.getByRole('heading',{name:/Bonjour/}).waitFor();
    await page.locator('[data-qa="workspace-sidebar"]').getByRole('button',{name:'Opérations',exact:true}).click();
    await page.getByRole('link',{name:'Caisse / Vendre',exact:true}).click();
    await page.locator('[data-qa="product-card"]').first().click();
    assert.equal(await page.locator('[data-qa="cart-item"]').count(),1);
    assert.deepEqual(calls,[], 'Demo must not contact business or identity APIs');
    await page.goto(base+'/');await page.getByRole('heading',{level:1}).waitFor();
    assert.equal(await page.locator('[data-qa="workspace-sidebar"]').count(),0);
    assert.ok(await page.getByRole('link',{name:'Demander un accès',exact:true}).count());
    await installBrowserIdentity(page,base);
    let status='PENDING_APPROVAL', destination='/access-pending';
    await page.route('**/api/v1/access',r=>r.fulfill({json:{status,destination}}));
    await page.goto(base+'/onboarding');await page.waitForURL('**/access-pending');
    await page.getByRole('heading',{name:'Votre demande suit son cours.'}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Créer mon espace',exact:true}).count(),0);
    await page.getByRole('heading',{name:'Complétez votre demande'}).waitFor();
    status='SUSPENDED';await page.reload();await page.getByRole('heading',{name:'Votre accès est suspendu.'}).waitFor();
    status='APPROVED';destination='/onboarding';await page.reload();await page.waitForURL('**/onboarding');
    await page.getByRole('button',{name:'Créer mon espace',exact:true}).waitFor();
    assert.ok(await page.getByRole('button',{name:'Créer mon espace',exact:true}).isEnabled());
    console.log('Access QA: demo isolation, public shell, pending onboarding block, Google completion, suspended state and approved onboarding passed.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
