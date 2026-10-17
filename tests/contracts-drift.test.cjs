// Les schémas Zod de src/contracts sont copiés depuis vortex-backend (bun run contracts:sync).
// Ce test échoue si une copie a été modifiée à la main, supprimée ou ajoutée.
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const dir = path.join(__dirname, "..", "src", "contracts");
const sha = (text) => crypto.createHash("sha256").update(text).digest("hex");
const files = () => fs.readdirSync(dir).filter((name) => name.endsWith(".ts")).sort();
const hashes = () => JSON.parse(fs.readFileSync(path.join(dir, ".hash.json"), "utf8"));

test("chaque contrat copié correspond à l'empreinte synchronisée", () => {
  const expected = hashes();
  for (const name of files()) {
    assert.ok(name in expected, `${name} n'est pas dans .hash.json (fichier ajouté à la main ?)`);
    assert.equal(sha(fs.readFileSync(path.join(dir, name), "utf8")), expected[name], `${name} a été modifié : lancer « bun run contracts:sync » dans vortex-backend`);
  }
});

test("aucun contrat synchronisé ne manque", () => {
  assert.deepEqual(files(), Object.keys(hashes()).sort());
});

test("chaque contrat porte l'en-tête de fichier généré et n'importe que zod ou un contrat voisin", () => {
  for (const name of files()) {
    const text = fs.readFileSync(path.join(dir, name), "utf8");
    assert.ok(text.startsWith("// Fichier généré depuis vortex-backend"), name);
    for (const match of text.matchAll(/from ['"]([^'"]+)['"]/g)) assert.ok(match[1] === "zod" || match[1].startsWith("./"), `${name} importe ${match[1]}`);
  }
});
