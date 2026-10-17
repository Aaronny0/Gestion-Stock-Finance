// Après l'approbation, l'utilisateur arrive sur le dashboard ; sans entreprise, un modal bloquant lui fait créer son espace.
const fs = require("node:fs");
const ts = require("typescript");
const { test } = require("node:test");
const assert = require("node:assert/strict");

require.extensions[".ts"] = (module, filename) => {
  const out = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  module._compile(out, filename);
};
const { workspaceFailureAction, onboardingDefaults } = require("../src/frontend/onboarding-gate.ts");

test("ONBOARDING_REQUIRED ouvre le modal sur le dashboard au lieu de rediriger", () => {
  assert.deepEqual(workspaceFailureAction({ code: "ONBOARDING_REQUIRED", status: 403 }), { type: "onboarding-modal" });
});

test("les autres refus gardent leurs redirections", () => {
  for (const code of ["PENDING_APPROVAL", "CONTACTED", "REJECTED", "SUSPENDED"]) assert.deepEqual(workspaceFailureAction({ code, status: 403 }), { type: "redirect", to: "/access-pending" });
  assert.deepEqual(workspaceFailureAction({ code: "PENDING_EMAIL", status: 403 }), { type: "redirect", to: "/verify-email" });
  assert.deepEqual(workspaceFailureAction({ code: "NO_MEMBERSHIP", status: 403 }), { type: "redirect", to: "/onboarding?state=no_membership" });
  assert.deepEqual(workspaceFailureAction({ status: 401 }), { type: "redirect", to: "/login?expired=1" });
});

test("une panne reste une erreur affichée, jamais un modal ni une redirection", () => {
  assert.deepEqual(workspaceFailureAction({ status: 503, message: "Service indisponible." }), { type: "error", message: "Service indisponible." });
  assert.deepEqual(workspaceFailureAction({ name: "AbortError" }), { type: "ignore" });
});

test("le modal préremplit nom et entreprise depuis la demande et applique les valeurs par défaut du Bénin", () => {
  const values = onboardingDefaults({ name: "Awa Koffi", company: "Awa Mobile" }, null);
  assert.deepEqual(values, { name: "Awa Koffi", organizationName: "Awa Mobile", country: "Bénin", currency: "XOF", timezone: "Africa/Porto-Novo", storeName: "", city: "" });
});

test("le brouillon enregistré à l'inscription l'emporte sur les valeurs du compte, sans reprendre l'email", () => {
  const draft = { payload: { name: "Awa K.", email: "awa@example.com", organizationName: "Boutique Awa", country: "Togo", currency: "XOF", timezone: "Africa/Lome", storeName: "Lomé centre", city: "Lomé" }, idempotencyKey: "k" };
  const values = onboardingDefaults({ name: "Awa Koffi", company: "Awa Mobile" }, draft);
  assert.equal(values.organizationName, "Boutique Awa");
  assert.equal(values.city, "Lomé");
  assert.equal("email" in values, false);
});
