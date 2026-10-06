> État global actuel et limites backend : [audit final](final-project-audit.md). Les résultats de ce document concernent sa tranche/date, pas une certification du projet complet.

# Supabase Auth — rapport final frontend

5 octobre 2026. Projet `vortex-frontend`, Next.js 16 / React 19. Backend raccordé : `../vortex-backend`, NestJS 12 / Prisma 7. Les changements existants et le rapport d’implémentation frontend ont été relus et conservés ; aucune migration distante, aucun compte Supabase ou déploiement n’a été exécuté.

## Parcours et architecture

Supabase Auth → AuthProvider (identité/session) → client HTTP lisant le Bearer actuel → proxy Next.js → JWT/IdentityLink NestJS → UUID User VORTEX, organisations/boutiques/memberships/permissions → WorkspaceProvider (snapshot métier). Les deux providers restent séparés. Le shell remonte le workspace lors d’un changement d’identité, retire les snapshots/drafts/préférences en mémoire du compte précédent et annule/ignore les lectures en vol.

Login email/password, signup avec ou sans session immédiate, confirmation email, forgot/reset password, Google OAuth, `/auth/callback`, `/auth/confirm`, `/reset-password`, logout et changements d’identité sont vérifiés au niveau code/tests. Les formulaires appellent Supabase, pas les anciens endpoints d’identité NestJS. Aucun mot de passe n’est envoyé au backend métier ; aucun secret Supabase/Google n’est dans les variables publiques. Le JWT actuel est relu pour les appels session/workspace/commandes, donc le token renouvelé traverse le proxy.

Google suit frontend → Supabase → Google → Supabase → callback frontend PKCE → session métier. Les destinations de retour sont limitées à onboarding, reset et invitation ; pas d’open redirect. `/auth/confirm` vérifie réellement l’OTP et accepte aussi `RedirectTo` complet issu d’un template email uniquement s’il correspond à un callback sur la même origine, avant d’extraire sa destination locale autorisée. Cela conserve les invitations lors d’une confirmation dans un autre navigateur.

Le brouillon d’onboarding ne contient aucun mot de passe et n’est jamais une source de permissions. Le frontend conserve `Idempotency-Key` pour les retries. NestJS crée User VORTEX, IdentityLink, Organization, Store, propriétaire et attribution boutique dans une transaction ; l’unicité du lien évite une création supplémentaire même avec une autre clé. L’email vient de l’identité confirmée, les UUID VORTEX sont conservés. Une identité sans User donne `ONBOARDING_REQUIRED`, un User sans périmètre donne `NO_MEMBERSHIP`, une demande interdite donne `FORBIDDEN`.

Invitations : inspection publique `{organization,role}`, connexion/signup/Google Supabase, puis `{token}` + Bearer vers `auth/activate`. NestJS contrôle email confirmé, destinataire, expiration et rattachement, crée au besoin le User/lien sans nouvelle entreprise et accepte les retries du même compte. L’inspection d’une invitation déjà acceptée reste possible pour reprendre une réponse incertaine.

## Corrections de raccordement

- Proxy : ajout de `Origin` transmis à NestJS, indispensable à son contrôle des mutations. Authorization et Idempotency-Key sont conservés.
- Retrait des routes historiques login/signup/logout/forgot-password de l’allowlist ; ajout `auth/accept-invitation`. NestJS ne monte plus Better Auth ni son OAuth backend.
- Contrat invitation : `organization` est un objet Organization, affichage par `.name` au lieu de `[object Object]`.
- City d’onboarding requise comme dans la validation backend ; messages et erreurs restent explicites.
- Coûts des retours de vente optionnels quand refusés côté serveur ; calculs sans NaN, coût des devis de démonstration typé explicitement lorsqu’il est connu.
- Confirmation dans un autre navigateur : reprise sûre du callback Supabase complet fourni par le template, avec tests d’origine externe refusée.
- Contrat API documenté avec les endpoints réellement livrés et les limites du socle métier préexistant.

`/session` conserve UserSession. `/workspace` a été implémenté dans NestJS et retourne les 17 collections du Snapshot réel, avec contrôle du périmètre, permissions, BigInt convertis en unités mineures sûres, historique comptable et créances conservés. Les lectures interdites et coûts non autorisés sont filtrés côté serveur ; le frontend conserve aussi ses contrôles d’affichage.

## Validation

| Commande frontend | Résultat |
|---|---|
| pnpm install | Réussi |
| pnpm typecheck | Réussi |
| pnpm lint | Réussi |
| pnpm test | 39 tests réussis : 24 métier démo/comptabilité et 15 Auth/proxy |
| pnpm build | Réussi ; routes callback/confirm et pages onboarding/reset générées |
| git diff --check | Réussi |

La recette backend complémentaire exécute le vrai handler proxy Next.js vers l’AppModule NestJS via HTTP, avec JWT signés, PostgreSQL 18 jetable et rôle LOGIN limité. 38 tests d’intégration, 24 invariants PostgreSQL et 105 checks RLS passent. Elle vérifie notamment concurrence/idempotence/rollback, session/workspace, UUID, données et coûts masqués, commande équipe, invitations existantes/nouvelles et expiration. Le backend passe aussi install/typecheck/lint/39 tests unitaires/build.

Les appels SDK et Auth/JWKS distants sont simulés ; ceci ne constitue pas une recette réelle Google/email ou multi-onglets sur le domaine de production. Aucun faux succès métier ou recours aux mutations démo n’a été ajouté aux parcours réels.

## Configuration et limites

Renseigner les variables publiques Supabase et `FRONTEND_API_URL=https://api.example.com/api/v1/`, publier ces corrections sur le frontend déjà en ligne et déployer le backend. Configuration Google/Supabase, templates email, PostgreSQL, grants/RLS, secrets outbox/SMTP et commandes exactes : [guide backend](../../vortex-backend/docs/supabase-deployment-guide.md).

Better Auth n’est plus un runtime backend : ancienne dépendance réservée aux tests historiques, routes retirées, migrations/tables et AuthToken d’invitation conservés. AUTH_SECRET est conservé pour les messages outbox existants.

Les commandes métier autres que l’équipe, l’upload Storage, le devis de vente et la fiscalité n’étaient pas implémentés dans le backend initial. Leur liste dans le contrat frontend reste une cible métier, pas une certification de disponibilité. La livraison finalise Supabase Auth et les endpoints de raccordement demandés ; elle ne présente pas l’ensemble des fonctionnalités de démonstration comme un backend métier complet.

Le premier chargement en mode connecté omet le filtre boutique jusqu’à réception du UUID choisi par NestJS. Le changement d’entreprise utilise le même mécanisme ; le changement de compte ou de mode démo/connexion réinitialise le WorkspaceProvider. Ces comportements sont couverts par les tests.
