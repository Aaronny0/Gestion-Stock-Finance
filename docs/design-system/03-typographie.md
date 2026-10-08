# Typographie

Sources : [DESIGN.md §7](references/claude-original/DESIGN.md), [données exactes de la maquette](references/design-system-render-data.json).

Bricolage Grotesque 600–700 porte les titres d’écran, l’auth et les montants héros, jamais sous 20 px selon DESIGN.md. Geist 400–600 porte le reste de l’UI ; la maquette charge également 700. Geist Mono porte les références, IMEI et codes de compte, pas les montants ordinaires. Montants en Geist avec `font-variant-numeric: tabular-nums`, devise plus petite et muted ; héros en display selon l’échelle explicite.

## Échelle rédactionnelle DESIGN.md

| Rôle | Taille / interligne px | Graisse |
| --- | --- | --- |
| Montant héros | 44 / 48 display | 600 |
| Titre écran | 28 / 34 display | 600 |
| Titre carte | 15 / 22 | 600 |
| Corps | 14 / 20 | 400 |
| Libellé / méta | 12 / 16 | 500 |
| Overline rail | 11 / 16 ; +0.08em | 600 |

## Échelle exposée par la maquette HTML

| Rôle | Famille | Taille | Graisse | Letter spacing | Transformation |
| --- | --- | --- | --- | --- | --- |
| Montant héros | 'Bricolage Grotesque',sans-serif | 44px | 600 | -0.035em | none |
| Titre d’écran | 'Bricolage Grotesque',sans-serif | 30px | 600 | -0.025em | none |
| Titre de carte | 'Geist',sans-serif | 15px | 600 | 0 | none |
| Corps | 'Geist',sans-serif | 14px | 400 | 0 | none |
| Méta | 'Geist',sans-serif | 12.5px | 400 | 0 | none |
| Identifiant | 'Geist Mono',monospace | 12.5px | 500 | 0 | none |
| Overline | 'Geist',sans-serif | 11px | 600 | 0.08em | uppercase |

Les échantillons HTML ont `line-height:1.15`, différent des interlignes rédactionnels. Titre écran 30 px dans le HTML contre 28/34 dans DESIGN.md ; méta 12.5/400 contre 12/16/500. L’auth possède h1 32 px (30 mobile), tracking propre et titre du panneau illustré plus grand. Ces variantes sont archivées, pas normalisées silencieusement.

Capitales espacées limitées au rail et aux en-têtes de table ; pas d’eyebrow décoratif à chaque titre. Favoriser chiffres alignés et lecture immédiate, éviter les montants tronqués sur mobile.

## Implémentation actuelle

Le global `src/styles/tokens.css` définit encore DM Sans/Avenir Next ; `src/styles/base.css` applique h1 32/1.25/650 et tracking −0.035em. Ne pas confondre ce socle historique avec la cible.

L’auth charge des TTF locaux avec `font-display:swap`, sous des noms isolés : `Vortex Auth Display` (Bricolage 500,600,700 : font-0 à font-2), `Vortex Auth Sans` (Geist 400,500,600,700 : font-3 à font-6), `Vortex Auth Mono` (400,500 : font-7,font-8). Fichiers dans `public/auth/`, licences correspondantes conservées et archivées. Voir [code](13-correspondance-code.md) et [aperçu autonome](references/README.md).
