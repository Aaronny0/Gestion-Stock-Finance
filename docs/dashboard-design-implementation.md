# Intégration du dashboard Claude — 8 octobre 2026

## Périmètre

Référence : `docs/design-system/references/claude-original/Tableau de bord.dc.html`, DESIGN.md et règles opérationnelles du design system. Interface de `/app` et `/demo` : salutation/contexte/période, alertes, bande de performance, histogramme quotidien, caisses et paiements, cinq dernières ventes, trois stocks critiques et checklist conditionnelle. Rail clair et typographies Claude limités à ces routes. Aucune refonte des autres modules.

## Fonctionnement

Le provider workspace, les commandes, le reporting serveur et les calculs comptables existants restent les sources de vérité. L’entrée de stock ouvre `ActionForm stock.entry`, la nouvelle vente ouvre la caisse de vente, les alertes et les barres mènent aux routes métier. La permission `analytics.cost_margin_read` contrôle montant et graphique de marge. Aucun accès, rôle ou activation administrative n’est attribué par le dashboard.

Les montants utilisent la devise de l’organisation et les unités mineures existantes. Les retours et marges négatives sont représentés sous zéro. Les variantes vide, chargement, erreur, hors connexion et accès réservé utilisent les états réels du workspace. La checklist se replie et disparaît une fois complète.

## Limites des données

Le contrat reporting actuel ne fournit pas de comparaison précédente : le pourcentage est omis lorsqu’elle n’est pas calculable. Un solde théorique de caisse n’est calculé côté client que si le jeu de données est complet ; sinon, l’état ouvert/fermé reste visible. Les vérifications navigateur utilisent des fixtures isolées et n’effectuent aucune écriture dans une organisation de production.

## Vérification

- TypeScript : `pnpm typecheck` et compilation TypeScript de production réussis.
- Tests unitaires : 55/55 (`pnpm test`).
- Lint : zéro erreur ; deux avertissements préexistants dans `data-table.tsx` (TanStack/React Compiler) et `google-login.tsx` (navigation).
- Build de production : réussi avec Next.js16.3.8, y compris le lanceur navigateur en mode production.
- Dashboard navigateur :320/375/768/1024/1440 px, absence de débordement après transition responsive, filtres7 jours, formulaire métier d’entrée de stock, navigation aux ventes du jour, masquage des marges sans permission, unités mineures EUR sur l’axe, revenus négatifs, activité vide, aucune exception navigateur.
- Smoke métier :14 contrôles dont24 routes, entrée2000 unités, vente3 unités/reçu, isolation boutiques, restrictions caissier, comptabilité, responsive et refus des mutations externes.
- Régressions design system :4 contrôles (devise, sélection clavier, pagination restaurée, facture fiscale/QR).
- Accès : démo isolée, shell public, activation en attente/suspendue/approuvée vérifiés.
- Documentation :14 chapitres,173 liens,17 archives et78 dépendances vérifiés, zéro erreur.

Captures locales : `output/dashboard-design/verified-{320,375,768,1024,1440}.png` ; contrôle tablette après stabilisation du rail dans `output/dashboard-design/final-tablet.png` (contenu à248 px, aucun débordement). La table des ventes devient une liste de cartes lorsque son conteneur mesure600 px ou moins : les cinq colonnes restent lisibles à côté du rail sur tablette. La démo reste accessible à `http://localhost:3100/demo`.

Les suites ne certifient pas les performances Lighthouse ni une écriture sur le backend de production. Budget de référence : mobile4G/desktop, WCAG AA, LCP2 s, INP200 ms, CLS0,1, JavaScript initial150 Ko ; ces objectifs ne constituent pas des mesures certifiées Lighthouse ou en production. Validation de cette intervention : Codex, revue visuelle et suites locales.
