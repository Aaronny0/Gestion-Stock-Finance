// Les formulaires d'authentification et d'onboarding sont validés par les schémas Zod partagés (src/contracts).
const fs = require("node:fs");
const ts = require("typescript");
const { test } = require("node:test");
const assert = require("node:assert/strict");

require.extensions[".ts"] = (module, filename) => {
  const out = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  module._compile(out, filename);
};
const { authFormSchema, fieldErrors } = require("../src/frontend/form-schemas.ts");
const errorsFor = (options, values) => { const schema = authFormSchema(options); return schema ? fieldErrors(schema, values) : {}; };

test("connexion : email et mot de passe obligatoires, messages français", () => {
  assert.deepEqual(errorsFor({ mode: "login" }, { email: "", password: "" }), { email: "Saisissez une adresse email valide.", password: "Saisissez votre mot de passe." });
  assert.deepEqual(errorsFor({ mode: "login" }, { email: "a@b.fr", password: "x" }), {});
});

test("inscription étape 1 : nom, email et mot de passe de 12 caractères", () => {
  const errors = errorsFor({ mode: "signup", step: 0 }, { name: " ", email: "pas-un-email", password: "court" });
  assert.deepEqual(errors, { name: "Indiquez votre nom.", email: "Saisissez une adresse email valide.", password: "Utilisez au moins 12 caractères." });
  assert.deepEqual(errorsFor({ mode: "signup", step: 0 }, { name: "Awa", email: "awa@example.com", password: "motdepasse-long-12" }), {});
});

test("inscription étape 2 : devise et fuseau horaire contrôlés", () => {
  const values = { organizationName: "Awa Mobile", country: "Bénin", currency: "xof", timezone: "Mars/Phobos" };
  assert.deepEqual(errorsFor({ mode: "signup", step: 1 }, values), {
    currency: "Utilisez un code de devise de 3 lettres (ex. XOF).",
    timezone: "Indiquez un fuseau valide (ex. Africa/Porto-Novo).",
  });
  assert.deepEqual(errorsFor({ mode: "signup", step: 1 }, { ...values, currency: "XOF", timezone: "Africa/Porto-Novo" }), {});
});

test("inscription étape 3 : boutique et ville obligatoires", () => {
  assert.deepEqual(errorsFor({ mode: "signup", step: 2 }, { storeName: "", city: "" }), { storeName: "Indiquez le nom de la boutique.", city: "Indiquez la ville." });
});

test("récapitulatif d'inscription : valide toutes les étapes ensemble et ignore les champs étrangers", () => {
  const values = { name: "Awa", email: "awa@example.com", password: "motdepasse-long-12", phone: "0102", newAccount: "yes", organizationName: "Awa Mobile", country: "Bénin", currency: "XOF", timezone: "Africa/Porto-Novo", storeName: "Boutique", city: "Cotonou" };
  assert.deepEqual(errorsFor({ mode: "signup", step: 3 }, values), {});
  assert.deepEqual(Object.keys(errorsFor({ mode: "signup", step: 3 }, { ...values, city: "", password: "" })).sort(), ["city", "password"]);
});

test("réinitialisation : confirmation identique, erreur portée par le champ confirmation", () => {
  const errors = errorsFor({ mode: "reset" }, { password: "motdepasse-long-12", confirmation: "autre-motdepasse-12" });
  assert.deepEqual(errors, { confirmation: "Les mots de passe ne correspondent pas." });
});

test("mot de passe oublié et renvoi du lien : seul l'email est contrôlé", () => {
  for (const mode of ["forgot", "verify"]) assert.deepEqual(errorsFor({ mode }, { email: "x" }), { email: "Saisissez une adresse email valide." });
});

test("invitation : un compte existant n'a pas la règle des 12 caractères, un nouveau compte oui, un utilisateur connecté rien", () => {
  assert.deepEqual(errorsFor({ mode: "invite", newAccount: false }, { email: "a@b.fr", password: "x" }), {});
  assert.deepEqual(errorsFor({ mode: "invite", newAccount: true }, { email: "a@b.fr", password: "x" }), { password: "Utilisez au moins 12 caractères." });
  assert.equal(authFormSchema({ mode: "invite", signedIn: true }), null);
});

test("la destination /app/dashboard est une route connue et protégée par dashboard.read", () => {
  const { canonical, routePermission } = require("../src/frontend/navigation.ts");
  assert.ok(routePermission(canonical("/app/dashboard")), "/app/dashboard doit être routée vers le tableau de bord");
});
