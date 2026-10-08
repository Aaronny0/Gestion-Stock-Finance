# Références archivées

## Origine et intégrité

Source fournie : `/home/aaron/Documents/VORTEX/Claude design/Refonte design et système du projet/`. Archives datées du 8 octobre 2026, copiées octet pour octet dans [claude-original](claude-original/). [original-manifest.json](original-manifest.json) conserve chemin relatif, taille et SHA-256 de chaque fichier. Ne jamais éditer les originaux ; toute future évolution approuvée doit avoir une nouvelle archive datée.

Contenu : les six maquettes `Design System.dc.html`, `Auth.dc.html`, `Tableau de bord.dc.html`, `Ventes.dc.html`, `Rôles et écrans.dc.html`, `Sidebar alternative.dc.html` ; `DESIGN.md` Claude ; `handoff/tokens.css` et `palette.json` ; runtime `support.js` ; logo `assets/vortex-logo.png` ; les deux images fournies dans `uploads/` ; extraits historiques joints du dépôt (`DESIGN.md`, `PRODUCT.md`, `docs/design-system.md`, `src/styles/tokens.css`). Ces derniers sont des documents de contexte, pas une copie complète exécutable du dépôt uploadé. La vignette `.thumbnail` est une prévisualisation de l’outil auteur et n’est pas une dépendance de rendu des maquettes.

Le rôle « référence principale » revient au Design System et à DESIGN.md ; Auth, Dashboard, Ventes et Rôles sont leurs déclinaisons. Sidebar alternative reste explicitement une proposition B, sans validation d’adoption.

## Dépendances et lecture hors ligne

Les originaux appellent Google Fonts et le runtime charge React18.3.1, ReactDOM18.3.1 et Babel standalone7.29.0 depuis unpkg. Les icônes Lucide static0.469.0 référencées par les six maquettes (y compris leurs états et noms calculés) sont également archivées avec leur licence. Ces trois scripts et leurs licences sont archivés dans [dependencies](dependencies/). Les neuf polices TTF déjà présentes dans `public/auth/` sont copiées avec leurs licences pour l’aperçu autonome ; elles couvrent les familles/graisses des maquettes. [dependencies-manifest.json](dependencies-manifest.json) précise URLs/source et empreintes. Il ne s’agit pas d’une modification des références originales.

Aperçu sans installation ni dépendance réseau, depuis la racine frontend :

```sh
python3 docs/design-system/references/preview.py --port 3217
```

Ouvrir `http://127.0.0.1:3217/claude-original/Design%20System.dc.html` ou les autres `.dc.html` au même emplacement. [preview.py](preview.py) remplace **dans les réponses HTTP seulement** les URLs CDN par les scripts locaux et Google Fonts par [offline-fonts.css](dependencies/offline-fonts.css). Les originaux restent inchangés. Le serveur écoute uniquement sur loopback. Le moteur auteur interprète les templates `x-dc` et `text/x-dc` ; afficher seulement le HTML sans runtime ne suffit pas.

Les scripts tiers sont une archive de rendu des maquettes, pas des dépendances applicatives à installer dans VORTEX. Conserver leurs notices/licences. Les TTF locaux sont les ressources déjà utilisées par l’auth ; les réponses WOFF de Google Fonts dépendent du navigateur et ne sont pas présentées comme identiques octet pour octet à ces TTF.

## Inventaires de consultation

- [Tokens light/dark et mapping complets](tokens-complets.md)
- [Contrastes fournis](contrastes.md)
- [Divergences](divergences.md)
- [Couverture des sections](couverture.md)
- [Inventaire des valeurs](inventaire-valeurs.md)
- [Données rendues du Design System](design-system-render-data.json)
- [Occurrences de couleurs et lignes sources](source-color-occurrences.json)
- [Styles inline et blocs CSS exacts](source-style-declarations.json)
- [Rapport de validation](validation.md)

Contrôler la documentation et les archives :

```sh
python3 docs/design-system/references/verify.py
```

Ce contrôle documentaire ne remplace pas les tests visuels et d’accessibilité après une modification d’interface.

Test reproductible du rendu des six maquettes (Playwright disponible et serveur ci-dessus démarré) :

```sh
CHROME_PATH=/usr/bin/google-chrome PLAYWRIGHT_MODULE=/chemin/vers/playwright node docs/design-system/references/verify-preview.cjs
```

[verify-preview.cjs](verify-preview.cjs) bloque toute requête externe et vérifie HTTP, templates rendus et erreurs JavaScript. Résultat conservé : [offline-render-validation.json](offline-render-validation.json). Ce contrôle du rendu de références ne teste pas le frontend métier.
