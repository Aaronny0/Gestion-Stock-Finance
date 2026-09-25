const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.TEST_BASE_URL || "http://localhost:3000";

async function waitWorkspace(page) {
  await page.locator('[data-qa="workspace-main"] h1').waitFor();
}

async function openMobileMenu(page) {
  await page.getByRole("button", { name: "Ouvrir le menu", exact: true }).click();
  const menu = page.getByRole("dialog", { name: "Navigation VORTEX" });
  await menu.waitFor();
  return menu;
}

async function navLinks(page, mobile) {
  if (mobile) {
    const menu = await openMobileMenu(page);
    const links = await menu.locator('[data-qa="nav-item"]').evaluateAll((els) =>
      els.map((el) => ({ name: el.textContent.trim(), url: el.getAttribute("href") })),
    );
    await page.keyboard.press("Escape");
    await menu.waitFor({ state: "hidden" });
    await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Ouvrir le menu");
    return links;
  }
  return page.locator('[data-qa="workspace-sidebar"] [data-qa="nav-item"]').evaluateAll((els) =>
    els.map((el) => ({ name: el.textContent.trim(), url: el.getAttribute("href") })),
  );
}

async function navigateByMenu(page, mobile, url) {
  if (mobile) {
    const menu = await openMobileMenu(page);
    await menu.locator(`[data-qa="nav-item"][href="${url}"]`).click();
    await menu.waitFor({ state: "hidden" });
  } else {
    await page.locator(`[data-qa="workspace-sidebar"] [data-qa="nav-item"][href="${url}"]`).click();
  }
  await page.waitForURL("**" + url);
  await waitWorkspace(page);

  if (mobile) {
    const menu = await openMobileMenu(page);
    const current = menu.locator(`[data-qa="nav-item"][href="${url}"]`);
    assert.equal(await current.getAttribute("aria-current"), "page");
    await page.keyboard.press("Escape");
    await menu.waitFor({ state: "hidden" });
  } else {
    const current = page.locator(`[data-qa="workspace-sidebar"] [data-qa="nav-item"][href="${url}"]`);
    assert.equal(await current.getAttribute("aria-current"), "page");
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || "/opt/google/chrome/chrome",
    args: ["--no-sandbox"],
  });
  fs.mkdirSync("output/responsive-qa", { recursive: true });
  const checks = [];
  const errors = [];

  for (const [width, height] of [
    [360, 800],
    [820, 1180],
    [1024, 768],
    [844, 390],
  ]) {
    const mobile = width < 1024;
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: width < 768 });
    page.setDefaultTimeout(20000);
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto(base + "/demo");
    await waitWorkspace(page);
    const links = await navLinks(page, mobile);
    for (const link of links) await navigateByMenu(page, mobile, link.url);
    checks.push(`${width}x${height}: ${links.length} menus accessibles et états actifs cohérents`);

    await page.goto(base + "/demo/products/p0");
    await page.getByRole("button", { name: "Revenir à la page précédente" }).click();
    await page.waitForURL("**/demo/stock");
    const search = page.getByRole("searchbox", { name: "Rechercher dans stock" });
    await search.fill("iPhone");
    await page.getByLabel("Ouvrir le détail p0").filter({ visible: true }).click();
    await page.waitForURL("**/demo/products/p0");
    await page.getByRole("button", { name: "Revenir à la page précédente" }).click();
    await page.waitForURL("**/demo/stock");
    assert.equal(await search.inputValue(), "iPhone");

    if (width < 768) {
      const sort = page.getByRole("combobox", { name: "Trier stock", exact: true });
      await sort.click();
      await page.getByRole("option", { name: "Produit", exact: true }).click();
      await page.getByRole("button", { name: "Inverser le tri stock" }).click();
      await page.getByLabel("Ouvrir le détail p0").filter({ visible: true }).click();
      await page.waitForURL("**/demo/products/p0");
      await page.getByRole("button", { name: "Revenir à la page précédente" }).click();
      await page.waitForURL("**/demo/stock");
      assert.ok((await sort.innerText()).includes("Produit"));
      assert.ok((await page.getByRole("button", { name: "Inverser le tri stock" }).innerText()).includes("Décroissant"));
    }
    checks.push(`${width}px: retour, recherche${width < 768 ? " et tri mobile" : ""} restaurés`);

    await navigateByMenu(page, mobile, "/demo/pos");
    await page.locator('[data-qa="product-card"]').first().click();
    page.once("dialog", (d) => d.dismiss());
    await page.evaluate(() => history.back());
    await page.waitForTimeout(300);
    assert.ok(page.url().endsWith("/demo/pos"));
    assert.equal(await page.locator('[data-qa="cart-item"]').count(), 1);
    page.once("dialog", (d) => d.accept());
    await page.evaluate(() => history.back());
    await page.waitForURL("**/demo/stock");
    assert.equal(await page.getByRole("searchbox", { name: "Rechercher dans stock" }).inputValue(), "iPhone");
    await page.evaluate(() => history.forward());
    await page.waitForURL("**/demo/pos");
    assert.equal(await page.locator('[data-qa="cart-item"]').count(), 0);
    checks.push(`${width}px: protection contre l’abandon du panier`);

    await navigateByMenu(page, mobile, "/demo/team");
    await page.getByRole("button", { name: /Inviter/ }).click();
    const dialog = page.getByRole("dialog").last();
    await dialog.waitFor();
    const bounds = await dialog.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width + 1 && bounds.y >= 0 && bounds.y + bounds.height <= height + 1);
    await dialog.getByRole("button", { name: "Fermer", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.screenshot({ path: `output/responsive-qa/team-${width}.png`, fullPage: true });
    checks.push(`${width}px: formulaire équipe contenu dans la fenêtre`);
    await page.close();
  }

  const rolePage = await browser.newPage({ viewport: { width: 820, height: 1180 }, hasTouch: true });
  rolePage.setDefaultTimeout(15000);
  rolePage.on("pageerror", (e) => errors.push(e.message));
  await rolePage.goto(base + "/demo");
  await waitWorkspace(rolePage);
  for (const role of ["manager", "cashier", "stock", "accountant"]) {
    await rolePage.getByRole("combobox", { name: "Rôle de démonstration" }).selectOption(role);
    await waitWorkspace(rolePage);
    const links = await navLinks(rolePage, true);
    for (const { url } of links) {
      await navigateByMenu(rolePage, true, url);
      assert.equal(await rolePage.getByRole("heading", { name: "Accès réservé" }).count(), 0);
    }
    checks.push(`${role}: ${links.length} menus autorisés ouverts sans accès refusé`);
  }
  await rolePage.close();

  assert.deepEqual(errors, []);
  fs.writeFileSync("output/responsive-qa/navigation.json", JSON.stringify({ date: new Date().toISOString(), checks, errors }, null, 2));
  console.log(JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
