const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || "/opt/google/chrome/chrome",
    args: ["--no-sandbox"],
  });
  fs.mkdirSync("output/responsive-qa", { recursive: true });
  const checks = [],
    errors = [];
  for (const [width, height] of [
    [360, 800],
    [820, 1180],
    [1024, 768],
    [844, 390],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      hasTouch: true,
      isMobile: width < 768,
    });
    page.setDefaultTimeout(20000);
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/demo");
    await page.locator(".workspace-main h1").waitFor();
    await page
      .getByRole("button", { name: "Ouvrir le menu", exact: true })
      .click();
    const menu = page.getByRole("dialog", { name: "Menu de navigation" });
    await menu.waitFor();
    assert.equal(
      await page.locator(".workspace-body").getAttribute("inert"),
      "",
    );
    const links = await menu
      .locator(".nav-item")
      .evaluateAll((els) =>
        els.map((el) => ({
          name: el.textContent.trim(),
          url: el.getAttribute("href"),
        })),
      );
    await page.keyboard.press("Escape");
    await menu.waitFor({ state: "hidden" });
    assert.equal(
      await page
        .getByRole("button", { name: "Ouvrir le menu", exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    for (const link of links) {
      await page
        .getByRole("button", { name: "Ouvrir tous les menus", exact: true })
        .click();
      const current = page.locator(
        `.workspace-sidebar .nav-item[href="${link.url}"]`,
      );
      await current.click();
      await page.waitForURL("**" + link.url);
      await page.locator(".workspace-main h1").waitFor();
      await menu.waitFor({ state: "hidden" });
      assert.equal(
        await page.locator(".workspace-sidebar").getAttribute("inert"),
        "",
      );
      assert.equal(await current.getAttribute("aria-current"), "page");
    }
    checks.push(
      `${width}x${height}: ${links.length} menus accessibles, actifs et refermés après navigation; Échap et focus`,
    );
    // direct deep link has a useful parent even with no in-app history
    await page.goto(base + "/demo/products/p0");
    await page
      .getByRole("button", { name: "Revenir à la page précédente" })
      .click();
    await page.waitForURL("**/demo/stock");
    const search = page.getByRole("textbox", { name: "Rechercher dans stock" });
    await search.fill("iPhone");
    await page.getByRole("button", { name: "Ouvrir le détail p0" }).click();
    await page.waitForURL("**/demo/products/p0");
    await page
      .getByRole("button", { name: "Revenir à la page précédente" })
      .click();
    await page.waitForURL("**/demo/stock");
    assert.equal(await search.inputValue(), "iPhone");
    await page.evaluate(() => history.forward());
    await page.waitForURL("**/demo/products/p0");
    await page.evaluate(() => history.back());
    await page.waitForURL("**/demo/stock");
    assert.equal(await search.inputValue(), "iPhone");
    checks.push(
      `${width}px: retour direct, précédent/suivant et recherche restaurée`,
    );
    await page.getByRole("link", { name: "Vendre", exact: true }).click();
    await page.locator(".product-card").first().click();
    page.once("dialog", (d) => d.dismiss());
    await page.evaluate(() => history.back());
    await page.waitForTimeout(300);
    assert.ok(page.url().endsWith("/demo/pos"));
    assert.equal(await page.locator(".cart-item").count(), 1);
    page.once("dialog", (d) => d.accept());
    await page.evaluate(() => history.back());
    await page.waitForURL("**/demo/stock");
    assert.equal(await search.inputValue(), "iPhone");
    await page.evaluate(() => history.forward());
    await page.waitForURL("**/demo/pos");
    assert.equal(await page.locator(".cart-item").count(), 0);
    checks.push(
      `${width}px: annuler Retour conserve le panier; accepter ne casse pas Suivant`,
    );
    // long modal remains usable in portrait and low-height landscape
    await page.getByRole("button", { name: "Ouvrir tous les menus" }).click();
    await page.locator('.nav-item[href="/demo/team"]').click();
    await page.getByRole("button", { name: /Inviter/ }).click();
    const dialog = page.locator("dialog[open]");
    await dialog.waitFor();
    const bounds = await dialog.boundingBox();
    assert.ok(
      bounds.x >= 0 &&
        bounds.x + bounds.width <= width + 1 &&
        bounds.y >= 0 &&
        bounds.y + bounds.height <= height + 1,
    );
    assert.equal(
      await page.evaluate(() => document.body.style.overflow),
      "hidden",
    );
    await page.getByRole("button", { name: "Fermer", exact: true }).click();
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
    await page.screenshot({
      path: `output/responsive-qa/team-${width}.png`,
      fullPage: true,
    });
    checks.push(
      `${width}px: formulaire dans la fenêtre et défilement arrière bloqué`,
    );
    await page.close();
  }
  const rolePage=await browser.newPage({viewport:{width:820,height:1180},hasTouch:true});
  rolePage.setDefaultTimeout(15000);
  rolePage.on("pageerror",e=>errors.push(e.message));
  await rolePage.goto(base+"/demo");await rolePage.locator(".workspace-main h1").waitFor();
  for(const role of ["manager","cashier","stock","accountant"]) {
    await rolePage.getByRole("combobox",{name:"Rôle de démonstration"}).selectOption(role);
    await rolePage.getByRole("button",{name:"Ouvrir tous les menus"}).click();
    const links=await rolePage.locator(".workspace-sidebar .nav-item").evaluateAll(els=>els.map(el=>el.getAttribute("href")));
    await rolePage.keyboard.press("Escape");
    for(const url of links) {await rolePage.getByRole("button",{name:"Ouvrir tous les menus"}).click();await rolePage.locator(`.nav-item[href="${url}"]`).click();await rolePage.waitForURL("**"+url);await rolePage.locator(".workspace-main h1").waitFor();assert.equal(await rolePage.getByRole("heading",{name:"Accès réservé"}).count(),0);}
    checks.push(`${role}: ${links.length} menus autorisés ouverts sans accès refusé`);
  }
  await rolePage.close();
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "output/responsive-qa/navigation.json",
    JSON.stringify({ date: new Date().toISOString(), checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
