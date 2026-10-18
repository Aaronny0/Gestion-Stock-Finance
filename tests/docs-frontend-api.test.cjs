// Le contrat de raccordement doit décrire le backend réel (Elysia sur Bun) : l'ancienne pile et les livraisons annoncées
// mais jamais reprises ne vivent que sous « Historique ».
const fs = require("node:fs");
const { test } = require("node:test");
const assert = require("node:assert/strict");

const text = fs.readFileSync("docs/frontend-api.md", "utf8");
const current = text.replace(/^## Historique[^\n]*\n[\s\S]*$/m, "");

test("le contrat courant ne cite ni NestJS ni Supabase", () => {
  assert.doesNotMatch(current, /nestjs/i);
  assert.doesNotMatch(current, /supabase/i);
});

test("l'état d'intégration dit ce qui est réellement implémenté et ce qui ne l'est pas", () => {
  const state = current.split("## Session et périmètres")[0];
  assert.match(state, /Elysia/);
  for (const route of ["/access", "/session", "/onboarding", "/workspace"]) assert.ok(state.includes(route), route);
  assert.match(state, /POST \/commands/);
  assert.match(state, /pas encore implémenté/i);
  assert.doesNotMatch(state, /30 commandes/);
});

test("le contrat d'onboarding interdit l'email dans le corps et décrit le modal du dashboard", () => {
  assert.doesNotMatch(current, /`POST \/onboarding` reçoit `\{name,email,/);
  assert.match(current, /onboardingInputSchema/);
  assert.match(current, /modal/i);
});

test("le cookie de session est propre à chaque site", () => {
  assert.match(current, /sans attribut `Domain`/);
});
