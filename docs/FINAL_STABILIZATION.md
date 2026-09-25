# VORTEX — Stabilisation finale

## Nettoyages effectués

- Suppression des branches mortes de `ActionForm` déjà remplacées par les nouvelles features (`team.invite`, `team.update`, `store.save`, ancien `sale.refund`).
- Suppression des exports UI legacy non utilisés (`PermissionGate`, `ConfirmDialog`).
- Migration des derniers usages `react-icons` vers `lucide-react`, puis retrait de `react-icons` de `package.json`.
- Nettoyage de 1 626 lignes de CSS legacy devenues mortes après les Phases 2 à 7 (`globals.css` : 3 346 -> 1 720 lignes).
- Conservation volontaire des styles encore actifs pour Auth, Analytics, Troc, Rachat, Achats, Fournisseurs, Clients et les formulaires métier non encore migrés.
- Rebaselining des tests navigateur vers des sélecteurs stables `data-qa`/ARIA adaptés au nouveau shell et aux nouvelles features.
- Amélioration du `DataTable` : tri mobile accessible, état de vue persistant, ouverture clavier des lignes, identifiants stables pour la QA.
- Élargissement du lint à tout `src/` et ajout du script `test:browser`.

## Contrôles réalisés dans l'environnement de refonte

- 118 fichiers TypeScript/TSX analysés : 0 erreur de parsing.
- Imports locaux : 0 import manquant.
- Fichiers de tests `.cjs` : syntaxe valide.
- CSS (`globals.css`, `tokens.css`, `base.css`, `print.css`) : 0 erreur de parsing.
- Tests métier : 24/24 réussis.
- `react-icons` : aucune référence restante dans `src/` ou `package.json`.

## Lockfile

`pnpm-lock.yaml` est antérieur à l'ensemble des dépendances ajoutées pendant la refonte. Il n'a pas été reconstruit manuellement afin de ne pas inventer de résolutions de paquets.

La première installation finale doit donc être :

```bash
pnpm install
```

Cette commande doit régénérer/synchroniser `pnpm-lock.yaml`. Une fois le fichier vérifié et versionné, la CI peut utiliser `pnpm install --frozen-lockfile`.

## Validation finale à exécuter sur la machine de développement

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start
```

Puis, dans un second terminal une fois VORTEX démarré :

```bash
pnpm test:browser
```

Les tests navigateur nécessitent Playwright/Chromium disponibles dans l'environnement.

## Dette volontaire restante

Les fichiers suivants restent actifs et ne doivent pas être supprimés comme « legacy » sans une phase de migration dédiée :

- `src/frontend/auth-page.tsx`
- `src/frontend/analytics.tsx`
- `src/frontend/forms.tsx`
- `src/frontend/ui.tsx`
- `src/frontend/pages.tsx` (Troc, Rachat, Achats, Fournisseurs, Clients)

Ils expliquent pourquoi `globals.css` n'est pas encore minimal. Leur suppression ou migration relève d'une phase ultérieure, pas d'un nettoyage aveugle.
