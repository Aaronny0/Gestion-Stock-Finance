// Le corps de POST /onboarding ne contient que les champs du contrat : l'identité vient de la session.
const fs = require("node:fs");
const ts = require("typescript");
const { test } = require("node:test");
const assert = require("node:assert/strict");

require.extensions[".ts"] = (module, filename) => {
  const out = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  module._compile(out, filename);
};
const { buildOnboardingBody } = require("../src/frontend/form-schemas.ts");
const { onboardingInputSchema } = require("@vortex/contracts");

const draft = { name: " Awa Koffi ", email: "awa@example.com", organizationName: "Awa Mobile", country: "Bénin", currency: "XOF", timezone: "Africa/Porto-Novo", storeName: "Boutique", city: "Cotonou", password: "ne-doit-pas-partir", newAccount: "yes" };

test("le corps d'onboarding omet l'email et tout champ hors contrat", () => {
  const body = buildOnboardingBody(draft);
  assert.deepEqual(Object.keys(body).sort(), ["city", "country", "currency", "name", "organizationName", "storeName", "timezone"]);
  assert.equal(JSON.stringify(body).includes("awa@example.com"), false);
  assert.equal(JSON.stringify(body).includes("ne-doit-pas-partir"), false);
});

test("le corps d'onboarding est accepté par le schéma strict du backend", () => {
  assert.equal(onboardingInputSchema.safeParse(buildOnboardingBody(draft)).success, true);
});

test("un champ absent du brouillon devient une chaîne vide, refusée par le schéma", () => {
  const body = buildOnboardingBody({ ...draft, city: undefined });
  assert.equal(body.city, "");
  assert.equal(onboardingInputSchema.safeParse(body).success, false);
});
