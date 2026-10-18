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
