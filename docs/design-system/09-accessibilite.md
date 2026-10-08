# Accessibilité — cible WCAG 2.2 AA

Sources : [contrastes fournis par Claude](references/contrastes.md), [DESIGN.md](references/claude-original/DESIGN.md). Les valeurs ci-dessous sont des exigences et points de contrôle ; elles ne prouvent pas à elles seules la conformité de l’application.

Texte normal :4.5:1 ; grand texte :3:1 ; éléments graphiques/UI significatifs :3:1. Les 31 couples light/dark fournis sont conservés intégralement. Correction déclarée chart-3/card2.75→3.02. Les ratios du handoff ne valident pas automatiquement les HEX différents du HTML, ni les tokens indigo actuels : contrôler les couleurs effectivement composées sur leur fond, y compris alpha et états.

Cibles tactiles **44×44 px minimum selon VORTEX**. C’est une exigence produit, ne pas la présenter comme le seuil universel de tous les critères WCAG AA. Boutons desktop40 et small36 peuvent nécessiter une zone interactive44 ; nav actuelle min34 est un écart à contrôler.

- Structure sémantique : titre principal, sections, labels, tableau/headers, navigation et état actif `aria-current`.
- Champs nommés par label ; erreur textuelle avec `aria-invalid` et `aria-describedby` ; aide persistante, pas seulement placeholder ; focus sur la première erreur utile.
- Navigation clavier complète : Tab, Shift+Tab, Enter, Espace, Escape ; pas de piège ; focus visible, non masqué par barres fixes ; skip-link vers contenu.
- Dialogues : nom accessible, focus initial/capturé/restauré ; confirmation destructive compréhensible. Tooltip ne remplace pas le nom d’un bouton icône.
- Résultats asynchrones : status/live region pour chargement et succès, alerte pour erreur ; ne pas annoncer chaque frame d’animation.
- Statuts avec texte et icône ; graphique accompagné d’une information lisible et moyen accessible d’accéder à sa source.
- Reflow/zoom, libellés longs, tailles tactiles, lecteur d’écran, orientation et clavier virtuel à vérifier selon écran.
- Respect de prefers-reduced-motion ; ne pas flasher ou rendre le mouvement indispensable.

Les tests navigateur existants vérifient certains comportements clavier, tailles et absence de débordement, mais ne constituent pas un audit WCAG complet. La mission documentaire ne lance ni audit visuel global ni certification. Voir [checklist](12-checklist-validation.md).
