# Vortex · Gestion Stock & Finance

Frontend Next.js / React / TypeScript pour le cahier de réalisation frontend.

**Application complète non prête pour la production : le backend n’implémente que les deux commandes équipe sur les trente attendues.** État vérifié et procédure : [audit final](docs/final-project-audit.md).

## Démarrer

```bash
pnpm install --frozen-lockfile
pnpm dev
```

- Démonstration interactive : [http://localhost:3000/demo](http://localhost:3000/demo)
- Connexion réelle : [http://localhost:3000/login](http://localhost:3000/login)

La démonstration utilise uniquement des données fictives en mémoire. Le changement de rôle est dans le bandeau supérieur ; les boutiques sont dans l’en-tête. Recharger la page réinitialise les opérations de démonstration.

## Brancher le service métier

Créer d’abord le fichier local d’environnement :

```bash
cp -n .env.example .env.local
```

Configurer côté serveur `FRONTEND_API_URL` (API métier, `…/api/v1/`) et `AUTH_API_URL` (backend NestJS qui héberge Better Auth, défaut `http://vortex-api:3001`) dans `.env.local`, ainsi que `APP_URL` (identique à `APP_URL` du backend). Aucun secret côté Next.js. Sans service configuré, les routes réelles affichent un état explicite. Les pages passent par l’API métier VORTEX.

L’authentification est assurée par Better Auth, hébergé dans `vortex-backend` sous `/api/auth/*`. Le navigateur ne parle qu’à son propre domaine : `src/app/api/auth/[...all]/route.ts` relaie vers le backend (cookies `vortex.*` transmis tels quels, `/api/auth/admin` et `/api/auth/email-otp/*` refusés). Le client est `src/lib/auth/client.ts` (`better-auth/react`).

Contrats et règles : [docs/frontend-api.md](docs/frontend-api.md).
Couverture, scénarios et limites : [docs/frontend-recette.md](docs/frontend-recette.md).

## Vérifier

Le lockfile est synchronisé et l’installation figée a été vérifiée. Utiliser `pnpm install --frozen-lockfile` en local et en CI.

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build

# Playwright/Chromium doivent être disponibles ; serveur QA lancé automatiquement :
pnpm test:browser:isolated

# Démarrage normal après configuration de production :
pnpm start
```

Les tests navigateur requièrent Playwright/Chromium disponibles dans l’environnement (`PLAYWRIGHT_MODULE` et `CHROME_PATH` si nécessaire). `pnpm test:browser:isolated` lance un serveur Next.js dédié ; les appels Better Auth y sont simulés dans le navigateur (aucun backend requis ; `QA_WITH_BACKEND=1` monte aussi PostgreSQL Docker + `vortex-backend` + un faux SMTP). `pnpm test:auth-e2e` déroule le parcours réel inscription → email → vérification → connexion → `/api/v1/access` à travers le relais (Docker, `../vortex-backend` compilé et `pnpm build` requis). Ne pas le lancer en même temps que `pnpm build`.

Les devDependencies sont nécessaires au build. SheetJS est livré depuis sa distribution officielle dans `vendor/xlsx-0.20.3.tgz` : conserver ce fichier avec le lockfile dans Git.

Le moteur comptable local demandé est dans `src/frontend/accounting.ts`. Les simulations transactionnelles et données fictives sont dans `src/frontend/demo.ts`. Toutes les requêtes réelles passent par `src/frontend/api.ts` et le proxy serveur `src/app/api/v1/[...path]/route.ts`.

Les anciens chemins français restent accessibles comme alias des écrans refondus. Les deux archives dans `docs/archives` sont historiques et ne sont pas exécutées. Les SQL du dossier `supabase` sont historiques (Supabase n’est plus utilisé) : suivre le guide du backend pour le nouveau schéma.

## Améliorations UX

Le bilan du 17 septembre 2026, les choix de palette, les nouveaux parcours et les limites de raccordement sont détaillés dans [RAPPORT_AMELIORATIONS_UX.md](RAPPORT_AMELIORATIONS_UX.md).

Le bilan de stabilisation, les corrections et les résultats de validation sont détaillés dans [docs/FINAL_STABILIZATION.md](docs/FINAL_STABILIZATION.md).

Intégration identité : Better Auth (voir ci-dessus). Les rapports `docs/supabase-*.md` sont historiques.

## Déploiement Dokploy

Utiliser `compose.yaml` et `.env.compose.example` de ce dépôt. La procédure complète est dans le dépôt voisin `vortex-backend/docs/dokploy-compose.md` : secrets, domaines, réseau commun, Better Auth et PostgreSQL standard, migration et sauvegardes. Ne pas ajouter `compose.local.yaml` sur le VPS.
