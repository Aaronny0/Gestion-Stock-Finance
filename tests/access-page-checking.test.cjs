// L'écran d'attente ne doit pas s'afficher pendant que la session ou la décision d'accès se charge (compte approuvé après connexion).
const fs = require("node:fs");
const { test } = require("node:test");
const assert = require("node:assert/strict");

const source = fs.readFileSync("src/frontend/access-page.tsx", "utf8");

test("l'état de vérification remplace l'écran « demande en cours » tant que l'accès n'est pas connu", () => {
  assert.match(source, /const checking = !verify && \(auth\.loading \|\| \(!!auth\.user && !decision && !error\)\)/);
  assert.match(source, /Vérification de votre accès/);
  assert.match(source, /\{!restricted && !checking && \(/, "les étapes ne s'affichent pas pendant la vérification");
});
