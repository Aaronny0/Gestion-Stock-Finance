// Audit de rendu des écrans métier (D27–D30) : aucun débordement horizontal, barres d'outils d'une seule hauteur,
// modales centrées au pied visible, focus initial hors de la croix, garde de fermeture et retour du focus.
// Usage : node tests/ui-audit.cjs [route…] — sans argument, toutes les routes ; TEST_BASE_URL pour le serveur.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const ROUTES = [
  "/demo", "/demo/pos", "/demo/stock", "/demo/products/p0", "/demo/stock/replenishment", "/demo/sales", "/demo/sales/sale0",
  "/demo/sales/credits", "/demo/trade", "/demo/buyback", "/demo/purchases", "/demo/suppliers", "/demo/clients", "/demo/cash",
  "/demo/expenses", "/demo/payments", "/demo/team", "/demo/audit", "/demo/settings", "/demo/accounting/journals",
  "/demo/accounting/ledger", "/demo/analytics",
];
const MODALS = [
  ["/demo/stock", "Nouvelle entrée"],
  ["/demo/purchases", "Nouvel achat"],
  ["/demo/team", "Inviter un membre"],
  ["/demo/expenses", "Nouvelle dépense"],
  ["/demo/accounting/journals", "Nouvelle écriture"],
  ["/demo/stock", "Importer"],
];
const selected = process.argv.slice(2);
const routes = selected.length ? ROUTES.filter((r) => selected.includes(r)) : ROUTES;
const modals = MODALS.filter(([r]) => routes.includes(r));
const failures = [];
const fail = (where, message) => failures.push(`${where} : ${message}`);

async function open(page, route) {
  await page.goto(base + route, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(400);
}

async function trigger(page, label) {
  const direct = page.getByRole("button", { name: label, exact: true }).first();
  if (await direct.isVisible().catch(() => false)) return direct;
  await page.getByRole("button", { name: "Autres actions" }).first().click();
  return page.getByRole("menuitem", { name: label }).first();
}

async function auditLayout(page, width, route) {
  const where = `${width} ${route}`;
  const m = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    toolbars: [...document.querySelectorAll("[data-list-toolbar]")].map((bar) => [
      ...new Set(
        [...bar.querySelectorAll("button, input, [role=combobox]")]
          .filter((el) => el.offsetParent && el.getAttribute("type") !== "checkbox")
          .map((el) => Math.round(el.getBoundingClientRect().height)),
      ),
    ]),
  }));
  if (m.overflow > 0) fail(where, `débordement horizontal de ${m.overflow} px`);
  m.toolbars.forEach((heights, i) => { if (heights.length > 1) fail(where, `barre d'outils ${i} : hauteurs ${heights.join("/")}`); });
}

async function auditModal(page, size, route, label) {
  const where = `${size.width}x${size.height} ${route} « ${label} »`;
  await open(page, route);
  let button = await trigger(page, label);
  // Une action ouverte depuis le menu « ⋯ » rend le focus au bouton du menu, l'élément de menu ayant disparu.
  const opener = await button.evaluate((el) => (el.getAttribute("role") === "menuitem" ? "Autres actions" : el.getAttribute("aria-label") || el.textContent.trim()).slice(0, 40));
  await button.click();
  const dialog = page.locator("[role=dialog]").last();
  await dialog.waitFor({ timeout: 5000 }).catch(() => fail(where, "aucun [role=dialog]"));
  if (!(await dialog.isVisible().catch(() => false))) return;
  await page.waitForTimeout(300);
  const m = await page.evaluate(() => {
    const d = [...document.querySelectorAll("[role=dialog]")].pop();
    const r = d.getBoundingClientRect();
    const foot = d.querySelector("[data-dialog-footer]")?.getBoundingClientRect();
    return {
      offset: Math.abs(r.left + r.width / 2 - innerWidth / 2),
      footBottom: foot ? foot.bottom : null,
      innerHeight,
      activeIsClose: document.activeElement?.getAttribute("aria-label") === "Fermer",
    };
  });
  if (m.offset > 2) fail(where, `décentrée de ${Math.round(m.offset)} px`);
  if (m.footBottom === null) fail(where, "aucun [data-dialog-footer]");
  else if (m.footBottom > m.innerHeight) fail(where, `pied hors écran (${Math.round(m.footBottom)} > ${m.innerHeight})`);
  if (m.activeIsClose) fail(where, "focus initial sur la croix");
  // Fermeture sans saisie : le focus revient au déclencheur.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const back = await page.evaluate(() => document.activeElement && (document.activeElement.getAttribute("aria-label") || document.activeElement.textContent.trim()).slice(0, 40));
  if (!(await dialog.isVisible().catch(() => false)) && !back?.startsWith(opener))
    fail(where, `focus rendu à « ${back} » au lieu de « ${opener} »`);
  // Saisie puis Échap : la garde de fermeture demande confirmation.
  button = await trigger(page, label);
  await button.click();
  await dialog.waitFor({ timeout: 5000 }).catch(() => {});
  const field = dialog.locator("input:not([type]):not([readonly]), input[type=text]:not([readonly]), input[type=email], input[type=number], textarea").first();
  if (await field.isVisible().catch(() => false)) {
    let confirmed = false;
    const onDialog = (d) => { confirmed = true; void d.dismiss(); };
    page.on("dialog", onDialog);
    await field.fill("12");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    page.off("dialog", onDialog);
    const alert = await page.locator("[role=alertdialog]").isVisible().catch(() => false);
    if (!confirmed && !alert && !(await dialog.isVisible().catch(() => false))) fail(where, "formulaire modifié fermé sans confirmation");
  }
}

async function auditStockEmpty(page) {
  await open(page, "/demo/stock");
  await page.getByRole("searchbox").or(page.getByPlaceholder(/Produit, variante/)).first().fill("zzzz");
  await page.waitForTimeout(400);
  const empty = page.locator("[data-empty-kind=no-results]");
  if (!(await empty.isVisible().catch(() => false))) return fail("stock zzzz", "aucun état vide no-results");
  await empty.getByRole("button", { name: "Effacer les filtres" }).click();
  await page.waitForTimeout(400);
  if (!(await page.locator("tbody tr, [data-list-mobile] > *").first().isVisible().catch(() => false)))
    fail("stock zzzz", "la liste ne revient pas après « Effacer les filtres »");
}

(async () => {
  const browser = await chromium.launch();
  for (const width of [1440, 768, 360]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const route of routes) {
      try { await open(page, route); await auditLayout(page, width, route); } catch (e) { fail(`${width} ${route}`, e.message.split("\n")[0]); }
    }
    await page.close();
  }
  for (const size of [{ width: 1440, height: 900 }, { width: 360, height: 640 }]) {
    const page = await browser.newPage({ viewport: size });
    for (const [route, label] of modals) {
      try { await auditModal(page, size, route, label); } catch (e) { fail(`${size.width} ${route} « ${label} »`, e.message.split("\n")[0]); }
    }
    if (routes.includes("/demo/stock") && size.width === 1440) {
      try { await auditStockEmpty(page); } catch (e) { fail("stock zzzz", e.message.split("\n")[0]); }
    }
    await page.close();
  }
  await browser.close();
  if (failures.length) {
    console.error(`ui-audit : ${failures.length} échec(s)\n- ${failures.join("\n- ")}`);
    process.exit(1);
  }
  console.log(`ui-audit : ${routes.length} routes × 3 largeurs, ${modals.length} modales × 2 tailles — OK`);
})();
