// The original HTML dimensions and interactions, using an isolated workspace.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const { installBrowserIdentity } = require("./browser-auth-fixture.cjs");
require.extensions[".ts"] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    file,
  );
const { createDemo } = require("../src/frontend/demo.ts");
const base = process.env.TEST_BASE_URL || "http://localhost:3102";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await installBrowserIdentity(page, base);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const snapshot = createDemo();
    const sale = snapshot.data.sales[0];
    snapshot.data.sales = Array.from({ length: 25 }, (_, i) => ({
      ...sale,
      id: `design-sale-${i}`,
      reference: `DESIGN-${String(i).padStart(3, "0")}`,
      date: new Date().toISOString(),
      paid: i === 24 ? 0 : sale.total,
      status: i === 24 ? "credit" : "paid",
      lines: sale.lines.map((line, j) => ({
        ...line,
        imei: `QA-IMEI-${i}-${j}`,
      })),
    }));
    await page.route("**/api/v1/workspace?*", (route) =>
      route.fulfill({ json: snapshot }),
    );
    await page.route("**/api/v1/session**", (route) =>
      route.fulfill({ json: snapshot.session }),
    );
    await page.goto(base + "/app");
    await page.getByRole("heading", { name: /Bonjour/ }).waitFor();
    const sidebar = page.locator('[data-qa="workspace-sidebar"]');
    assert.equal(Math.round((await sidebar.boundingBox()).width), 312);
    await sidebar
      .getByRole("button", { name: "Opérations", exact: true })
      .click();
    assert.equal(
      new URL(page.url()).pathname,
      "/app",
      "Choosing a section changes the panel without navigating",
    );
    assert.equal(await sidebar.locator('[data-qa="nav-item"]').count(), 8);
    await sidebar
      .getByRole("button", { name: "Réduire la barre latérale" })
      .click();
    await page.waitForFunction(
      () =>
        Math.round(
          document
            .querySelector('[data-qa="workspace-sidebar"]')
            .getBoundingClientRect().width,
        ) === 68,
    );
    await sidebar
      .getByRole("button", { name: "Opérations", exact: true })
      .click();
    await page.waitForFunction(
      () =>
        Math.round(
          document
            .querySelector('[data-qa="workspace-sidebar"]')
            .getBoundingClientRect().width,
        ) === 312,
    );
    await page.keyboard.press("Control+k");
    await page
      .getByRole("dialog")
      .getByRole("textbox", { name: "Écran, vente ou IMEI" })
      .fill("QA-IMEI-24-0");
    await page
      .getByRole("dialog")
      .getByRole("link", { name: /DESIGN-024/ })
      .click();
    const sheet = page.getByRole("dialog", { name: "DESIGN-024" });
    await sheet.waitFor();
    assert.equal(Math.round((await sheet.boundingBox()).width), 460);
    await sheet
      .getByRole("button", { name: "Enregistrer un paiement" })
      .click();
    const payment = page.getByRole("dialog", {
      name: "Encaisser un règlement",
    });
    await payment.waitFor();
    await page.keyboard.press("Escape");
    await payment.waitFor({ state: "hidden" });
    await sheet.waitFor();
    await sheet.getByRole("button", { name: "Fermer", exact: true }).click();
    await page.goto(base + "/sales");
    await page.getByRole("heading", { name: "Ventes", exact: true }).waitFor();
    const row = page.getByRole("row", {
      name: "Ouvrir le détail design-sale-0",
      exact: true,
    });
    assert.equal(Math.round((await row.boundingBox()).height), 60);
    const client = snapshot.data.clients.find(
      (client) => client.id === sale.clientId,
    );
    if (client)
      assert.ok(
        (await row.innerText()).includes(client.label),
        "Sales displays the real client label",
      );
    const search = page.getByRole("searchbox", {
      name: "Rechercher dans ventes",
    });
    await search.fill("QA-IMEI-24-0");
    await page
      .getByRole("row", {
        name: "Ouvrir le détail design-sale-24",
        exact: true,
      })
      .waitFor();
    assert.equal(
      await page.getByRole("row", { name: /Ouvrir le détail/ }).count(),
      1,
    );
    await search.fill("unknown-reference");
    await page
      .getByText("Aucune vente sur cette période", { exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Effacer les filtres" }).click();
    assert.equal(await search.inputValue(), "");
    await row.waitFor();
    await page.getByRole("button", { name: "Page 2", exact: true }).click();
    await page.getByRole("button", { name: /À crédit 1/ }).click();
    await page
      .getByRole("row", {
        name: "Ouvrir le détail design-sale-24",
        exact: true,
      })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Page 1", exact: true })
        .getAttribute("aria-current"),
      "page",
    );
    await page.getByRole("button", { name: /Toutes 25/ }).click();
    await page
      .getByRole("row", { name: "Ouvrir le détail design-sale-0", exact: true })
      .click();
    await page.getByRole("dialog", { name: "DESIGN-000" }).waitFor();
    await page.keyboard.press("Escape");
    await page.waitForURL("**/sales");
    await page.waitForFunction(
      () =>
        document.activeElement?.getAttribute("data-row-id") === "design-sale-0",
    );
    fs.mkdirSync("output/claude-integration", { recursive: true });
    await page.screenshot({
      path: "output/claude-integration/sales-desktop.png",
      fullPage: true,
    });
    for (const width of [320, 375, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForFunction(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          getComputedStyle(document.querySelector(".claude-frame"))
            .paddingLeft === (innerWidth >= 1024 ? "312px" : "0px"),
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Sales has no overflow at ${width}`,
      );
      await page
        .getByLabel("Ouvrir le détail design-sale-0", { exact: true })
        .filter({ visible: true })
        .click();
      await page.getByRole("dialog", { name: "DESIGN-000" }).waitFor();
      await page.waitForFunction(() => {
        const dialog = document.querySelector('[role="dialog"][data-state="open"]');
        if (!dialog) return false;
        const rect = dialog.getBoundingClientRect();
        return rect.left >= -1 && rect.right <= innerWidth + 1;
      });
      const bounds = await page
        .getByRole("dialog", { name: "DESIGN-000" })
        .boundingBox();
      assert.ok(bounds.x >= -1 && bounds.width <= width + 1, `Detail fits ${width}: ${JSON.stringify(bounds)}`);
      await page.keyboard.press("Escape");
      await page.waitForURL("**/sales");
      await page.screenshot({
        path: `output/claude-integration/sales-${width}.png`,
        fullPage: true,
      });
    }
    snapshot.session.permissions = snapshot.session.permissions.filter(
      (permission) => permission !== "analytics.cost_margin_read",
    );
    await page.goto(base + "/sales/design-sale-0");
    await page.getByRole("dialog", { name: "DESIGN-000" }).waitFor();
    assert.equal(
      await page.getByText("Marge brute", { exact: true }).count(),
      0,
    );
    assert.deepEqual(errors, []);
    const statePage = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await installBrowserIdentity(statePage, base);
    statePage.on("pageerror", (error) => errors.push(error.message));
    let ready = false,
      release;
    const held = new Promise((resolve) => {
      release = resolve;
    });
    await statePage.route("**/api/v1/session**", (route) =>
      route.fulfill({ json: snapshot.session }),
    );
    await statePage.route("**/api/v1/workspace?*", async (route) => {
      if (ready) return route.fulfill({ json: snapshot });
      await held;
      return route.fulfill({ status: 503, json: {} });
    });
    await statePage.goto(base + "/sales");
    await statePage
      .getByRole("status", { name: "Chargement des ventes" })
      .waitFor();
    release();
    await statePage
      .getByText("Impossible de charger les ventes", { exact: true })
      .waitFor();
    ready = true;
    await statePage
      .getByRole("button", { name: "Réessayer", exact: true })
      .click();
    await statePage
      .getByRole("row", { name: "Ouvrir le détail design-sale-0", exact: true })
      .waitFor();
    await statePage.close();
    assert.deepEqual(errors, []);
    console.log(
      "Claude pages: exact 312/68 rail, section navigation, IMEI search, 460 detail, 60 rows, filters, pagination reset, focus restoration, 4 responsive widths margin permissions, payment form, empty reset, loading and error retry passed.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
