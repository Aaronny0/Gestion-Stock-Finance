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
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.setDefaultTimeout(15000);
  const checks = [],
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/demo/pos");
  await page.getByRole("heading", { name: "Nouvelle vente" }).waitFor();
  await page
    .locator('[data-qa="product-card"]')
    .filter({ hasText: "iPhone 15" })
    .first()
    .click();
  page.once("dialog", (d) => d.dismiss());
  await page.locator('[data-qa="workspace-sidebar"]').getByRole("link", { name: /Stock & catalogue/ }).click();
  assert.ok(page.url().endsWith("/demo/pos"));
  assert.equal(await page.locator('[data-qa="cart-item"]').count(), 1);
  checks.push("Navigation annulée : panier conservé");
  await page.getByLabel("Espèces remises (XOF)").fill("500000");
  await page.getByRole("button", { name: /Encaisser/ }).click();
  assert.ok((await page.getByRole("alertdialog").innerText()).includes("75"));
  await page.getByRole("button", { name: "Confirmer la vente", exact: true }).click();
  await page.getByRole("heading", { name: /Reçu OP/ }).waitFor();
  assert.ok((await page.locator("[data-receipt]").innerText()).includes("75"));
  await page.screenshot({
    path: "output/frontend-qa/ux-receipt.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Fermer", exact: true })
    .last()
    .click();
  checks.push("Encaissement et monnaie rendue sur le reçu");
  await page.getByRole("link", { name: "Ventes", exact: true }).click();
  await page
    .getByLabel(/^Ouvrir le détail /).filter({ visible: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Retourner / rembourser" }).click();
  await page.getByLabel("Quantité à retourner").first().fill("1");
  await page.getByLabel("Motif du retour").fill("Retour de contrôle QA");
  await page.getByRole("button", { name: "Vérifier le retour" }).click();
  await page.getByRole("button", { name: "Confirmer le retour" }).click();
  await page.locator('[data-qa="return-history"]').waitFor();
  assert.ok(
    (await page.locator('[data-qa="return-history"]').innerText()).includes(
      "remis en stock",
    ),
  );
  checks.push("Retour depuis la vente : historique et état du stock");
  await page.getByRole("link", { name: "Crédits et échéances" }).click();
  await page.getByRole("heading", { name: "Les crédits à suivre." }).waitFor();
  await page.screenshot({
    path: "output/frontend-qa/ux-credits.png",
    fullPage: true,
  });
  checks.push("Vue des crédits hors filtre de période");
  await page.locator('[data-qa="workspace-sidebar"]').getByRole("link", { name: /Stock & catalogue/ }).click();
  await page
    .getByRole("link", { name: "Réapprovisionnement", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Anticipez les ruptures." })
    .waitFor();
  checks.push("Vue de réapprovisionnement accessible");
  await page
    .getByRole("link", { name: "Caisse / Vendre", exact: true })
    .click();
  await page.locator('[data-qa="product-card"]').first().click();
  const storeSwitcher = page.getByRole("combobox", { name: "Boutique active" });
  await storeSwitcher.click();
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("option", { name: "Porto-Novo", exact: true }).click();
  assert.ok((await storeSwitcher.innerText()).includes("Cotonou"));
  checks.push("Changement de boutique protégé");
  page.once("dialog", (d) => d.accept());
  await page.locator('[data-qa="workspace-sidebar"]').getByRole("link", { name: /Stock & catalogue/ }).click();
  await page
    .getByRole("heading", { name: "Le bon stock, au bon endroit." })
    .waitFor();
  checks.push("Abandon explicite permet la navigation");
  for (const width of [1440, 768, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/demo",
      "/demo/pos",
      "/demo/sales/credits",
      "/demo/stock/replenishment",
    ]) {
      await page.goto(base + route);
      await page.locator("h1").waitFor();
      await page.waitForTimeout(200);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        route + " " + width,
      );
      if (width !== 768)
        await page.screenshot({
          path: `output/frontend-qa/ux-${route.split("/").filter(Boolean).join("-")}-${width}.png`,
          fullPage: true,
        });
    }
    checks.push(`Nouvelles vues sans débordement à ${width}px`);
  }
  const contrast = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    return Object.fromEntries(
      [
        "--foreground",
        "--muted-foreground",
        "--primary",
        "--success",
        "--warning",
        "--destructive",
        "--info",
        "--background",
      ].map((k) => [k, css.getPropertyValue(k).trim()]),
    );
  });
  function luminance(hex) {
    return hex
      .replace("#", "")
      .match(/../g)
      .map((v) => parseInt(v, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);
  }
  function ratio(a, b) {
    const x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  const pairs = [
    ["Texte principal", contrast["--foreground"], "#FFFFFF"],
    ["Texte secondaire", contrast["--muted-foreground"], contrast["--background"]],
    ["Action principale", "#FFFFFF", contrast["--primary"]],
    ["Succès", contrast["--success"], "#ECFDF3"],
    ["Attention", contrast["--warning"], "#FFFBEB"],
    ["Erreur", contrast["--destructive"], "#FEF3F2"],
    ["Information", contrast["--info"], "#EFF6FF"],
  ].map(([label, fg, bg]) => ({
    label,
    fg,
    bg,
    ratio: Number(ratio(fg, bg).toFixed(2)),
  }));
  for (const pair of pairs) assert.ok(pair.ratio >= 4.5, JSON.stringify(pair));
  checks.push("Sept paires de couleurs sémantiques dépassent 4,5:1");
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "output/frontend-qa/ux-results.json",
    JSON.stringify(
      {
        date: new Date().toISOString(),
        checks,
        contrast: pairs,
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ checks, contrast: pairs }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
