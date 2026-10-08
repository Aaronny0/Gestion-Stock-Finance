# Checklist de validation

## Avant modification UI

- [ ] Lire AGENTS et README du design system, chapitres applicables et registre des divergences.
- [ ] Identifier maquette/règle source, version, composants et tokens existants, cascade globale/legacy/isolée.
- [ ] Signaler contradiction avant correction ; nouvelle valeur/style uniquement après validation explicite.
- [ ] Lister états, permissions fines, flux réels et contraintes d’approbation administrative.

## Après modification UI

- [ ] Contexte, hiérarchie, une primaire, drilldown même boutique/période.
- [ ] Couleurs exactes selon source/arbitrage ; montants tabulaires, devise, labels et statuts.
- [ ] Chargement, vide, erreur/retry, hors connexion, accès réservé.
- [ ] Tous rôles concernés ; colonne/action sensible masquée et backend inchangé.
- [ ] Minimum375/768/1440, largeur320 si applicable, seuils959/960 auth et largeur utile899/900 listes ; pas de débordement de page.
- [ ] Clavier, focus, labels, erreurs associées, annonces, dialogues et retour focus ; contrôle contraste couleurs réelles ; tactile44 px.
- [ ] Reduced-motion ; aucune simulation substituée à une fonctionnalité réelle.
- [ ] Comparaison captures originales/implémentation mêmes dimensions/état ; régressions sur routes voisines.
- [ ] TypeScript, lint, tests appropriés et build selon tâche ; documenter résultat réel et limites, pas une conformité supposée.
- [ ] Si design approuvé évolue, documentation et référence datée mises à jour dans le même travail.

## Pour une mission documentaire

- [ ] Couvrir les six sections du Design System HTML et les §0–14 de DESIGN.md.
- [ ] Valeurs HEX/OKLCH et variables comparées sans approximation ; contradictions explicites.
- [ ] SHA-256 des archives identiques aux originaux ; dépendances archivées séparément.
- [ ] Liens Markdown, ancres et chemins de code vérifiés.
- [ ] Instructions AGENTS conservées et applicables au dépôt entier.
- [ ] Diff limité aux documents/archives/outils documentaires ; pas de refonte ni mise à jour de tokens applicatifs.
- [ ] Indexation explicite des seuls fichiers de mission ; commit/push normal, vérification branche distante.

Résultats de cette livraison : [validation](references/validation.md).
