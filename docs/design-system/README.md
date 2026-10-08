# VORTEX — Design System officiel 2.0

Référence opérationnelle permanente · édition documentaire du 8 octobre 2026. Aucun changement d’interface dans cette mission.

**Lire cette page avant toute intervention UI**, puis les chapitres applicables et le [registre des divergences](references/divergences.md). Ne pas considérer l’état courant du frontend comme une validation automatique du design.

## Statut et hiérarchie

1. Les références originales fournies par Claude définissent le design ; [archives inchangées](references/README.md), vérifiables par SHA-256.
2. Ce dossier traduit les références en règles de travail. Les contradictions restent visibles, sans arbitrage silencieux.
3. Les tokens et composants du frontend sont l’implémentation, parfois encore historique.
4. [AGENTS.md](../../AGENTS.md) impose la consultation et la maintenance à chaque session dans ce dépôt.

Le nom demandé « VORTEX 2.0 » est conservé. La maquette `Design System.dc.html` affiche 2.0 ; le `DESIGN.md` livré par Claude se déclare **2.1**, octobre 2026. Aucune version source n’est réécrite. La primaire fonctionnelle de la maquette est **#007176** ; l’échelle marque 600 et le handoff donnent **#057176 / oklch(0.5 0.084 200)**. Ces valeurs ne sont pas synonymes : voir [couleurs](02-couleurs-et-tokens.md).

## Parcours de lecture

- [01 · Philosophie](01-philosophie-design.md)
- [02 · Couleurs et tokens](02-couleurs-et-tokens.md)
- [03 · Typographie](03-typographie.md)
- [04 · Espacements et layout](04-espacements-et-layout.md)
- [05 · Composants](05-composants-ui.md)
- [06 · Navigation et permissions](06-navigation.md)
- [07 · Responsive](07-responsive.md)
- [08 · Interactions et animations](08-interactions-animations.md)
- [09 · Accessibilité](09-accessibilite.md)
- [10 · Règles par écran](10-regles-par-ecran.md)
- [11 · Bonnes pratiques et maintenance](11-bonnes-pratiques.md)
- [12 · Checklist](12-checklist-validation.md)
- [13 · Correspondance avec le code](13-correspondance-code.md)

## Inventaires et preuve

[Tokens complets](references/tokens-complets.md), [valeurs CSS et occurrences couleur](references/inventaire-valeurs.md), [contrastes fournis](references/contrastes.md), [couverture des sections](references/couverture.md), [divergences](references/divergences.md), [contrôle documentaire](references/validation.md).

## Limites de portée

Ces instructions sont versionnées, relues par les agents travaillant sous ce dépôt ; elles ne modifient pas les instructions d’un autre dépôt et ne constituent pas un contrôle automatique d’un agent qui ne les lirait pas. La maintenance est obligatoire lors d’une évolution approuvée, sans tâche planifiée ni service de surveillance. Les règles métier, les permissions effectives du backend et l’approbation administrative priment sur les données fictives des maquettes. Les variations de thème non définies ne doivent pas être inventées.
