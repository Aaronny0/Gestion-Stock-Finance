# Registre des divergences — aucune correction implicite

Constats du8 octobre2026. Toutes ces divergences sont signalées avant une éventuelle correction ; la présente mission documente et protège, sans arbitrage graphique ni changement de sécurité.

| ID | Sources en contradiction | Constat / décision requise |
| --- | --- | --- |
| D01 Version | Titre HTML / DESIGN.md Claude | 2.0 vs2.1 ; nom documentaire2.0 conservé, versions originales inchangées |
| D02 Primaire | HTML / scale600 et handoff / auth actuelle | Fonctionnelle007176 vs marque/token057176 ; auth choisit057176 ; aucune équivalence silencieuse |
| D03 Surfaces | HTML / palette JSON | backgroundf9f9fc contre HEX du token handoff ; foreground0a1a1b contre HEX handoff ; conserver couples exacts par source |
| D04 Sémantiques | HTML / handoff | Info0070b5/e4f5ff vs0470a5/e8f5fe ; destructive douceffede9 vsfeeeec ; warningfff2d6 vsfff2d9 |
| D05 Typo | DESIGN.md / HTML | Titre28/34 vs30/1.15 ; méta12/16/500 vs12.5/400 ; auth32 et30mobile |
| D06 Tables | DESIGN.md§9 / §14 et Ventes | Ligne52 vs60 ; cartes sous768viewport vs contenu utile<900 ; ne pas fusionner seuils |
| D07 Élévation | Règle carte bordure seule / handoff et Auth | Token shadow-card non nul en light ; stock auth bordure+ombre ; INPUT actuel border+shadow-sm |
| D08 Rayons | Règles / handoff / frontend | 8/12/18 ; handoff ajoute base10 et sm6 ; frontend xl16 ; illustration auth14 et Google10 |
| D09 Mouvement | Règle120–200 / Auth | Formulaire220ms, reçu/stock500ms ; spinners/pulse cycliques ; exceptions documentées |
| D10 Split auth | DESIGN.md / HTML et frontend | 5/7 décrit contre44% max640 px réalisé ; seuil960 cohérent |
| D11 Global actuel | DESIGN.md racine / tokens frontend / Claude | Racine corail, tokens indigo5551c5 +DM Sans, cible pétrole+Geist/Bricolage ; aucune migration dans cette mission |
| D12 Rail actuel | product.css / Claude | Rail sombre25263b et active454365 contre rail claireff6f6, accentd2ecee, barre3 ; code barre2 |
| D13 Dimensions actuelles | PageContainer/AppSidebar / Claude | 1680 vs1440 ; rail w-64 en rem vs248 px ; repli72 px cohérent ; topbar h-16 en rem vs64 px ; tête rail72 |
| D14 Dark | Handoff / application | Handoff light+dark complet ; tokens globaux sans.dark ; auth light forcé ; pas de dark produit certifié |
| D15 Charts | Mapping et charts actuels / Claude | chart2 nommé success et utilisé marge, code vert historique contre marge magenta ; CA AreaChart vs histogramme cible |
| D16 Statuts | DS HTML / Ventes / StatusBadge | Exemple destructive Remboursée dans DS ; Ventes rembourse neutre et crédit warning, Retour partiel info ; garder sémantique métier explicite |
| D17 Permissions | Annotation HTML / DESIGN.md / code | Marge parfois propriétaire seulement contre analytics.cost_margin_read ; serveur autorité ; comptable Trésorerie design lecture mais cash.open_close manquant dans defaults |
| D18 Sidebar B | Proposition alternative / standard | 312/68 et double rail sont une proposition, pas248/72 validé |
| D19 Ancienne documentation | docs/design-system.md / fichiers actuels | Référence Phase1 déclare tokens autorité et extractions features/* ; certains chemins absents ; documentation officielle nouvelle hiérarchie |
| D20 Signup | Maquette / activation réelle | CTA de création espace immédiat doit rester Envoyer ma demande ; activation administrative obligatoire |
| D21 Tactile | Règle44 / contrôles existants | Bouton design desktop40, classe code small h-9 en rem, nav min34 ; vérifier zone réelle44 ; aucune conformité tactile globale déduite |
| D22 Contrastes | JSON/MD / exemples HTML et code | Ratios31couples du handoff ne certifient ni HEX alternatifs, ni indigo, ni alpha composés |
| D23 Logo | Logo fourni / note DESIGN.md | Violet toujours fourni, recoloration pétrole suggérée seulement ; conserver original |
| D24 Unités rem | Base14 px / utilitaires Tailwind | Ne pas convertir h-16 en64 px ou w-64 en256 px sans vérifier le root. Avec --spacing:.25rem et root14 : h-16=56 px, w-64=224 px, px-4/6/8=14/21/28 px ; cibles en pixels du design distinctes. |

Pour arbitrer : citer ID, fichiers/sections, valeur retenue, usages, permission éventuelle et validation explicite. Ajouter une entrée datée ; ne pas supprimer l’historique ni changer les originaux. Si aucune décision n’est fournie, ne pas transformer ce registre en autorisation automatique de refonte.

## Application dashboard — 8 octobre 2026

La demande d’implémenter le dashboard Claude applique la maquette `Tableau de bord.dc.html` uniquement à `/app` et `/demo` (route canonique `/`). D02/D03/D05 : primaire fonctionnelle `#007176`, surfaces HTML, Geist/Bricolage/mono locaux. D12/D13/D24 : rail clair 248/72 px, contexte64 px, contenu1440 px et gouttières32/24/16 px physiques. D15 : histogramme CA pétrole et marge magenta `#d72f92`, valeurs négatives visibles. D17 : marge commandée par `analytics.cost_margin_read`, jamais par le seul nom du rôle. Logo original conservé (D23).

Ces décisions sont isolées dans `src/features/dashboard/dashboard.module.css` ; les valeurs globales, les autres pages et les originaux archivés ne changent pas. D11/D12/D13/D15 restent applicables aux autres modules historiques. La variation comparative n’est affichée que si la période précédente est calculable à partir des données disponibles ; aucun pourcentage fictif n’est ajouté au reporting serveur.

## Décision utilisateur — 9 octobre 2026

La demande explicite de reproduire tous les HTML, accompagnée d’une capture de `Sidebar alternative.dc.html`, approuve D18 : la navigation produit utilise maintenant le double rail 68 + 244 = 312 px, replié à 68 px. Les liens sont filtrés par les permissions existantes ; le panneau montre uniquement la section choisie et la caisse de la boutique active. La recherche interroge les données autorisées déjà chargées, sans recherche serveur inventée.

D02/D03/D11/D12/D13/D24 : les écrans métier utilisent désormais les couleurs HEX et les polices locales des HTML, avec une racine physique de 16 px limitée au workspace et des dimensions explicites. Les pages publiques ne sont pas refondues. Auth applique la primaire fonctionnelle HTML `#007176` ; les archives et le handoff `#057176` restent intacts. Dashboard : gouttière HTML 28 px, blocs et tables denses. Ventes : lignes 60 px, filtres et panneau de détail 460 px ; cartes lorsque la largeur utile devient inférieure à 900 px.

Le contenu métier reste celui des API : pas de chiffres de maquette, de paiements simulés, de fausse activation ou de privilèges supplémentaires. Les documents `Design System.dc.html` et `Rôles et écrans.dc.html` restent des références et matrices consultables dans l’aperçu hors ligne ; ils ne deviennent pas des parcours métier artificiels.

## Décision utilisateur — 18 octobre 2026

**D25 — Barres de défilement et caisse.** La demande explicite d'améliorer les barres de défilement (capture du panier de caisse) et de corriger les défauts visibles trouvés en parcourant les écrans (1440, 1100 et 375 px) approuve :

- une règle globale dans `src/styles/base.css` : `scrollbar-width: thin` et `scrollbar-color` dérivée de `--muted-foreground` à 45 % de transparence, avec repli `::-webkit-scrollbar` sans flèches (`@supports not (scrollbar-width: thin)`). **Aucune nouvelle couleur** : seul un token existant est composé avec de la transparence. Le rail sombre (`#57596e`, D12) et les rangées volontairement masquées (`[scrollbar-width:none]`) gardent leurs règles locales, plus spécifiques ;
- la classe utilitaire `.scroll-hint` : `scrollbar-gutter: stable` et un fondu de `--card` sur le bord où du contenu est caché (ombre de `--foreground` à 14 %). Appliquée au panier de caisse, bureau et tiroir mobile ; à réutiliser pour tout conteneur qui défile dans une carte ;
- la caisse : le panier fixe n'apparaît qu'à partir de 1280 px (`xl`), en dessous le tiroir « Voir le panier » laisse toute la largeur aux produits ; la grille produits utilise `repeat(auto-fill, minmax(11rem, 1fr))` (11 rem = 154 px) au lieu de colonnes fixées par seuil d'écran ; le placeholder de recherche devient « Produit, marque, IMEI… » pour tenir dans un champ étroit ;
- Stock & catalogue sur mobile : « Valeur d'achat du stock » n'est plus repoussée à droite (`margin-left: 0`).

Limites : seuil du panier fixe de caisse (1280 px) choisi sur l'observation à 1100 px, non sur une maquette Claude ; vérifié à 1440, 1100 et 375 px, pas à 768 ni 320 px. Les couleurs de la scrollbar ne sont pas contrôlées en contraste (élément décoratif natif, non certifié par D22).

**D26 — Stock & catalogue au gabarit Listes.** La demande explicite de corriger le design de Stock & catalogue (icônes mal placées, parcours UI/UX), accompagnée d'une maquette Claude Design validée par l'utilisateur, approuve :

- en-tête PageHeader sans eyebrow décoratif, titre « Stock & catalogue » comme Ventes ; une seule primaire « Nouvelle entrée » à droite, actions secondaires outline (Importer, Transférer, Nouveau produit) ; sous 768 px, secondaires regroupées dans un menu « ⋯ » à côté de la primaire ;
- SummaryStrip de 3–4 totaux (références, unités, à réapprovisionner, valeur d'achat sous `stock.cost.read`), sur le modèle Ventes : une ligne, puis 2 × 2 sous 860 px de largeur utile (container query). La cellule « À réapprovisionner » filtre la liste ; elle remplace l'encadré beige `#eee8d9` hors palette et son icône `PackagePlus` (sens « ajout ») par l'icône d'alerte et les tokens warning existants ;
- onglets soulignés dans la carte de liste (Catalogue, Entrées & ajustements, Transferts, Réapprovisionnement), avec compteurs ; Réapprovisionnement devient un onglet au lieu d'un bouton isolé ;
- filtres booléens en boutons bascule (`aria-pressed`) à la place des cases à cocher, même hauteur 40 px que les listes ; Colonnes/Exporter alignés à 40 px dans la carte, comme Ventes ; bouton icône « Effacer les filtres » ;
- table : lignes 52 px (règle générale), montants et quantités alignés à droite en chiffres tabulaires (option additive `meta.align` de `DataTable`, sans effet sur les autres listes), quantité avec seuil, badges à pastille comme Ventes ;
- deux états vides distincts : catalogue vide (actions Importer / Créer un produit et trois étapes) et aucun résultat filtré (Effacer les filtres).

**Aucune nouvelle couleur** : uniquement les valeurs HTML déjà appliquées par Ventes (`#dde3e4`, `#eaefef`, `#586767`, accent `#dff2f2/#04585c`, warning `#fff2d6/#864900/#e8a127`, destructive `#9e1618`). Le point « Valeur d'achat du stock » de D25 est remplacé par cette grille. Limites : vérifié dans le navigateur à 1440 px, ~800 px et 375 px sur `/demo` ; les suites Playwright (`test:browser`) n'ont pas pu être exécutées (module `playwright` absent du checkout) ; l'état « catalogue vide » n'a pas de jeu de données de démonstration et n'a pas été vu en rendu réel.

**D27 — Modales unifiées sur Radix.** L'utilisateur a validé le 18 octobre 2026 le spec [composants partagés](../../superpowers/specs/2026-10-18-ui-composants-partages-design.md), approche A. Ce spec part d'une capture de « Créer un produit » collée en haut à gauche. Il approuve :

- une seule famille de modales, le `Dialog` Radix (`src/components/ui/dialog.tsx`) :
  - tailles nommées `sm`/`md`/`lg`/`xl` (448/640/768/1024 px) ; corps espacé par défaut (`space-y-4`) ;
  - en-tête et pied fixes, filet `#eaefef` ; seul `DialogBody` défile, avec `.scroll-hint` (D25) ;
  - hauteur maximale `min(100dvh − 32px − safe-area, 90dvh)`, rayon 12 px, ombre `--shadow-dialog`, fond `foreground/35` ;
- croix de fermeture de 44 × 44. Le focus initial va au premier champ du corps, jamais à la croix. Le focus revient au déclencheur, ou au bouton « Autres actions » si l'action venait d'un menu (`useReturnFocus`) ;
- des façades à API inchangée :
  - `Modal` et `ConfirmDialog` (`src/frontend/ui.tsx`) ;
  - `ActionForm` (`src/frontend/forms.tsx`), avec des boutons shadcn. Un formulaire modifié ne se ferme plus sans confirmation, ni par Échap ni par un clic sur le fond (`onCloseRequest`) ;
- le retrait du `<dialog>` natif et de son CSS legacy `.modal*` : ombre violette, rayon 15 px et fond violacé de l’ancienne palette (D11) ;
- sous 640 px, des boutons de pied empilés en pleine largeur, primaire en haut ;
- deux corrections de contenu : « 1 unité » au singulier, et « Motif / commentaire » en pleine largeur.

Le rayon 18 de la ligne Dialog du chapitre 05 (DESIGN.md) reste la cible documentée. L'implémentation garde les 12 px déjà appliqués par le Dialog Radix (D08). La règle `dialog:modal { margin: auto }` de `src/styles/base.css` vient d'un correctif non commité de l'utilisateur. Elle n'a plus d'effet, puisqu'il n'y a plus aucun `<dialog>`, mais elle est laissée à sa décision.

**D28 — Composants de liste partagés.** Le même spec approuve les composants suivants :

- **`SummaryStrip` / `SummaryItem`** (`src/components/data-display/summary-strip.tsx`) :
  - modèle D26 : une ligne, puis 2 × 2 sous 860 px de largeur utile (container query), la dernière cellule impaire en pleine largeur ;
  - une cellule `onPress` devient un bouton `aria-pressed` ;
  - remplace `MetricCard`, `.finance-summary`, `.team-summary`, `.directory-summary`, `.sales-ledger-summary` et les cartes de la fiche produit et des crédits ;
- **`ListCard` / `ListTabs`** (`src/components/data-display/list-card.tsx`) :
  - porte une seule fois les surcharges de `DataTable` qui étaient dupliquées entre Ventes et Stock ;
  - contrôles de la barre d'outils à **40 px** (44 px en `pointer: coarse`) ;
  - lignes de 52 px, ou 60 px avec `density="comfortable"` pour Ventes (D06) ;
  - lignes-cartes sous **900 px** de largeur utile, « Colonnes » masqué dans ce mode ;
  - « Colonnes » et « Exporter » passent à la ligne ensemble ;
  - onglets soulignés en liens (`aria-current`) ou en `tablist` au clavier (flèches, Début, Fin). Ils remplacent les onglets Radix en pastille (Crédits, Comptabilité) et `.page-tabs` (Statistiques) ;
- **`FilterChip`** (`src/components/ui/filter-chip.tsx`) : style unique D26 de Stock, 40 px, actif `#dff2f2`/`#04585c`, variante warning. Les statuts de Ventes quittent la pilule noire de 34 px. `ClearFiltersButton` l'accompagne ;
- **`SegmentedControl`** (`src/components/ui/segmented-control.tsx`) : conteneur `#eaefef` à 40 px. Il remplace `.period` (Ventes) et `.presets` (Dashboard) ;
- **`DataTable`** : props additives `toolbarStart`, `emptyKind`, `filtered` et `onClearFilters` (un filtre de page donne l'état `no-results`), attributs `data-list-*`. Sous 480 px de largeur utile, la pagination numérotée ne garde que la page courante. `DateRangeFilter` devient fluide sous 640 px et plus compact au-delà (144 px par champ).

**D29 — États vides typés.** `EmptyState` (`src/components/data-display/empty-state.tsx`) :

- prend `kind` (`first-use`, `no-results` ou `error`), un titre obligatoire, des actions, des étapes et « Effacer les filtres » ;
- place l'icône centrée au-dessus du titre ; elle était décalée à gauche sur Achats, Troc et Rachat.

Chaque écran a son propre texte. Le message générique « Essayez de modifier vos filtres ou créez votre premier élément » disparaît. Une liste sans filtre actif ne propose plus de modifier les filtres (cas de la fiche produit). Le schéma troc/rachat devient les étapes de l'état « premier usage ».

**D30 — En-têtes fonctionnels et harmonisations.** Sur tous les écrans métier :

- **En-têtes.** `PageHeader` perd `eyebrow` et le filet bas. Les titres-slogans deviennent le nom de l'écran (« Achats », « Comptabilité », « Trésorerie & caisse »…). L'en-tête porte une seule primaire et des secondaires outline, regroupées sous 768 px dans « Autres actions ». Une secondaire seule sans primaire n'est pas repliée.
- **Navigation.** Le bouton « Retour » du shell ne s'affiche plus que sur une fiche (produit) : il ramène à la liste en restaurant le défilement. Il disparaît des pages de premier niveau et de leurs onglets. Le fil d'Ariane n'affiche « Détail » que pour une fiche (produit, vente).
- **Fiche produit.** « Nouvelle entrée » en primaire. Modifier, Ajuster, Transférer et Archiver passent en secondaires.
- **Format des données.**
  - Les dates des listes suivent le format de Ventes via `formatListDate` (`src/lib/format.ts`), sans heure inventée pour une date seule ; l'année s'affiche quand elle diffère de l'année courante.
  - Les montants et leurs en-têtes sont alignés à droite (`meta.align`).
  - Les modèles de rôles affichent des libellés de permissions et non des clés techniques.
- **Clients et Fournisseurs.** La colonne « Voir › » et les cases à cocher sans action groupée sont retirées.

**Aucune nouvelle couleur.** Les nouveaux CSS modules n'utilisent que `#fff`, `#dde3e4`, `#eaefef`, `#586767`, `#f9f9fc`, `#0a1a1b`, `#007176`, `#dff2f2`, `#04585c`, `#fff2d6`, `#864900`, `#e8a127` et `#9e1618`, contrôlés par `tests/ui-components.test.cjs`. Le survol des cellules et des puces passe de `#f5f7f7` à `#f9f9fc`. Le fond du segmenté passe de `#e9f2f2` à `#eaefef`.

**Limites.**

- Vérifié sur `/demo` à 1440, 768 et 360 px par `tests/ui-audit.cjs` : 22 routes, 6 modales à 1440 × 900 et 360 × 640. Contrôle visuel par captures sur chaque lot.
- Non vérifié à 320 px, ni en dark mode (D14).
- Les états « premier usage » de Stock, Achats, Troc, Rachat et Crédits n'ont pas de données de démonstration et n'ont pas été vus en rendu réel.
- Le graphique des statistiques garde sa couleur historique (D15).
- Les pages publiques et l'authentification ne sont pas concernées.
