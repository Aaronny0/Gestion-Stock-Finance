<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## VORTEX — DESIGN SYSTEM OFFICIEL (OBLIGATOIRE)

Ces règles s’appliquent à toutes les interfaces et à tous les sous-dossiers de ce dépôt frontend, même sans contexte des conversations précédentes. Elles complètent les règles Next.js ci-dessus et ne remplacent aucune instruction métier, technique ou de sécurité applicable.

1. Avant toute création, modification ou refonte UI, lire `docs/design-system/README.md`, le registre `docs/design-system/references/divergences.md` et les chapitres applicables.
2. Considérer le Design System VORTEX 2.0 comme la référence graphique officielle. Les versions originales (HTML 2.0 / DESIGN.md Claude 2.1) et leurs contradictions sont documentées ; ne pas les uniformiser silencieusement.
3. Réutiliser tokens et composants existants plutôt que créer des variantes arbitraires ; vérifier leur état réel dans `13-correspondance-code.md` et le code. Le frontend historique n’est pas automatiquement conforme à la cible.
4. Respecter couleurs, typographies, espacements, rayons et comportements documentés. Distinguer primaire fonctionnelle HTML `#007176`, nuance marque/handoff `#057176` et tokens globaux historiques ; consulter les divergences avant toute correction.
5. Ne pas introduire de nouvelle couleur ou de nouveau style sans justification et validation explicite. Une demande locale ne vaut pas approbation de changement global du design system.
6. Préserver la cohérence auth, dashboard, ventes, stocks, finance, comptabilité, administration et autres modules ; conserver mécanismes réels, permissions serveur et activation administrative. Ne jamais remplacer une fonctionnalité par une simulation de maquette.
7. Vérifier responsive et accessibilité après chaque intervention visuelle : tailles/seuils applicables, clavier/focus, labels/erreurs, contrastes réels, cibles tactiles de 44 px, reduced-motion et cinq états d’interface.
8. Contrôler les régressions graphiques avec références et tests appropriés ; rendre compte des preuves et limites, sans présumer une conformité complète.
9. Hiérarchie : références originales validées → `docs/design-system/` opérationnel → tokens/composants d’implémentation ; ce fichier impose consultation/respect. Signaler toute contradiction avant correction. Ne jamais modifier silencieusement le design system pour satisfaire une demande locale ni adopter la proposition Sidebar B comme standard.
10. Lorsqu’une évolution du design est explicitement approuvée, mettre à jour documentation, registre et références datées dans le même travail, avec trace Git. Préserver les archives originales et leurs empreintes ; n’actualiser les valeurs de design documentées qu’à partir d’une évolution approuvée.

Appliquer `docs/design-system/12-checklist-validation.md` à chaque intervention concernée. La maintenance est une obligation de travail versionnée, sans dépendance à une mémoire de session. Ne pas embarquer les modifications d’autres travaux dans un commit de documentation/design.
