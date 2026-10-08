# Espacements et layout

Source : [DESIGN.md §8–11 et §14](references/claude-original/DESIGN.md).

| Élément | Valeur source |
| --- | --- |
| Grille | 4 px |
| Échelle | 4, 8, 12, 16, 20, 24, 32, 40, 56 px |
| Gouttières mobile / tablette / desktop | 16 / 24 / 32 px |
| Gap entre cartes | 16 px |
| Rail ouvert / replié | 248 / 72 px |
| Barre de contexte | 64 px |
| Contenu max | 1440 px |
| Rayons contrôle / carte / panneau-dialogue | 8 / 12 / 18 px |
| Badges | pilule |
| Bouton desktop / tactile | 40 / 44 px |
| Champs auth | 44 px |
| Table générale | ligne 52 px |
| Liste Ventes | ligne 60 px ; carte mobile 76 px |
| DetailSheet Ventes | 460 px, limité à 100vw |
| Formulaire auth max | 400 px |

Le handoff fournit aussi `--radius:10px` et `--radius-sm:6px` ; ne pas les supprimer pour ne garder que 8/12/18. Il contient une ombre carte malgré la règle « bordure seule ». L’auth montre une carte de stock avec bordure et ombre : exceptions/contradictions enregistrées dans le [registre](references/divergences.md).

Le shell métier conserve le contexte, puis PageHeader (titre + description + une primaire à droite), SummaryStrip, FilterBar, table/listes et panneau de détail. Actions secondaires outline ; détail sans perdre la liste filtrée. Les tableaux de bord organisent activité et caisses en 2/3–1/3, puis ventes récentes et stock critique.

Auth : split décrit comme 5/7 dans DESIGN.md ; HTML et CSS actuel utilisent panneau 44 %, max640 px, padding40/48, formulaire400 px et panneau droit clair. Sous960 px le panneau identité disparaît. L’illustration n’est pas une fonctionnalité métier.

## Écarts mesurés dans le code

`PageContainer` : max1680 px, classes px-4/6/8. `AppSidebar` : w-64 (16rem),72 px replié ; tête72 px. `Topbar` : h-16 (4rem). Le rail devient sombre dans `src/styles/product.css`. Attention : le socle fixe html à14 px ; les utilitaires Tailwind en rem ne valent donc pas leurs conversions habituelles à16 px. Avec la configuration standard --spacing:.25rem, rail ouvert224 px, topbar56 px, gouttières14/21/28 px sont les valeurs dérivées, à confirmer par styles calculés si une surcharge change le root. Les valeurs officielles248/64 et16/24/32 restent en pixels. Voir D24. Ne pas changer ces éléments dans une mission purement documentaire.

Contrôle navigateur en lecture seule sur `/demo`, viewport1440×1000 : root14 px, --spacing .25rem, rail224 px et topbar56 px mesurés. Ce constat décrit le rendu courant et ne change pas les dimensions officielles de Claude.
