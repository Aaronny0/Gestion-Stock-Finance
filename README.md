# Vortex · Gestion Stock & Finance

Frontend Next.js / React / TypeScript pour le cahier de réalisation frontend.

## Démarrer

```bash
pnpm install
pnpm dev
```

- Démonstration interactive : [http://localhost:3000/demo](http://localhost:3000/demo)
- Connexion réelle : [http://localhost:3000/login](http://localhost:3000/login)

La démonstration utilise uniquement des données fictives en mémoire. Le changement de rôle est dans le bandeau supérieur ; les boutiques sont dans l’en-tête. Recharger la page réinitialise les opérations de démonstration.

## Brancher le service métier

Créer d’abord le fichier local d’environnement :

```bash
cp .env.example .env.local
```

Puis configurer `FRONTEND_API_URL` côté serveur dans `.env.local`. Sans service configuré, les routes réelles affichent un état explicite. Les pages passent par l’API métier VORTEX et n’écrivent pas directement dans Supabase.

Contrats et règles : [docs/frontend-api.md](docs/frontend-api.md).
Couverture, scénarios et limites : [docs/frontend-recette.md](docs/frontend-recette.md).

## Vérifier

Après cette refonte, exécuter d’abord `pnpm install` afin de régénérer `pnpm-lock.yaml` à partir du `package.json` actuel. Une fois le lockfile synchronisé et versionné, les installations CI peuvent revenir à `pnpm install --frozen-lockfile`.

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start

# Dans un second terminal, une fois l’application démarrée :
pnpm test:browser
```

Les tests navigateur requièrent Playwright/Chromium disponibles dans l’environnement.

Le moteur comptable local demandé est dans `src/frontend/accounting.ts`. Les simulations transactionnelles et données fictives sont dans `src/frontend/demo.ts`. Toutes les requêtes réelles passent par `src/frontend/api.ts` et le proxy serveur `src/app/api/v1/[...path]/route.ts`.

Les anciens chemins français restent accessibles comme alias des écrans refondus. Les archives de sauvegarde locales obsolètes ont été retirées du dépôt pendant le nettoyage de la Phase 0.

## Améliorations UX

Le bilan du 17 septembre 2026, les choix de palette, les nouveaux parcours et les limites de raccordement sont détaillés dans [RAPPORT_AMELIORATIONS_UX.md](RAPPORT_AMELIORATIONS_UX.md).
