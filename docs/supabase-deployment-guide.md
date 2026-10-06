# Déployer l’architecture Supabase Auth / VORTEX

6 octobre 2026. Aucun déploiement distant n’a été exécuté pendant le développement.

Les dépôts sont `vortex-frontend` (Next.js 16) et `vortex-backend` (NestJS 12 / Prisma 7). Les commandes ci-dessous utilisent les dossiers du workspace actuel ; sur le serveur, adapter uniquement le dossier de checkout. Exécuter les migrations une seule fois par livraison, avec le compte administrateur ; le processus NestJS utilise un LOGIN séparé.

**Ce guide couvre la livraison métier complète : 30 commandes, Storage privé et fiscalité facultative. Lire [l’audit final](final-project-audit.md) pour les preuves locales et la recette distante restant à votre charge.**

## 1. URLs et accès PostgreSQL

Dans Supabase, ouvrir **Connect** et copier la connexion directe, ou la connexion **Session pooler, port 5432** lorsque le serveur n’a pas IPv6. Le pool transactionnel port 6543 n’est pas la cible des migrations de ce guide. Encoder les caractères réservés du mot de passe dans l’URI. Garder TLS activé.

[Connexions PostgreSQL Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres) et [Prisma avec Supabase](https://supabase.com/docs/guides/database/prisma).

Avant de servir l’application, désactiver l’exposition des tables VORTEX dans la Data API ou retirer `public` des schémas exposés si aucune autre application du projet n’en dépend. Ne jamais ajouter `vortex_security` aux schémas exposés. Le script SQL ci-dessous révoque aussi les grants API et active RLS sur chaque table VORTEX.

Pour une base Supabase neuve destinée à VORTEX :

```bash
cd /home/aaron/Documents/VORTEX/vortex-backend
pnpm install --frozen-lockfile --prod=false
read -rs -p 'URL PostgreSQL administrateur Supabase : ' VORTEX_MIGRATION_URL
printf '\n'
export DIRECT_DATABASE_URL="$VORTEX_MIGRATION_URL"
# Nécessaire au chargement Prisma ; sera remplacée par l’URL runtime ensuite.
export DATABASE_URL="$DIRECT_DATABASE_URL"
pnpm db:validate
pnpm db:deploy
pnpm db:status
psql "$DIRECT_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f database/security/007_supabase_backend.sql
psql "$DIRECT_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f database/security/008_supabase_runtime_role.sql
psql "$DIRECT_DATABASE_URL" -X -c '\password vortex_runtime'
```

`db:deploy` applique les dix migrations conservées, dont `20261005010000_supabase_onboarding` et `20261005010100_team_invitation_resend`. Aucun `migrate reset`, `db push --accept-data-loss` ou `migrate dev` en production. Pour une base existante, vérifier sauvegarde et historique avec `db:status` avant `db:deploy` ; ne pas remplacer des tables déjà utilisées. Ces commandes déploient le schéma, pas une copie automatique des données locales. Une reprise de données existantes doit conserver leurs UUID et leur historique de migrations.

Le rôle `vortex_runtime` est LOGIN/INHERIT, sans SUPERUSER, BYPASSRLS, CREATEDB ou CREATEROLE ; il hérite de `vortex_backend`. Il est exclusivement remis au serveur NestJS. La connexion directe runtime ressemble à :

```dotenv
DATABASE_URL=postgresql://vortex_runtime:MOT_DE_PASSE_ENCODE@db.PROJECT_REF.supabase.co:5432/postgres?schema=public&sslmode=require
```

Avec le Session pooler, utiliser le nom d’utilisateur `vortex_runtime.PROJECT_REF` et l’hôte régional copiés depuis Connect. `AUTH_DATABASE_URL` et `WORKER_DATABASE_URL` peuvent rester vides : les trois pools utilisent ce même rôle serveur privé. Les autorisations par utilisateur/entreprise/boutique sont contrôlées par NestJS dans ses transactions.

La RLS du script `007` isole la Data API : seules les connexions serveur privées ont une policy. Elle n’est pas la stratégie historique de contexte `SET LOCAL ROLE vortex_app`. Conserver `RLS_ENABLED=false`, ce flag désigne cette autre stratégie. **Ne pas lancer `install-supabase.psql` pour cette livraison** : il concerne les anciens pools séparés et Storage direct, dont le runtime de production n’active pas la configuration. Les scripts historiques restent testés dans un cluster jetable.

Après toute future migration créant une table VORTEX, mettre à jour son classement dans `007`, puis rejouer `007_supabase_backend.sql`. Les rôles `anon`, `authenticated` et `service_role` ne doivent avoir aucun grant métier, même de colonne. `IdentityLink` et `OnboardingReceipt` ont FORCE RLS et des grants privés. `User.id` reste un UUID VORTEX ; aucune FK ni trigger ne réécrit cet identifiant depuis `auth.users`.

## 2. Variables backend et démarrage

Créer `.env` depuis `.env.supabase.example`, ou définir les mêmes variables dans l’hébergeur. Ne pas versionner les valeurs privées.

```dotenv
NODE_ENV=production
HOST=0.0.0.0
PORT=3001
DATABASE_URL=URL_RUNTIME_PRIVEE
AUTH_DATABASE_URL=
WORKER_DATABASE_URL=
AUTH_PROVIDER=supabase
AUTH_ENABLED=false
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=CLE_PUBLIQUE_SUPABASE
APP_URL=https://app.example.com
ALLOWED_ORIGINS=https://app.example.com
AUTH_PUBLIC_URL=https://app.example.com
AUTH_COOKIE_SECURE=true
AUTH_SECRET=SECRET_OUTBOX_EXISTANT_OU_NOUVEAU_SECRET_DE_32_CARACTERES_MINIMUM
AUTH_INVITATION_TTL_SECONDS=259200
RLS_ENABLED=false
SMTP_HOST=SERVEUR_SMTP
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=UTILISATEUR_SMTP
SMTP_PASSWORD=SECRET_SMTP
MAIL_FROM=Vortex <noreply@example.com>
OBSERVE_ENABLED=false
FILE_STORAGE=supabase
API_PUBLIC_URL=https://api.example.com
SUPABASE_STORAGE_BUCKET=vortex-documents
SUPABASE_SERVICE_ROLE_KEY=CLE_STORAGE_PRIVEE
FISCAL_CONFIG_JSON={}
FISCAL_WORKER_ENABLED=true
```

L’identité backend ne nécessite aucun Google Client Secret ni secret JWT Supabase. Le Storage privé nécessite la clé `SUPABASE_SERVICE_ROLE_KEY`, réservée au backend, comme indiqué dans la section Storage. La clé publishable (ou `SUPABASE_ANON_KEY` en fallback) sert aux requêtes Auth `/user`. ES256/RS256 sont vérifiés avec JWKS ; HS256 est vérifié par Supabase Auth. Les nouvelles créations métier et acceptations d’invitation exigent un email confirmé et refusent les utilisateurs anonymes.

Conserver **exactement** l’ancien `AUTH_SECRET` si l’outbox contient des messages chiffrés. Il sert maintenant à l’outbox v1 ; son remplacement rend ces messages illisibles. Pour une installation neuve sans messages existants, générer une valeur privée avec `openssl rand -base64 48`. Le worker démarre lorsque ce secret est présent, même avec `AUTH_ENABLED=false`. Configurer SMTP pour les invitations VORTEX ; les emails de confirmation/reset relèvent de Supabase Auth et de son SMTP.

Build, puis démarrage sur le serveur choisi :

```bash
cd /home/aaron/Documents/VORTEX/vortex-backend
pnpm install --frozen-lockfile --prod=false
pnpm typecheck
pnpm lint
pnpm test
pnpm build
# Éviter que le processus hérite de la connexion administrateur utilisée plus haut.
unset DIRECT_DATABASE_URL VORTEX_MIGRATION_URL DATABASE_URL
# .env contient maintenant DATABASE_URL runtime ; sinon définir la variable via l’hébergeur.
pnpm start:prod
```

Le point d’entrée est `dist/main.js`. Configurer le service/process manager ou le conteneur pour relancer ce processus, et l’accès HTTPS `https://api.example.com` avec certificat valide. Ne pas exposer directement PostgreSQL aux navigateurs.

Depuis un autre terminal :

```bash
curl --fail --silent --show-error https://api.example.com/api/v1/health/live
curl --fail --silent --show-error https://api.example.com/api/v1/health/ready
```

Ces contrôles vérifient processus et PostgreSQL ; ils ne remplacent pas les tests utilisateur.

## 3. Supabase Auth, Google et emails

Dans **Authentication / URL Configuration**, définir Site URL `https://app.example.com`. Autoriser les URLs de retour de production et des environnements conservés :

- `https://app.example.com/auth/callback` et les variantes `next` nécessaires (`/onboarding`, `/reset-password`, `/invite/activate?token=...`). Le pattern de redirect autorisé peut couvrir `/auth/callback**` sur le domaine HTTPS exact.
- `https://app.example.com/auth/confirm`.
- En développement seulement : équivalents sur `http://localhost:3000`.

Activer Email et la confirmation email. Configurer le fournisseur Google dans Supabase avec les credentials Google côté Supabase. Dans Google Cloud, l’URI OAuth autorisée est **`https://PROJECT_REF.supabase.co/auth/v1/callback`**, ou le callback exact affiché par Supabase si un domaine Auth personnalisé est utilisé. Ne pas ajouter de callback NestJS.

Flux : frontend → Supabase → Google → Supabase → `/auth/callback` (échange PKCE) → `/session` VORTEX.

[Google avec Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google), [Auth SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [JWT](https://supabase.com/docs/guides/auth/jwts).

Les templates basés sur `{{ .ConfirmationURL }}` conservent le redirect fourni par le frontend et nécessitent le navigateur PKCE d’origine. Pour autoriser la confirmation dans un autre navigateur, utiliser un lien `/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=...`. Pour reset : `type=recovery&next=/reset-password`. Pour les invitations VORTEX, préserver la destination `/invite/activate?token=...` fournie dans `RedirectTo`, sans exposer une destination externe. Le backend envoie les liens d’invitation sur `/invite/activate`, pas sur l’ancien `/activation`.

Exemple de template confirmation conservant le `next` fourni et l’origine de production fixe :

```html
<a href="https://app.example.com/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next={{ .RedirectTo }}">Confirmer mon email</a>
```

Le handler supporte la valeur `RedirectTo` complète uniquement lorsqu’elle est un callback du même domaine, puis en extrait une destination locale autorisée. Ne jamais utiliser un domaine reçu des métadonnées.

Exemple reset :

```html
<a href="https://app.example.com/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Réinitialiser mon mot de passe</a>
```

## 4. Connecter le frontend déjà en ligne

Dans les variables de l’hébergeur du frontend :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=CLE_PUBLIQUE_SUPABASE
FRONTEND_API_URL=https://api.example.com/api/v1/
```

`FRONTEND_API_URL` contient impérativement `/api/v1/` ; elle reste côté serveur. Ne mettre aucune clé service_role/secrète/Google dans `NEXT_PUBLIC_*`. Publier le code frontend de cette livraison pour bénéficier de la transmission d’`Origin`, de la nouvelle allowlist et des corrections de contrat ; redémarrer/redéployer après configuration. Si l’hébergement est géré via sa console, renseigner ces trois variables puis utiliser sa commande de redéploiement. Pour un serveur Next.js auto-hébergé :

```bash
cd /home/aaron/Documents/VORTEX/vortex-frontend
pnpm install --frozen-lockfile --prod=false
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start
```

L’hébergeur frontend existant n’a pas été identifié ni modifié ; aucune commande propriétaire de déploiement n’est inventée.

## 5. Recette réelle après déploiement

1. Signup email → confirmer → onboarding → entreprise, boutique et propriétaire. Recharger et réessayer : mêmes UUID, aucun doublon.
2. Login email/password → session et workspace ; mot de passe erroné et email non confirmé refusés.
3. Forgot/reset depuis email → `/auth/callback` ou `/auth/confirm` → `/reset-password` → nouveau password dans Supabase → logout → login.
4. Google pour une identité nouvelle puis existante : callback frontend, onboarding uniquement si nécessaire, aucune création OAuth backend.
5. Invitation équipe via NestJS/SMTP → login/signup/Google Supabase → acceptation sans password backend ; mauvais destinataire et invitation expirée refusés, retry accepté.
6. Logout puis changement de compte : aucun snapshot ou brouillon métier du compte précédent ; revoir aussi deux onglets.
7. Membership suspendu → `NO_MEMBERSHIP` ; entreprise/boutique étrangère → `FORBIDDEN` ; identité nouvelle → `ONBOARDING_REQUIRED`. JWT invalide/expiré → 401.

Ces tests email/Google et les URLs réelles ne peuvent pas être certifiés par des mocks. Les tests de développement utilisent des JWT réellement signés, le handler proxy Next.js, NestJS et PostgreSQL isolé, avec Supabase Auth simulé.

## Données historiques et Storage

Un utilisateur VORTEX historique n’est jamais associé par son email seul. Si son email existe déjà sans IdentityLink, l’onboarding retourne 409. Une reprise de compte requiert une association administrative **explicite et vérifiée** `(issuer Supabase, sub, User.id VORTEX existant)` pendant la migration des données. Les UUID et memberships historiques restent conservés. Aucun rapprochement automatique ni import de mots de passe n’est effectué.

Storage est désormais utilisé pour les justificatifs d’achats et de dépenses. Dans Supabase Storage, créer **vortex-documents**, privé, avec une limite de **10 MiB** et les types `application/pdf`, `image/jpeg`, `image/png`. Appliquer ensuite `database/security/009_signed_storage.sql` via le SQL Editor. Ce script est réexécutable et ferme les accès directs anon/authenticated à ce bucket ; les liens d’upload/download sont délivrés par NestJS.

Renseigner côté backend uniquement :

```dotenv
FILE_STORAGE=supabase
API_PUBLIC_URL=https://api.example.com
SUPABASE_STORAGE_BUCKET=vortex-documents
SUPABASE_SERVICE_ROLE_KEY=REPLACE_ME
FISCAL_CONFIG_JSON={}
FISCAL_WORKER_ENABLED=true
```

La clé de service reste exclusivement dans le gestionnaire de secrets backend et ne possède aucun grant métier après SQL 007. Elle sert aux endpoints Storage. `AUTH_PROVIDER=supabase`, `AUTH_ENABLED=false`, `RLS_ENABLED=false` sont maintenus. Ne pas installer les anciens scripts 003/004 de Storage direct pour ce runtime.

## Fiscalité facultative e-MECeF

Si l’entreprise utilise e-MECeF (Bénin/XOF), récupérer son UUID dans la session VORTEX, puis renseigner `FISCAL_CONFIG_JSON` avec la configuration de son compte fiscal :

```json
{"UUID_ENTREPRISE":{"ifu":"IFU_13_CHIFFRES","token":"TOKEN_PRIVE","url":"https://developper.impots.bj/sygmef-emcf","taxGroup":"GROUPE_DE_VOTRE_COMPTE","taxRate":0}}
```

Ce JSON est un **gabarit**, pas une configuration à copier telle quelle : l’IFU, le groupe A–F et le taux doivent correspondre au compte réel. Utiliser d’abord le compte sandbox. Redémarrer le backend, utiliser Paramètres → Fiscalité → Tester la connexion, puis activer et sauvegarder. Effectuer une vente, attendre l’émission fiscale et tester un retour/avoir. Vérifier les montants, le groupe/taux, le code DGI et le QR. Passer à `https://sygmef.impots.bj/emcf` et aux identifiants de production seulement après validation du compte et des exigences du fournisseur. Si la fiscalité n’est pas utilisée, conserver `{}` et l’option désactivée.

## Recette finale de la livraison métier

Créer un espace réel via Supabase Auth ; vérifier le compte, la session VORTEX et les permissions. Dans une boutique de recette : ouvrir la caisse, créer un produit, entrer du stock, faire une vente, un retour, un achat et une dépense avec justificatif, régler une créance/dette, puis clôturer la caisse. Vérifier les écritures comptables, le solde du stock, les reçus, les permissions d’un caissier et l’accès au justificatif. Tester un rechargement et une double soumission (idempotence). Vérifier les emails Supabase et les invitations SMTP backend séparément. Contrôler les logs expurgés et les sauvegardes de la plateforme.
