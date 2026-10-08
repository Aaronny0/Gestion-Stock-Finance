# Bonnes pratiques et maintenance permanente

Avant tout travail UI : lire [README](README.md), chapitres concernés, [divergences](references/divergences.md), fichiers réels et AGENTS applicables. Identifier composants/tokens réutilisables, états, permissions, largeur utile et styles legacy qui peuvent gagner dans la cascade.

Ne pas ajouter de nouvelle couleur, famille, espacement, rayon ou comportement arbitraire. Ne pas copier des valeurs d’une capture sans identifier son contexte. Ne pas convertir la proposition Sidebar B en standard. Ne pas uniformiser silencieusement #007176 et #057176. Le design n’autorise jamais la suppression d’une validation, d’un contrôle serveur ou de l’approbation administrative.

Éviter une migration globale dans une tâche locale ; conserver handlers, appels API, calculs métier et URL publiques. Réutiliser primitives UI et cn/CVA lorsque adaptés. Une différence existante se signale avant correction ; une demande de documentation ne constitue pas une approbation de refonte.

## Évolution approuvée

1. Tracer la demande et son approbation explicite dans le travail/description du commit.
2. Décrire la valeur/source antérieure, la nouvelle, les usages, raisons et impacts light/dark/accessibilité.
3. Mettre à jour le chapitre opérationnel et le registre dans le même travail que code/tests ; ajouter une nouvelle référence datée et son manifeste. **Ne jamais écraser l’archive originale** pour faire disparaître l’écart.
4. Vérifier responsive, clavier, états, permissions et régressions. Mettre à jour la checklist et fournir preuves/limites de validation.
5. Commit explicite ; push normal sur branche autorisée, sans embarquer les changements d’autres travaux ni force-push.

Une correction documentaire fidèle à une source existante peut préciser une erreur factuelle ; elle ne doit pas servir à faire valider rétroactivement une nouvelle direction graphique. Une évolution du design demande une validation explicite.

AGENTS impose ce cycle à chaque session ; aucune mémoire de conversation n’est nécessaire. Pas d’automatisation planifiée créée : « maintenance automatique » signifie ici obligation de méthode intégrée aux instructions versionnées, pas une garantie technique qu’un tiers ne pourra jamais contourner les règles.
