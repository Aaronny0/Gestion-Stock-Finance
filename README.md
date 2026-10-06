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

Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (clé publique), puis configurer `FRONTEND_API_URL` côté serveur dans `.env.local`. Sans service configuré, les routes réelles affichent un état explicite. Les pages passent par l’API métier VORTEX et n’écrivent pas directement dans Supabase.

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

Les tests navigateur requièrent Playwright/Chromium disponibles dans l’environnement (`PLAYWRIGHT_MODULE` et `CHROME_PATH` si nécessaire). `pnpm test:browser:isolated` lance un serveur Next.js dédié et une Auth simulée locale ; aucune requête à votre projet Supabase. Ne pas le lancer en même temps que `pnpm build`.

Les devDependencies sont nécessaires au build. SheetJS est livré depuis sa distribution officielle dans `vendor/xlsx-0.20.3.tgz` : conserver ce fichier avec le lockfile dans Git.

Le moteur comptable local demandé est dans `src/frontend/accounting.ts`. Les simulations transactionnelles et données fictives sont dans `src/frontend/demo.ts`. Toutes les requêtes réelles passent par `src/frontend/api.ts` et le proxy serveur `src/app/api/v1/[...path]/route.ts`.

Les anciens chemins français restent accessibles comme alias des écrans refondus. Les deux archives dans `docs/archives` sont historiques et ne sont pas exécutées. Les SQL du dossier `supabase` sont également historiques : suivre le guide du backend pour le nouveau schéma.

## Améliorations UX

Le bilan du 17 septembre 2026, les choix de palette, les nouveaux parcours et les limites de raccordement sont détaillés dans [RAPPORT_AMELIORATIONS_UX.md](RAPPORT_AMELIORATIONS_UX.md).

Le bilan de stabilisation, les corrections et les résultats de validation sont détaillés dans [docs/FINAL_STABILIZATION.md](docs/FINAL_STABILIZATION.md).

Intégration identité et configuration des redirects : [rapport Supabase Auth](docs/supabase-auth-frontend-implementation-report.md).
