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
