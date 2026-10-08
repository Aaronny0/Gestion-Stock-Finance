# Philosophie — poste de pilotage

Source : [DESIGN.md Claude, §0–5 et §9](references/claude-original/DESIGN.md), [maquette principale](references/claude-original/Design%20System.dc.html).

Un commerce tech en activité toute la journée : rail clair légèrement teinté, plan de travail blanc, chiffres immédiatement lisibles. En mode clair, le contraste vient de l’encre ; éviter les grandes surfaces sombres et saturées. Le pétrole signale l’action, le focus, la sélection et la série principale, sans devenir une décoration omniprésente.

Chaque écran répond en moins de trois secondes : où suis-je ; quelle boutique et quelle période je pilote ; que dois-je traiter et quelle action suit. Ordre de lecture : état et contexte → attention / À traiter → chiffres → détail. Une action primaire par en-tête ; les autres sont outline ou ghost. Une surface pétrole pleine par écran au maximum selon DESIGN.md ; la maquette parle aussi d’une primaire par zone : ne pas multiplier les CTA concurrents.

Les surfaces principales sont `card` et `background`, les secondaires `muted`. `accent` marque une sélection, pas le fond de toutes les cartes. Badges doux pour les statuts ; couleurs solides pour points, icônes et boutons. Une carte repose sur une bordure, l’ombre appartient aux éléments flottants.

Même grammaire pour auth, dashboard, ventes, stocks, finance, comptabilité, administration : contexte explicite, montants tabulaires, permission avant exposition d’une donnée sensible, états compréhensibles et action suivante. Pas de nouvelle direction graphique locale. Logo violet conservé dans les sources : leur suggestion de recoloration n’est pas une autorisation de le redessiner.

Historique à ne pas réintroduire comme cible : corail/minéral du DESIGN.md racine, indigo provisoire du frontend et violet 285 abandonné dans le DESIGN.md Claude. Voir le [registre](references/divergences.md).
