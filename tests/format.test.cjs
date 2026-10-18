// Formatage partagé des listes (D30) : dates au format de Ventes et accord du pluriel.
const fs = require("node:fs");
const ts = require("typescript");
const { test } = require("node:test");
const assert = require("node:assert/strict");

require.extensions[".ts"] = (module, filename) => {
  const out = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  module._compile(out, filename);
};
const { formatListDate, plural } = require("../src/lib/format.ts");
const year = new Date().getFullYear();

test("une date ISO sans heure garde son jour et s'affiche comme dans Ventes", () => {
  assert.equal(formatListDate(`${year}-10-18`), "18 oct.");
});

test("avec l'heure, la date de liste ajoute heures et minutes", () => {
  const value = formatListDate(`${year}-10-18T19:34:00`, { time: true });
  assert.match(value, /18 oct\./);
  assert.match(value, /19:34/);
});

test("le pluriel ne s'accorde qu'à partir de deux", () => {
  assert.equal(plural(1, "unité"), "1 unité");
  assert.equal(plural(0, "unité"), "0 unité");
  assert.equal(plural(18, "unité"), "18 unités");
});

test("une date sans heure n'invente pas d'heure, même avec { time: true }", () => {
  assert.equal(formatListDate(`${year}-10-18`, { time: true }), "18 oct.");
});

test("une date d'une autre année affiche l'année, pour ne pas confondre deux exercices", () => {
  assert.match(formatListDate("2025-01-01"), /2025/);
  assert.doesNotMatch(formatListDate(`${year}-03-01`), /\d{4}/);
});
