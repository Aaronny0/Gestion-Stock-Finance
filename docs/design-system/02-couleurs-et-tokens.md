# Couleurs et tokens

Sources : [palette JSON originale](references/claude-original/handoff/palette.json), [tokens CSS originaux](references/claude-original/handoff/tokens.css), [maquette](references/claude-original/Design%20System.dc.html), [DESIGN.md §1–6 et §12](references/claude-original/DESIGN.md).

## Deux niveaux à conserver

La maquette emploie `#007176` comme **primaire d’interface**, notamment boutons, liens, focus et chart principal. Sa palette marque contient `#057176` au pas 600. Le handoff définit `--primary: oklch(0.5 0.084 200)` avec HEX déclaré `#057176`. L’auth actuelle choisit ce dernier dans `--auth-primary`. Ne pas remplacer l’un par l’autre sans signaler et arbitrer la divergence ; ne pas traiter une nuance de marque comme un token fonctionnel interchangeable.

Le bleu pétrole est de hue 200 ; neutres teintés de la même hue. Hues sémantiques déclarées : destructive 27, success 152, warning 75, info 240 ; les valeurs dark ont leurs propres coordonnées exactes. Réserves indiquées par Claude : 27, 75, 152, 240, 285, 350.

## Échelle de marque et neutres

| Pas | Marque HEX | Marque OKLCH | Neutre HEX |
| --- | --- | --- | --- |
| 50 | #eef9fa | oklch(0.975 0.012 200) | #f5f7f7 |
| 100 | #dbf3f4 | oklch(0.948 0.025 200) | #eaefef |
| 200 | #bce8ea | oklch(0.9 0.045 200) | #d9dfe0 |
| 300 | #90d6d9 | oklch(0.83 0.07 200) | #c1c9c9 |
| 400 | #48b7bd | oklch(0.72 0.1 200) | #9ca7a8 |
| 500 | #009298 | oklch(0.6 0.102 200) | #768384 |
| 600 | #057176 | oklch(0.5 0.084 200) | #576767 |
| 700 | #045b5f | oklch(0.43 0.072 200) | #435354 |
| 800 | #00464a | oklch(0.36 0.061 200) | #304142 |
| 900 | #003335 | oklch(0.29 0.05 200) | #1e2f30 |
| 950 | #011d1f | oklch(0.21 0.035 200) | #0e1b1c |

Les OKLCH des neutres de chaque pas ne sont pas fournis dans `scale` : ne pas en inventer. Les couleurs fonctionnelles ont en revanche leurs coordonnées dans les tableaux complets.

## Rôles illustrés dans le HTML

| Rôle | Fond HEX | Texte HEX | Usage |
| --- | --- | --- | --- |
| Primary | #007176 | #fbfbfe | Action primaire, lien actif, focus, série principale. Une surface pleine par écran maximum. |
| Background / Foreground | #f9f9fc | #0a1a1b | Plan de travail. Encre à 17:1. |
| Accent | #dff2f2 | #04585c | Sélection, rôle, étape à faire. Jamais en fond de carte. |
| Muted | #eff4f4 | #586767 | Surfaces de second plan, texte secondaire (5,4:1). |
| Sidebar | #eff6f6 | #182728 | Rail de navigation et panneau d’auth. Clair en light, graphite en dark. |
| Sidebar primary | #d2ecee | #007176 | Élément actif du rail : fond accent + barre 3 px. |

## Sémantiques illustrées dans le HTML

| Rôle | Solide / texte | Douce / texte | Exemple |
| --- | --- | --- | --- |
| Destructive | #c51e21 / #fcfcfc | #ffede9 / #9e1618 | Remboursée |
| Success | #1a763f / #fcfcfc | #e4f9e9 / #135c30 | Payée |
| Warning | #e8a127 / #331b06 | #fff2d6 / #864900 | Partielle |
| Info | #0070b5 / #fcfcfc | #e4f5ff / #005892 | Crédit |

Le handoff diffère de certains HEX ci-dessus : par exemple info solide `#0470a5` et info douce `#e8f5fe`, destructive douce `#feeeec`. Tous les couples exacts light/dark figurent dans l’[inventaire des tokens](references/tokens-complets.md), sans conversion arrondie ajoutée. Le warning plein garde du texte sombre, jamais blanc. La couleur seule ne communique pas un statut : conserver libellé et icône.

## Graphiques — ordre fixe

| Token | Light HEX | Dark HEX | Rôle |
| --- | --- | --- | --- |
| chart-1 | #057176 | #3ebfc6 | Chiffre d’affaires (métrique principale) |
| chart-2 | #d72f92 | #f46eb4 | Marge brute — magenta, rappel du logo |
| chart-3 | #d08300 | #f5ae4b | Mobile Money / période précédente |
| chart-4 | #2c965d | #55c483 | Espèces / encaissements |
| chart-5 | #3673cb | #70a6f5 | Carte / banque |

Au-delà de cinq séries : « Autres » en `muted-foreground`. Ne pas réassigner magenta à un succès : chart-2 est la marge brute, chart-4 les espèces / encaissements. `src/lib/chart-colors.ts` et les graphiques métier portent encore des noms historiques ; leur adaptation nécessite une tâche autorisée.

## Thèmes et états

Le dark mode est défini pour les tokens du handoff, pas comme inversion automatique : surfaces élevées plus claires, primaire `#3ebfc6` avec texte sombre `#051213`, sidebar graphite. Le frontend métier n’intègre pas actuellement ce bloc `.dark` ; l’auth force `color-scheme: light`. Ne pas annoncer un thème dark livré sur cette base.

Les hover/focus de maquette restent dans l’[inventaire CSS](references/inventaire-valeurs.md) : primaire hover `#045c60`, outline hover bordure `#c0c9c9`, ghost hover `#e9f2f2`, focus bordure `#007176` + halo `rgba(0,113,118,0.18)` sur 3 px. Disabled doit être non activable, lisible et compréhensible. Les valeurs d’auth peuvent différer (`#04585c` pour certains liens).

## Réutilisation et extension

Réutiliser les rôles existants et leur mapping Tailwind `@theme inline`. Conserver les alias de migration (`--bg`, `--panel`, `--purple`…) tant que leurs consommateurs existent. Claude prescrit `--*-muted` et `--*-muted-foreground` ; le frontend utilise encore `--*-background`. Ne pas retirer des alias sans migration des usages.

Aucun nouveau token ou style arbitraire. Une évolution explicitement approuvée doit justifier usage, hue, light/dark, contraste, consommateurs, compatibilité et mise à jour documentaire dans le même commit. Les [contrastes](references/contrastes.md) sont les ratios fournis, pas un audit du frontend courant.
