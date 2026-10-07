# Livraison de la refonte VORTEX — 7 octobre 2026

## Produit livré

- Identité : marque V angulaire, rail encre, surfaces papier, accent indigo et repères jade/ambre ; chiffres tabulaires et hiérarchie typographique explicite.
- Shell : sidebar structurée par activité, contexte boutique et utilisateur, notifications, navigation mobile, bannière de démonstration et liens privés sous `/app`.
- Dashboard : composition revenu/courbe et file de priorités, bande financière, dernières ventes. Sur mobile, action prioritaire visible avant le graphique et période repliable.
- Pages métier : catalogue avec alerte de réapprovisionnement actionnable, synthèse des ventes/crédits, finances en bandes, annuaires avec soldes, paramètres avec navigation secondaire, caisse compacte. Les détails, tableaux, formulaires et états partagent les fondations communes.
- Public : `/`, `/features`, aperçu réel du dashboard, liens vers les modules de démonstration, demande d’accès sans prix public.
- Accès : connexion, demande, vérification e-mail, attente, refus, suspension, onboarding et page 404. Formulaire de complément de demande pour une nouvelle identité Google.
- Back Admin : `/admin/access`, recherche dans la page, filtre de statut, pagination, examen du prospect, contact, approbation, refus et suspension.

## Conservation métier

Pas de suppression des ventes, devis, règlements, remboursements, crédits, achats, fournisseurs, transferts, imports, trocs, rachats, comptabilité, clôtures, exports, rôles, invitations et paramètres fiscaux. Les contrats métier, clés d’idempotence et contrôles de boutique/rôle restent utilisés. Les anciennes routes françaises sont conservées. La racine `/` devient volontairement publique ; le dashboard privé est disponible à `/app/dashboard` et via l’alias historique `/dashboard`.

Les primitives Radix, TanStack, formulaires et modules fiables sont réutilisés. La compatibilité CSS historique reste en place pour éviter une suppression prématurée de composants encore importés. Aucune nouvelle dépendance UI.

## Design system

Source : `src/styles/tokens.css` et `src/styles/product.css`. Papier `#f5f5f0`, encre `#25263b`, indigo `#5551c5`, jade `#22735d`, couleurs sémantiques pour succès/attention/erreur. Échelles nommées de surfaces, espacements, typographie, rayons et mouvement. Ombres réservées aux surfaces superposées. Les pages utilisent des compositions adaptées à leur tâche, des séparateurs et des zones de travail plutôt qu’une grille uniforme de cards.

## Parcours d’accès et sécurité

Visiteur → site public / démo → demande → compte Supabase → vérification e-mail → PENDING_APPROVAL → décision Back Admin → APPROVED → connexion → onboarding si nécessaire → application.

`user_metadata` conserve les coordonnées et le marqueur de demande. Seul `app_metadata`, contrôlé côté serveur, porte l’approbation. Les contrôles sont effectués dans Next et NestJS ; une identité vérifiée seule ne peut pas créer une entreprise. La suspension est relue sur le profil courant. Les comptes historiques ne reçoivent l’accès implicite que si le backend confirme une appartenance active. Un administrateur plateforme est distinct d’un propriétaire d’entreprise.

La dernière décision conserve auteur/date/motif ; ce n’est pas un journal historique immuable de toutes les décisions. Une approbation réussie reste enregistrée si la mise en file de l’e-mail échoue ; l’administration signale le problème et permet de relancer l’action.

## Démonstration

220 clients fictifs, 360 ventes, plusieurs boutiques, catalogue, données financières et opérations simulées. Les rôles sont explorables. Les commandes utilisent l’adaptateur local ; la démo évite les appels métier et Supabase, y compris la télémétrie d’erreur. Le rechargement restaure le jeu fictif. Les états public/démo/privé remontent des providers distincts pour isoler les données.

## Responsive et observation

Captures réelles dans `output/redesign/` : dashboard desktop/mobile, stock, connexion, demande mobile et vitrine. Corrections après observation : topbar mobile, bannière de démo, filtre de période, priorité stock avant courbe ; correction du retour à la ligne des filtres comptables à 1280 px. Les tableaux complexes conservent des régions de défilement explicites ; les listes disposent des présentations mobiles déjà opérationnelles.

## Configuration et recette de l’environnement cible

- Frontend : `FRONTEND_API_URL`, URL et clé publique Supabase ; `SUPABASE_SERVICE_ROLE_KEY` exclusivement côté serveur pour le Back Admin. Ne jamais préfixer ce secret par `NEXT_PUBLIC_`.
- Accorder `vortex_admin: true` dans les **app_metadata** d’un administrateur autorisé via un canal d’administration Supabase fiable. Aucun compte réel n’a été promu par cette mission.
- Backend : configuration Supabase existante, `AUTH_SECRET` pour la file chiffrée, worker/outbox existants, SMTP, `MAIL_FROM`, `APP_URL` et origine frontend autorisée. La notification d’approbation utilise un lien de connexion sans jeton de réinitialisation.
- Frontend et backend doivent être livrés ensemble pour appliquer les restrictions et la notification. Aucune migration du schéma métier n’est ajoutée.
- Vérifier sur l’environnement cible les URL de retour Google/Supabase, la confirmation e-mail et une livraison SMTP réelle. Aucun compte réel, e-mail réel ou changement distant n’a été exécuté pendant les tests locaux.
- Les objectifs Web Vitals/Lighthouse du document de mission restent des objectifs : aucune mesure terrain ou certification WCAG n’est revendiquée.

## Auto-évaluation visuelle (subjective, sur 10)

| Axe | Note | Réserve |
| --- | --- | --- |
| Identité, UI, cohérence | 8 | Signature sobre ; certaines primitives historiques demeurent. |
| UX, authentification, démonstration | 8 | Parcours séparés et états explicites ; recette des fournisseurs réels à faire. |
| Site public, dashboard | 8 | Produit visible et priorités lisibles ; validation utilisateur encore nécessaire. |
| Navigation, typographie, formulaires | 7 | Cohérents et utilisables ; densité de certains workflows complexes à suivre. |
| Tables, graphiques, responsive | 7 | Fonctionnalités conservées ; grands tableaux nécessitent un défilement local. |
| Accessibilité | 7 | Contrôles nommés et navigation clavier ; pas d’audit externe complet. |
| Maintenabilité | 7 | Tokens et composants partagés ; compatibilité legacy encore présente. |
| Performance | Non notée | Build vérifié, mesures de performance terrain non effectuées. |
| Préparation production | 7 | Code et tests locaux ; secrets, déploiement conjoint et recette réelle requis. |

Les résultats techniques détaillés sont conservés dans `output/redesign/validation/` et, pour le backend, `output/redesign-validation/`.

## Résultats techniques

| Contrôle | Frontend | Backend |
| --- | --- | --- |
| Installation avec lockfile figé | Réussie | Réussie |
| Typecheck | Réussi | Réussi |
| Lint | 0 erreur, 1 avertissement TanStack / React Compiler | Réussi |
| Tests unitaires | 53 réussis | 65 réussis |
| Tests HTTP | Inclus dans les suites frontend | 9 réussis |
| Tests navigateur frontend | 7 suites réussies | — |
| Responsive | 624 vérifications, 48 pages × 13 formats, 0 anomalie | — |
| Build production | Réussi | Réussi |

La suite PostgreSQL isolée définitive a validé 46 tests d’intégration, 24 invariants SQL et 109 contrôles RLS. Elle comprend le parcours navigateur → Next → Nest → PostgreSQL : création d’un produit, entrée en stock, vente, remboursement et vérification des effets persistés. Un seul ancien scénario Better Auth reste exclu : il cible un ancien dépôt (`Gestion-Stock-Finance`) absent et ne constitue pas une validation de l’architecture Supabase actuelle. Le résultat détaillé est dans `../vortex-backend/output/redesign-validation/isolated-browser.log`.

Les corrections couvrent notamment le débordement des filtres comptables à 1280 px, les destinations d’authentification, l’approbation avant onboarding et les notifications. La matrice définitive a été exécutée contre un build de production isolé : aucun défaut d’hydratation ni débordement n’y a été détecté. Le cache statique du service worker est versionné ; il ne cache ni pages privées ni réponses API.
