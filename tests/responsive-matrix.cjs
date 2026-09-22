const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs");
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const routes = [
  "/demo",
  "/demo/pos",
  "/demo/stock",
  "/demo/products/p0",
  "/demo/stock/replenishment",
  "/demo/sales",
  "/demo/sales/sale0",
  "/demo/sales/credits",
  "/demo/trade",
  "/demo/buyback",
  "/demo/purchases",
  "/demo/suppliers",
  "/demo/clients",
  "/demo/cash",
  "/demo/expenses",
  "/demo/payments",
  "/demo/team",
  "/demo/audit",
  ...[
    "journals",
    "accounts",
    "ledger",
    "trial-balance",
    "statements",
    "periods",
  ].map((p) => "/demo/accounting/" + p),
  ...[
    "executive",
    "sales",
    "stock",
    "margin",
    "team",
    "clients",
    "cash",
    "accounting",
    "trade",
  ].map((p) => "/demo/analytics/" + p),
  ...[
    "organization",
    "stores",
    "sales",
    "stock",
    "accounting",
    "fiscal",
    "security",
  ].map((p) => "/demo/settings/" + p),
  "/login",
  "/signup",
  "/forgot-password",
  "/invite/activate",
];
const sizes = [
  [320, 568],
  [360, 800],
  [390, 844],
  [430, 932],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [1180, 820],
  [844, 390],
];
(async () => {
  fs.mkdirSync("output/responsive-qa", { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || "/opt/google/chrome/chrome",
    args: ["--no-sandbox"],
  });
  const failures = [],
    checks = [],
    errors = [];
  const queue=[...sizes];
  await Promise.all(Array.from({length:3}, async()=>{
  while(queue.length) {
    const [width,height]=queue.shift();
    const page = await browser.newPage({
      viewport: { width, height },
      isMobile: width < 768,
      hasTouch: true,
    });
    page.setDefaultTimeout(20000);
    page.on("pageerror", (e) => errors.push({ width, message: e.message }));
    for (const route of routes) {
      try {
        await page.goto(base + route);
        if (route.startsWith("/demo"))
          await page.locator(".workspace-main h1").waitFor();
        else await page.locator(".auth-form h2").waitFor();
        await page.waitForTimeout(70);
        const issue = await page.evaluate(() => {
          const width = innerWidth;
          const bad = [
            ...document.querySelectorAll(
              ".workspace-main *, .auth-main *, .workspace-header *,dialog[open] *",
            ),
          ]
            .filter((el) => {
              const r = el.getBoundingClientRect(),
                css = getComputedStyle(el);
              if (
                !el.checkVisibility({ checkVisibilityCSS: true }) ||
                !r.width ||
                !r.height ||
                css.position === "fixed" ||
                el.closest(".table-scroll,.tabs,.recharts-wrapper,.cart-lines")
              )
                return false;
              return r.right > width + 2 || r.left < -2;
            })
            .slice(0, 8)
            .map((el) => ({
              tag: el.tagName,
              cls: el.className,
              text: el.textContent?.trim().slice(0, 60),
              rect: el.getBoundingClientRect().toJSON(),
            }));
          return {
            pageOverflow: document.documentElement.scrollWidth > width + 1,
            bad,
          };
        });
        if (issue.pageOverflow || issue.bad.length) {
          failures.push({ route, width, height, ...issue });
          await page.screenshot({
            path: `output/responsive-qa/failure-${width}-${route.replaceAll("/", "_")}.png`,
            fullPage: true,
          });
        }
        if (
          await page
            .getByText("Cette page n’a pas pu s’afficher.", { exact: true })
            .count()
        )
          failures.push({ route, width, error: "error boundary" });
        checks.push({ route, width, height });
      } catch (e) {
        failures.push({ route, width, height, error: e.message });
      }
    }
    fs.writeFileSync(
      "output/responsive-qa/matrix-progress.json",
      JSON.stringify({ checks, failures, errors }, null, 2),
    );
    console.log(
      `${width}x${height}: ${routes.length} pages vérifiées; ${failures.length} anomalies cumulées`,
    );
    await page.close();
  }
  }));
  fs.writeFileSync(
    "output/responsive-qa/matrix.json",
    JSON.stringify(
      { date: new Date().toISOString(), checks, failures, errors },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({ count: checks.length, failures, errors }, null, 2),
  );
  await browser.close();
  if (failures.length || errors.length) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
