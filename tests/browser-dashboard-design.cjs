// Dashboard presentation against isolated Auth/API data; never writes a real workspace.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const { installBrowserIdentity } = require("./browser-auth-fixture.cjs");
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    filename,
  );
const { createDemo } = require("../src/frontend/demo.ts");
const base = process.env.TEST_BASE_URL || "http://localhost:3100";
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
    page.on("pageerror", (e) => errors.push(e.message));
    const snapshot = createDemo();
    await page.route("**/api/v1/workspace?*", (r) =>
      r.fulfill({ json: snapshot }),
    );
    await page.route("**/api/v1/session**", (r) =>
      r.fulfill({ json: snapshot.session }),
    );
    await page.goto(base + "/app");
    const heading = page.getByRole("heading", { name: /Bonjour/ });
    await heading.waitFor();
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector(".claude-frame"))
            .paddingLeft === (innerWidth >= 1024 ? "312px" : "0px"),
      );
      await page
        .waitForFunction(
          () => document.documentElement.scrollWidth <= innerWidth,
        )
        .catch(async (error) => {
          console.error(
            "Overflow",
            width,
            await page.evaluate(() =>
              [...document.querySelectorAll("body *")]
                .filter(
                  (el) =>
                    el.getBoundingClientRect().right > innerWidth + 1 &&
                    getComputedStyle(el).display !== "none",
                )
                .slice(0, 12)
                .map((el) => ({
                  tag: el.tagName,
                  cls: el.className,
                  right: el.getBoundingClientRect().right,
                  text: el.textContent.slice(0, 80),
                })),
            ),
          );
          throw error;
        });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `No page overflow at ${width}px`,
      );
      fs.mkdirSync("output/dashboard-design", { recursive: true });
      await page.screenshot({
        path: `output/dashboard-design/verified-${width}.png`,
        fullPage: true,
      });
    }
    await page
      .getByRole("button", { name: "7 derniers jours", exact: true })
      .click();
    await page.waitForFunction(() =>
      new URL(location.href).searchParams.has("start"),
    );
    const dates = new URL(page.url()).searchParams;
    assert.equal(
      (Date.parse(dates.get("end")) - Date.parse(dates.get("start"))) /
        86400000,
      6,
    );
    await page
      .getByRole("button", { name: "7 derniers jours", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Entrée de stock", exact: true })
      .click();
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    const drill = page.locator('a[aria-label^="Voir les ventes du"]').first();
    const drillUrl = new URL(await drill.getAttribute("href"), base);
    assert.equal(
      drillUrl.searchParams.get("start"),
      drillUrl.searchParams.get("end"),
    );
    await drill.click();
    await page.waitForURL("**/sales?*");
    await page.goto(base + "/app");
    await heading.waitFor();
    // Permissions, not literal role names, govern confidential margin display.
    snapshot.session.permissions = snapshot.session.permissions.filter(
      (p) => p !== "analytics.cost_margin_read",
    );
    await page.reload();
    await heading.waitFor();
    assert.equal(
      await page.getByText("Marge brute", { exact: true }).count(),
      0,
    );
    snapshot.session.organization.currency = "EUR";
    snapshot.reporting = {
      kpis: {
        revenue: 10000,
        margin: 2000,
        incoming: 0,
        cashflow: 0,
        count: 1,
        units: 1,
      },
      daily: [{ date: dates.get("start"), revenue: 10000, margin: 2000 }],
      paymentBreakdown: [],
    };
    await page.reload();
    await heading.waitFor();
    assert.ok(
      (
        await page
          .locator(
            'section[aria-labelledby="activity-title"] div[aria-hidden="true"]',
          )
          .first()
          .innerText()
      ).split("\n")[0] === "100",
      "Chart axis converts EUR minor units",
    );
    // Returned revenue and negative margin remain visible below zero.
    snapshot.reporting = {
      kpis: {
        revenue: -10000,
        margin: -2000,
        incoming: 0,
        cashflow: 0,
        count: 0,
        units: 0,
      },
      daily: [{ date: dates.get("start"), revenue: -10000, margin: -2000 }],
      paymentBreakdown: [],
    };
    await page.reload();
    await heading.waitFor();
    await page
      .getByText(
        "Les valeurs sous zéro correspondent aux retours ou à une marge négative.",
        { exact: true },
      )
      .waitFor();
    const negative = page
      .locator('a[aria-label^="Voir les ventes du"] span')
      .first();
    assert.ok(
      parseFloat(await negative.evaluate((el) => el.style.height)) > 0,
      "Negative revenue has a visible bar",
    );
    delete snapshot.reporting;
    // Real empty state, without inventing sample transactions.
    snapshot.data.sales = [];
    snapshot.data.payments = [];
    snapshot.data.entries = [];
    await page.reload();
    await heading.waitFor();
    await page
      .getByText("Aucune activité sur la période sélectionnée.", {
        exact: true,
      })
      .waitFor();
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      true,
    );
    assert.deepEqual(errors, []);
    console.log(
      "Dashboard: 5 responsive widths, period filter, real stock dialog, daily sales navigation, margin permission, empty activity and zero browser exceptions passed.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
