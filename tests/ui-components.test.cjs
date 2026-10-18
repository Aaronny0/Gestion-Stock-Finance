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
