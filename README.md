# Vortex · Gestion Stock & Finance

Frontend Next.js / React / TypeScript pour le cahier de réalisation frontend.

## Démarrer

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

- Démonstration interactive : [http://localhost:3000/demo](http://localhost:3000/demo)
- Connexion réelle : [http://localhost:3000/login](http://localhost:3000/login)

La démonstration utilise uniquement des données fictives en mémoire. Le changement de rôle est dans le bandeau supérieur ; les boutiques sont dans l’en-tête. Recharger la page réinitialise les opérations de démonstration.

## Brancher le service métier

Configurer `FRONTEND_API_URL` côté serveur dans `.env.local` selon `.env.frontend.example`. Sans service configuré, les routes réelles affichent un état explicite. Aucune écriture Supabase n’est exécutée par les pages.

Contrats et règles : [docs/frontend-api.md](docs/frontend-api.md).
Couverture, scénarios et limites : [docs/frontend-recette.md](docs/frontend-recette.md).

## Vérifier

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start
```

Le moteur comptable local demandé est dans `src/frontend/accounting.ts`. Les simulations transactionnelles et données fictives sont dans `src/frontend/demo.ts`. Toutes les requêtes réelles passent par `src/frontend/api.ts` et le proxy serveur `src/app/api/v1/[...path]/route.ts`.

L’état initial du code est sauvegardé dans `docs/archives/frontend-avant-cahier.tar.gz`. Les anciens chemins français restent accessibles comme alias des écrans refondus.

## Améliorations UX

Le bilan du 17 septembre 2026, les choix de palette, les nouveaux parcours et les limites de raccordement sont détaillés dans [RAPPORT_AMELIORATIONS_UX.md](RAPPORT_AMELIORATIONS_UX.md).
