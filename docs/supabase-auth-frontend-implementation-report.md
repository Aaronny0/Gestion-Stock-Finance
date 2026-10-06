> État global actuel et limites backend : [audit final](final-project-audit.md). Les résultats de ce document concernent sa tranche/date, pas une certification du projet complet.

# Intégration Supabase Auth — frontend VORTEX

Date : 5 octobre 2026.

## Architecture finale

Supabase Auth → AuthProvider (identité/session) → client HTTP Bearer → proxy Next.js → NestJS → User VORTEX, memberships, permissions → WorkspaceProvider (snapshot métier).

WorkspaceProvider est conservé, tout comme les fonctionnalités métier et la démonstration. Supabase n’écrit aucune transaction métier. Les permissions du backend restent autoritaires.

Implémentation basée sur la [documentation SSR officielle Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client). Dépendances ajoutées avec pnpm : `@supabase/supabase-js ^2.117.2`, `@supabase/ssr ^0.12.7`. Aucun Better Auth/NextAuth.

## Configuration

Copier `.env.example` ou `.env.frontend.example` vers `.env.local` :

- `NEXT_PUBLIC_SUPABASE_URL` : URL du projet.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` : clé publique recommandée.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : fallback de transition seulement ; la clé publishable est prioritaire.
- `FRONTEND_API_URL` : URL NestJS, uniquement serveur.

Aucun secret réel ajouté/versionné. Ni service_role, ni clé secrète Supabase, ni Google Client Secret côté frontend. Les fichiers locaux existants n’ont pas été modifiés. La vérification de configuration locale a porté uniquement sur la présence des variables, sans afficher leurs valeurs : Supabase présent, `FRONTEND_API_URL` absent.

Configurer dans Supabase Auth l’URL du site et les URLs autorisées sur chaque environnement : `http://localhost:3000/auth/callback` (avec paramètres `next` autorisés), `/auth/confirm`, et leurs équivalents HTTPS de production. Google doit être activé ; sa configuration serveur existante n’a pas été modifiée.

Le flux PKCE standard utilise `emailRedirectTo` ou `redirectTo` vers `/auth/callback`. Il nécessite le navigateur qui a initié la demande. Pour confirmation/recovery depuis un autre navigateur, adapter les templates email pour pointer vers `/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/onboarding` et `/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`. Pour une invitation, conserver la destination locale `/invite/activate?token=...` via `next` (encodé). Le handler accepte uniquement les types email/signup/recovery et vérifie réellement l’OTP.

## AuthProvider et session

`useAuth()` expose `session`, `user`, `accessToken`, `loading`, `error`, `signOut`. Le client navigateur est singleton ; les clients SSR sont propres à chaque requête. L’état initial est chargé avec `getSession`, et les événements Supabase mettent à jour la session (connexion, refresh, logout, changement de compte). Le listener n’exécute aucun appel SDK asynchrone dans son callback.

Le SDK gère persistence/refresh et synchronisation d’identité. Aucun access token n’est enregistré manuellement dans localStorage. Le proxy Next.js appelle `getClaims` et propage les cookies renouvelés à la requête et à la réponse. L’absence de configuration affiche un état explicite sans casser `/demo`.

Le WorkspaceProvider est remonté avec une clé d’identité lors d’un changement de compte ou d’une déconnexion : snapshot, préférences en mémoire, drafts et clé de commande du compte précédent sont retirés. Les snapshots en vol sont annulés/ignorés après cleanup. Le logout appelle `supabase.auth.signOut`, retire le brouillon local d’onboarding et revient au login. Le menu/topbar existants continuent d’appeler le handler de déconnexion du shell.

## Parcours

### Login

Le formulaire existant appelle `signInWithPassword`, vérifie la présence d’une session puis charge `/session` avant navigation. Identifiants invalides, compte existant et email non confirmé ont des messages adaptés. Compte inexistant et mauvais mot de passe partagent le message d’identifiants incorrects. Les erreurs réseau restent génériques. Un visiteur déjà connecté à `/login` retrouve son parcours métier.

### Signup et onboarding

Les étapes visuelles entreprise/boutique sont conservées. `signUp` crée uniquement l’identité. Sans session (confirmation nécessaire), aucune création NestJS n’est lancée. Avec session, l’utilisateur rejoint `/onboarding`.

Le brouillon contient seulement nom, email, entreprise, pays, devise, fuseau, boutique, ville et clé d’idempotence. Il est enregistré dans sessionStorage aux transitions du formulaire et avant création d’identité ; jamais le mot de passe. Une copie est attachée aux métadonnées utilisateur lors du signup afin de reprendre les informations après confirmation dans un autre onglet/navigateur. Ces métadonnées restent modifiables par l’utilisateur et ne constituent aucune autorité métier.

La page onboarding vérifie d’abord `/session` : un utilisateur déjà initialisé va dans l’application ; un compte sans membership voit un état dédié ; une identité nécessitant l’onboarding peut créer son espace. `POST /onboarding` conserve `Idempotency-Key` lors d’un retry du même contenu, puis vérifie à nouveau `/session`. Le brouillon local est supprimé après réussite. L’idempotence durable et la reprise après une réponse incertaine reposent aussi sur l’unicité backend du Supabase `sub`. Les métadonnées résiduelles ne déclenchent jamais une nouvelle création quand `/session` existe.

### Google OAuth et callback

Bouton « Continuer avec Google » sur login/signup et invitation anonyme, désactivé pendant redirection. Appel réel `signInWithOAuth({provider:'google',options:{redirectTo}})`. Un brouillon signup local est conservé avant OAuth.

`/auth/callback` échange le code PKCE contre une session. Code absent, invalide ou erreur fournisseur reviennent avec un message sûr ; aucune erreur brute ou token affiché. Les destinations sont limitées à onboarding, reset et invitation avec token encodé. Une invitation en cours est conservée en cas d’erreur OAuth. Après OAuth, onboarding consulte `/session` pour diriger vers application, création métier ou absence de membership. Aucune requête workspace avant établissement de l’identité.

### Confirmation et forgot/reset password

Forgot password utilise `resetPasswordForEmail` et un callback recovery. La réponse est générique, sans preuve visuelle d’email vérifié. `/auth/confirm` appelle `verifyOtp` ; `/auth/callback` appelle `exchangeCodeForSession`.

`/reset-password` nécessite une session Supabase. Lien explicitement invalide ou absence de session affiche la demande d’un nouveau lien. Le mot de passe (minimum 10 caractères, confirmation identique) est transmis à `updateUser({password})`, puis la session est fermée. Une session authentifiée déjà valide peut également modifier son propre mot de passe ; un paramètre URL seul ne donne jamais ce droit. Les OTP/codes expirés ne créent pas de session. Le backend ne reçoit aucun mot de passe.

### Invitations

`/invite/activate` reste public et vérifie le token métier via `auth/invitation`. L’utilisateur connecté accepte via `auth/activate` avec Bearer et `{token}`. Un utilisateur anonyme peut se connecter, créer une identité puis confirmer, ou utiliser Google. L’invitation est conservée dans le redirect de confirmation/OAuth. Aucun password envoyé à l’activation métier. Invitation indisponible/expirée affiche un message explicite. Le backend doit vérifier que l’email Supabase correspond au destinataire et accepter idempotemment.

## API, proxy et protections

`src/frontend/api.ts` lit la session actuelle à chaque appel. Le Bearer suit le token renouvelé. Les headers additionnels, dont Idempotency-Key, sont conservés avec `Headers`. Le client refuse les URLs externes ; les PUT existants vers le stockage signé continuent d’utiliser leur fetch direct, sans Bearer VORTEX. Aucun token journalisé.

Le proxy transmet Authorization, Content-Type, Cookie et Idempotency-Key. Liste de routes, contrôle d’origine des mutations, limites de corps, redirects upstream interdits et no-cache sont conservés. `onboarding` est ajouté explicitement à la liste. Seuls les codes métier connus passent dans les erreurs publiques.

`/session` conserve User VORTEX, organization(s), stores, permissions et defaultStoreId ; `/workspace` conserve Snapshot. WorkspaceProvider attend l’identité, évite les appels anonymes et les appels sur routes publiques. Les droits sont encore rechargés au focus et toutes les 60 secondes. Les routes callback/confirm/reset/onboarding sont explicitement publiques ; callback et confirm sont de vrais handlers, indépendants du catch-all.

États traités : AUTH LOADING (chargement), UNAUTHENTICATED (login), AUTHENTICATED (contexte métier), ONBOARDING_REQUIRED (onboarding), NO_MEMBERSHIP (message dédié), FORBIDDEN (accès refusé), backend indisponible (erreur explicite/retry). Le shell garde les contrôles de permissions VORTEX existants.

## Dépendances backend obligatoires

Le contrat attendu est documenté dans `docs/frontend-api.md` :

1. Valider les JWT Supabase et résoudre le User VORTEX par `sub`, sans assimiler identité et membership.
2. `/session` et `/workspace` acceptent Bearer et conservent leurs structures métier.
3. Codes structurés `ONBOARDING_REQUIRED`, `NO_MEMBERSHIP`, `FORBIDDEN`. Ne pas utiliser 401 pour une identité valide nécessitant un onboarding.
4. `POST /onboarding` crée User, organization, store, membership dans une transaction NestJS, avec unicité `sub` et déduplication durable d’Idempotency-Key.
5. `auth/activate` valide le token métier avec l’identité Bearer ; ne reçoit plus de password. Vérifier email, expiration, membership et retries.
6. Cookies historiques relayés pendant transition ; anciens endpoints autorisés mais inutilisés par les nouveaux formulaires.

Ces endpoints ne sont pas implémentés dans ce dépôt frontend. Aucun faux succès ni mutation de démonstration n’est utilisé pour les remplacer.

## Tests et résultats

`tests/auth.test.cjs` teste les vrais modules transpilés et les handlers/formulaires avec SDK, réseau et hooks simulés. Cela valide le câblage frontend, sans contacter Supabase ni créer de compte.

Couverture automatisée : login avec session/identifiants invalides/email non confirmé ; signup avec ou sans confirmation ; séparation identité/métier et reprise idempotente sans password ; OAuth Google et redirect ; callback valide/manquant/invalide/erreur fournisseur ; anti-open-redirect ; confirmation signup/recovery OTP valide ou expiré ; forgot password ; updateUser réussi/refusé et logout ; session initiale/events refresh/changement de compte/cleanup ; Bearer renouvelé sur `/session` et `/workspace` ; proxy Bearer/cookie/idempotency/origine/allowlist ; erreurs onboarding/no membership/forbidden/503/401 ; invitations identité existante/nouvelle et activation expirée simulée. Les 24 tests comptables métier existants sont conservés.

| Validation | Résultat |
| --- | --- |
| `pnpm add @supabase/supabase-js @supabase/ssr` | Réussi |
| `pnpm install --frozen-lockfile` | Réussi |
| `pnpm typecheck` | Réussi |
| `pnpm lint` | Réussi, sans warning |
| `pnpm test` | 37 tests réussis |
| `pnpm build` | Réussi, routes auth explicites générées |
| `git diff --check` | Réussi |

Limites : pas de recette réelle Google, email envoyé, multi-onglets navigateur, backend JWT/membership ni onboarding transactionnel. `FRONTEND_API_URL` n’est pas configuré localement ; aucun compte de test fourni. Le scénario navigateur historique a été adapté pour vérifier la redirection login d’un visiteur anonyme. Playwright est absent des dépendances locales du projet. La suite navigateur complète n’a pas été lancée. La validation réelle des scénarios demandés nécessite le backend migré, les URLs/templates Supabase configurés et des comptes/invitations de test.

## Fichiers

Créés : `src/lib/supabase/{config,client,server,proxy,redirect}.ts`, `src/frontend/auth-provider.tsx`, `src/frontend/auth-flow.ts`, `src/app/auth/callback/route.ts`, `src/app/auth/confirm/route.ts`, `src/app/onboarding/page.tsx`, `src/app/reset-password/page.tsx`, `tests/auth.test.cjs`, ce rapport.

Modifiés : `package.json`, `pnpm-lock.yaml`, `.env.example`, `.env.frontend.example`, `README.md`, `docs/frontend-api.md`, `src/app/layout.tsx`, `src/proxy.ts`, `src/frontend/api.ts`, `src/frontend/auth-page.tsx`, `src/frontend/provider.tsx`, `src/frontend/shell.tsx`, `src/app/api/v1/[...path]/route.ts`, `tests/browser-smoke.cjs`.

Lus et conservés : types métier, navigation, user-menu/topbar, wrappers login/signup/forgot/invite. Les interfaces visuelles et fonctionnalités métier ont été préservées.
