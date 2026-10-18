// Composants UI partagés (D27–D30) vérifiés à la source ; le rendu est contrôlé par tests/ui-audit.cjs.
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const read = (file) => fs.readFileSync(file, "utf8");
const srcFiles = (dir = "src") =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return srcFiles(file);
    return /\.(tsx?|css)$/.test(entry.name) ? [file] : [];
  });
// Valeurs HEX déjà appliquées par Ventes et approuvées par D26 ; tout le reste passe par les tokens.
const ALLOWED_HEX = new Set(["#fff", "#dde3e4", "#eaefef", "#586767", "#f9f9fc", "#0a1a1b", "#007176", "#dff2f2", "#04585c", "#fff2d6", "#864900", "#e8a127", "#9e1618"]);

test("les CSS modules des composants partagés n'utilisent que les HEX approuvés", () => {
  for (const f of srcFiles().filter((f) => /src\/components\/(ui|data-display)\/.*\.module\.css$/.test(f)))
    for (const hex of read(f).match(/#[0-9a-f]{3,8}\b/gi) ?? [])
      assert.ok(ALLOWED_HEX.has(hex.toLowerCase()), `${f} : ${hex} hors palette D26`);
});

test("D27 : Dialog a des tailles nommées, un corps qui défile et un pied fixe", () => {
  const dialog = read("src/components/ui/dialog.tsx");
  for (const token of ["DialogBody", "data-dialog-footer", "data-dialog-body", "onOpenAutoFocus", "max-w-[448px]", "max-w-[640px]", "max-w-[768px]", "max-w-[1024px]"])
    assert.ok(dialog.includes(token), `dialog.tsx sans ${token}`);
  assert.match(read("src/components/ui/alert-dialog.tsx"), /data-dialog-footer/);
});

test("D27 : Modal et ConfirmDialog reposent sur Radix, sans <dialog> natif ni verrou manuel", () => {
  const ui = read("src/frontend/ui.tsx");
  for (const legacy of ["<dialog", "showModal", "modalLocks"]) assert.ok(!ui.includes(legacy), `ui.tsx contient ${legacy}`);
  assert.match(ui, /onEscapeKeyDown[\s\S]*onCloseRequest/, "Échap passe par la garde de fermeture");
  assert.match(ui, /onPointerDownOutside[\s\S]*onCloseRequest/, "le clic sur le fond passe par la garde de fermeture");
});

test("D27 : ActionForm utilise le corps et le pied du Dialog et protège la fermeture", () => {
  const forms = read("src/frontend/forms.tsx");
  for (const legacy of ["modal-body", "modal-foot", 'className="button']) assert.ok(!forms.includes(legacy), `forms.tsx contient ${legacy}`);
  assert.match(forms, /onCloseRequest=/);
  assert.match(forms, /plural\(/, "accord du pluriel des unités");
});

test("D27 : plus aucune règle .modal dans les styles", () => {
  for (const f of srcFiles("src/styles")) assert.doesNotMatch(read(f), /\.modal[-\s{:,]/, `${f} contient encore .modal`);
});

test("D27 : les dialogues métier utilisent les tailles nommées et un DialogBody", () => {
  const files = srcFiles("src/features").concat(srcFiles("src/app")).filter((f) => f.endsWith(".tsx") && read(f).includes("<DialogContent"));
  assert.ok(files.length >= 10, "dialogues métier trouvés");
  for (const f of files) {
    const source = read(f);
    assert.doesNotMatch(source, /<DialogContent[^>]*className="[^"]*max-[wh]-/, `${f} : largeur ou hauteur ad hoc`);
    assert.ok(source.includes("<DialogBody"), `${f} : contenu hors DialogBody`);
  }
});

test("D28 : SummaryStrip passe en 2 × 2 sous 860 px de largeur utile et sa cellule active est un bouton pressé", () => {
  const tsx = read("src/components/data-display/summary-strip.tsx");
  const css = read("src/components/data-display/summary-strip.module.css");
  assert.match(css, /container(-type)?:[^;]*inline-size/);
  assert.match(css, /@container[^{]*\(max-width:\s*859px\)/);
  assert.match(css, /grid-column:\s*1 \/ -1/, "dernière cellule impaire en pleine largeur");
  assert.match(css, /tabular-nums/);
  assert.match(css, /overflow-wrap:\s*anywhere/, "libellés longs sans débordement");
  assert.match(tsx, /aria-pressed/);
  assert.match(tsx, /export \{[^}]*SummaryItem/);
});

test("D28 : FilterChip et SegmentedControl sont des boutons pressés de 40 px", () => {
  const chip = read("src/components/ui/filter-chip.tsx");
  const chipCss = read("src/components/ui/filter-chip.module.css");
  const seg = read("src/components/ui/segmented-control.tsx");
  const segCss = read("src/components/ui/segmented-control.module.css");
  assert.match(chip, /aria-pressed/);
  assert.match(chip, /Effacer les filtres/, "bouton d'effacement des filtres partagé");
  assert.match(chipCss, /height:\s*40px/);
  assert.match(chipCss, /#dff2f2/);
  assert.match(seg, /role="group"/);
  assert.match(seg, /aria-pressed/);
  assert.match(segCss, /height:\s*40px/);
  for (const css of [chipCss, segCss]) assert.match(css, /@media \(pointer: coarse\)[\s\S]*min-height:\s*44px/, "cible tactile 44 px");
});

test("D29 : EmptyState est typé, sans titre par défaut ni message générique", () => {
  const tsx = read("src/components/data-display/empty-state.tsx");
  for (const token of ["data-empty-kind", "Effacer les filtres", "steps", '"first-use"', '"no-results"', '"error"']) assert.ok(tsx.includes(token), `empty-state.tsx sans ${token}`);
  assert.doesNotMatch(tsx, /title\?:/, "titre obligatoire");
  assert.match(read("src/components/data-display/data-table.tsx"), /emptyKind/);
  for (const f of srcFiles()) assert.doesNotMatch(read(f), /créez votre premier élément/i, `${f} : message générique`);
});

test("D28 : ListCard porte une seule fois la barre d'outils à 40 px et la bascule en cartes sous 900 px", () => {
  const css = read("src/components/data-display/list-card.module.css");
  const tsx = read("src/components/data-display/list-card.tsx");
  const table = read("src/components/data-display/data-table.tsx");
  assert.match(css, /@container list \(max-width: 899px\)/);
  assert.match(css, /height:\s*40px/);
  assert.match(css, /\[data-list-desktop\]/);
  assert.match(css, /\[data-list-mobile\]/);
  assert.match(tsx, /aria-current/);
  assert.match(tsx, /role="tablist"/);
  assert.match(tsx, /ArrowRight/, "onglets navigables aux flèches");
  for (const token of ["toolbarStart", "data-list-toolbar", "data-list-desktop", "data-list-mobile"]) assert.ok(table.includes(token), `data-table.tsx sans ${token}`);
});

test("D30 : PageHeader a une primaire et des secondaires repliées dans « Autres actions » sous 768 px", () => {
  const tsx = read("src/components/layout/page-header.tsx");
  const css = read("src/components/layout/page-header.module.css");
  assert.match(tsx, /primaryAction/);
  assert.match(tsx, /secondaryActions/);
  assert.match(tsx, /aria-label="Autres actions"/);
  assert.match(css, /@media \(max-width: 767px\)/);
});

test("Lot 3 : Ventes n'a plus de bande, puces, période ni état vide locaux", () => {
  const css = read("src/features/sales/sales.module.css");
  for (const local of [".summary", ".chips", ".period", ".state", ":global(.data-toolbar)", ".ledger"]) assert.ok(!css.includes(local), `sales.module.css contient ${local}`);
  const page = read("src/features/sales/sales-page.tsx");
  for (const shared of ["SummaryStrip", "FilterChip", "SegmentedControl", "ListCard", "secondaryActions"]) assert.ok(page.includes(shared), `sales-page.tsx sans ${shared}`);
  assert.match(read("src/features/sales/sales-table.tsx"), /density="comfortable"/);
});

test("Lot 3 : Stock, fiche produit et réappro reposent sur les composants partagés", () => {
  const css = read("src/features/stock/stock.module.css");
  for (const local of [".summary", ".chip", ".tabs", ".empty", ":global(.data-toolbar)", ".ledger", ".desktopActions"]) assert.ok(!css.includes(local), `stock.module.css contient ${local}`);
  assert.ok(!fs.existsSync("src/features/stock/stock-tabs.tsx"), "stock-tabs.tsx remplacé par ListTabs");
  const details = read("src/features/stock/product-details.tsx");
  assert.match(details, /SummaryStrip/);
  assert.doesNotMatch(details, /<Button/, "les actions de la fiche passent dans l'en-tête");
  assert.doesNotMatch(read("src/features/stock/stock-page.tsx"), /eyebrow=/);
  assert.match(read("src/features/stock/replenishment-page.tsx"), /ListCard/);
});

test("D30 : pas de bouton « Retour » dans le shell ; le fil d'Ariane ne dit « Détail » que pour une fiche", () => {
  assert.doesNotMatch(read("src/frontend/shell.tsx"), /aria-label="Retour"/);
  const ts = require("typescript");
  const source = ts.transpileModule(read("src/frontend/navigation.ts"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  new Function("module", "exports", "require", source)(mod, mod.exports, require);
  const { isDetailRoute } = mod.exports;
  assert.equal(isDetailRoute("/products/p0"), true);
  assert.equal(isDetailRoute("/sales/sale0"), true);
  for (const path of ["/sales/credits", "/stock/entries", "/stock/replenishment", "/accounting/journals", "/analytics/sales", "/settings/stores"]) assert.equal(isDetailRoute(path), false, path);
  assert.match(read("src/components/layout/app-breadcrumb.tsx"), /isDetailRoute/);
});

test("D28 : sous 900 px, « Colonnes » disparaît avec la table", () => {
  assert.match(read("src/components/data-display/data-table.tsx"), /data-list-columns/);
  assert.match(read("src/components/data-display/list-card.module.css"), /@container list \(max-width: 899px\)[^}]*\[data-list-columns\]/);
});

test("Lot 4 : achats, troc, rachat, clients et fournisseurs quittent le gabarit historique", () => {
  const pages = read("src/frontend/pages.tsx");
  const fromUi = pages.match(/import \{([^}]*)\} from "\.\/ui"/)?.[1] ?? "";
  for (const legacy of ["DataTable", "PageHeading", "DateRangePicker", "EmptyState", "Badge"]) assert.ok(!new RegExp(`\\b${legacy}\\b`).test(fromUi), `pages.tsx importe ${legacy} legacy`);
  for (const legacy of ["eyebrow", "directory-summary", "ESPACE DE GESTION", "trade-flow", 'className="button']) assert.ok(!pages.includes(legacy), `pages.tsx contient ${legacy}`);
  for (const shared of ["ListCard", "SummaryStrip", "PageHeader", "formatListDate"]) assert.ok(pages.includes(shared), `pages.tsx sans ${shared}`);
});

test("Lot 5 : trésorerie, dépenses et paiements sur les composants partagés", () => {
  for (const f of ["src/features/finance/cash-page.tsx", "src/features/finance/expenses-page.tsx", "src/features/finance/payments-page.tsx"]) {
    const source = read(f);
    for (const legacy of ["MetricCard", "finance-summary", "eyebrow="]) assert.ok(!source.includes(legacy), `${f} contient ${legacy}`);
    for (const shared of ["SummaryStrip", "ListCard", "formatListDate", 'align: "right"']) assert.ok(source.includes(shared), `${f} sans ${shared}`);
  }
});

test("Lot 5 : crédits avec onglets soulignés et synthèse partagée", () => {
  const source = read("src/features/sales/credits-page.tsx");
  for (const legacy of ["TabsList", "<Card", "eyebrow="]) assert.ok(!source.includes(legacy), `credits-page.tsx contient ${legacy}`);
  for (const shared of ["ListTabs", "ListCard", "SummaryStrip", "formatListDate"]) assert.ok(source.includes(shared), `credits-page.tsx sans ${shared}`);
});

test("Lot 6 : comptabilité au gabarit Listes", () => {
  const source = read("src/features/accounting/accounting-page.tsx");
  for (const legacy of ["TabsList", "MetricCard", "finance-summary", "eyebrow=", 'density="dense"']) assert.ok(!source.includes(legacy), `accounting-page.tsx contient ${legacy}`);
  for (const shared of ["ListTabs", "ListCard", "SummaryStrip", "toolbarStart", "formatListDate"]) assert.ok(source.includes(shared), `accounting-page.tsx sans ${shared}`);
  assert.ok((source.match(/align: "right"/g) ?? []).length >= 8, "débits, crédits et soldes alignés à droite");
});

test("Lot 6 : statistiques sur les composants partagés", () => {
  const source = read("src/frontend/analytics.tsx");
  for (const legacy of ["page-tabs", "compact-metrics", "<select", 'className="button', "PageHeading", "eyebrow"]) assert.ok(!source.includes(legacy), `analytics.tsx contient ${legacy}`);
  assert.doesNotMatch(source, /import \{[^}]*\bDataTable\b[^}]*\} from "\.\/ui"/);
  for (const shared of ["ListTabs", "ListCard", "SummaryStrip", "SelectTrigger"]) assert.ok(source.includes(shared), `analytics.tsx sans ${shared}`);
});

test("Lot 7 : équipe et audit sur les composants partagés", () => {
  const team = read("src/features/team/team-page.tsx");
  assert.doesNotMatch(team, /team-summary|eyebrow=/);
  assert.match(team, /permissionLabel\(/, "modèles de rôles en libellés lisibles");
  for (const shared of ["SummaryStrip", "ListCard"]) assert.ok(team.includes(shared), `team-page.tsx sans ${shared}`);
  assert.match(read("src/features/team/team-member-dialog.tsx"), /export function permissionLabel/);
  const audit = read("src/features/audit/audit-page.tsx");
  assert.doesNotMatch(audit, /eyebrow=|density="dense"/);
  for (const shared of ["ListCard", "toolbarStart", "formatListDate"]) assert.ok(audit.includes(shared), `audit-page.tsx sans ${shared}`);
});

test("Lot 7 : en-têtes fonctionnels de paramètres et caisse, préréglages du dashboard en SegmentedControl", () => {
  for (const f of ["src/features/settings/settings-page.tsx", "src/frontend/pos.tsx"]) assert.doesNotMatch(read(f), /eyebrow=/, f);
  assert.doesNotMatch(read("src/features/dashboard/dashboard.module.css"), /\.presets/);
  assert.match(read("src/features/dashboard/dashboard-period-filter.tsx"), /SegmentedControl/);
});

test("Nettoyage : plus aucun motif remplacé dans src", () => {
  const forbidden = ["<dialog", "modal-foot", "eyebrow", "finance-summary", "team-summary", "directory-summary", "sales-ledger-summary", "MetricCard", "page-tabs", "compact-metrics", 'className="button'];
  // Hors périmètre : pages publiques et auth (spec), et base.css dont la règle dialog:modal appartient à l'utilisateur.
  const outOfScope = /(auth|public-site|access-page|google-login|not-found|base\.css|legacy\/auth\.css)/;
  // Les feuilles legacy gardent .eyebrow et .button pour les pages publiques et l'authentification.
  const sharedLegacy = /src\/styles\/legacy\//;
  for (const f of srcFiles().filter((f) => !outOfScope.test(f))) {
    const source = read(f);
    for (const legacy of forbidden) {
      if (sharedLegacy.test(f) && ["eyebrow", 'className="button'].includes(legacy)) continue;
      assert.ok(!source.includes(legacy), `${f} contient ${legacy}`);
    }
  }
  for (const orphan of ["returns", "import-stock", "accounting-page", "settings", "workflows"]) assert.ok(!fs.existsSync(`src/frontend/${orphan}.tsx`), `src/frontend/${orphan}.tsx est orphelin`);
  assert.ok(!fs.existsSync("src/components/data-display/metric-card.tsx"));
  const ui = read("src/frontend/ui.tsx");
  for (const legacy of ["export function DataTable", "export function EmptyState", "export function PageHeading", "export function DateRangePicker"]) assert.ok(!ui.includes(legacy), `ui.tsx garde ${legacy}`);
});
