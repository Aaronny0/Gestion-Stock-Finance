// Régressions d'interface vérifiées à la source (les tests navigateur couvrent le rendu) : barres de défilement fines
// héritées de la règle globale, indice de défilement du panier, grille de caisse indépendante de la largeur de l'écran.
const fs = require("node:fs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const read = (file) => fs.readFileSync(file, "utf8");

test("une règle globale donne des barres de défilement fines, avec repli WebKit sans flèches", () => {
  const css = read("src/styles/base.css");
  assert.match(css, /\*\s*\{[^}]*scrollbar-width:\s*thin;[^}]*scrollbar-color:[^}]*var\(--muted-foreground\)/s);
  assert.match(css, /@supports not \(scrollbar-width: thin\)[\s\S]*::-webkit-scrollbar-button\s*\{\s*display:\s*none/);
});

test("la règle globale n'introduit aucune couleur littérale", () => {
  const block = read("src/styles/base.css").split("/* D25")[1].split("/* D25 : indice")[0];
  assert.doesNotMatch(block, /#[0-9a-f]{3,8}\b|rgba?\(/i);
});

test("le panier garde son indice de défilement et réserve la place de la barre", () => {
  assert.match(read("src/features/pos/cart.tsx"), /className="scroll-hint [^"]*overflow-y-auto/);
  assert.match(read("src/styles/base.css"), /\.scroll-hint\s*\{[^}]*scrollbar-gutter:\s*stable/s);
});

test("le rail sombre et les rangées masquées gardent leurs règles locales", () => {
  assert.match(read("src/styles/product.css"), /\.vortex-rail nav \{[^}]*scrollbar-color:\s*#57596e/s);
  assert.match(read("src/features/pos/product-filters.tsx"), /\[scrollbar-width:none\]/);
});

test("la grille des produits de la caisse s'adapte à la place disponible au lieu de dépendre du seuil d'écran", () => {
  const pos = read("src/frontend/pos.tsx");
  assert.match(pos, /grid-cols-\[repeat\(auto-fill,minmax\(11rem,1fr\)\)\]/);
  assert.doesNotMatch(pos, /grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4/);
});

test("le placeholder de recherche de la caisse tient dans un champ étroit", () => {
  assert.match(read("src/frontend/pos.tsx"), /placeholder="Produit, marque, IMEI…"/);
});

test("sur mobile la synthèse du stock passe sur deux colonnes alignées", () => {
  const css = read("src/features/stock/stock.module.css");
  const mobile = css.slice(css.indexOf("@container (max-width: 860px)"));
  assert.match(mobile, /\.summary \{\s*grid-template-columns:\s*1fr 1fr/);
  assert.doesNotMatch(read("src/styles/product.css"), /\.inventory-/);
});

test("le panier fixe n'apparaît qu'à partir de 1280 px ; en dessous, le tiroir laisse tout l'écran aux produits", () => {
  const pos = read("src/frontend/pos.tsx");
  assert.match(pos, /<aside className="hidden xl:block">/);
  assert.match(pos, /xl:grid-cols-\[minmax\(0,1fr\)_420px\]/);
  assert.doesNotMatch(pos, /lg:grid-cols-\[minmax\(0,1fr\)_390px\]/);
  assert.match(pos, /pb-24 lg:pb-0/);
  const drawer = read("src/features/pos/mobile-cart-drawer.tsx");
  assert.match(drawer, /shadow-\[var\(--shadow-dialog\)\] lg:sticky lg:inset-x-auto lg:bottom-4 lg:w-full xl:hidden/, "entre 1024 et 1279 px la barre suit la colonne de contenu au lieu de recouvrir le menu");
});
