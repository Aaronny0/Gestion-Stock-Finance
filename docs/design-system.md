# VORTEX Design System — Phase 1

Ce socle est introduit progressivement afin de préserver le comportement métier du frontend V1.

## Principes

- Les composants React n'utilisent pas de couleurs hexadécimales directement.
- Les couleurs sont exprimées par rôle : `primary`, `success`, `warning`, `destructive`, `info`, `muted`, etc.
- `src/styles/tokens.css` est la source de vérité des tokens visuels.
- `src/styles/base.css` contient uniquement le socle global et la compatibilité temporaire avec la V1.
- `src/app/globals.css` conserve temporairement les styles legacy qui seront retirés progressivement, fonctionnalité par fonctionnalité.
- Les variantes de composants utilisent CVA lorsque cela apporte une vraie valeur.
- `cn()` combine `clsx` et `tailwind-merge`.
- Les montants et cellules numériques utilisent des chiffres tabulaires.
- Les contrôles principaux sont dimensionnés pour rester utilisables au tactile.
- Les animations respectent `prefers-reduced-motion`.

## Structure

```text
src/components/
  ui/             primitives génériques
  data-display/   tables, KPI, montants, états
  layout/         en-têtes et structure de page
  feedback/       notifications

src/styles/
  tokens.css
  base.css
```

## Composants disponibles

Primitives : `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `Badge`, `Card`, `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `DropdownMenu`, `Tabs`, `Tooltip`, `Skeleton`, `Table`, `SearchInput`.

Données : `DataTable`, `EmptyState`, `MetricCard`, `Money`, `StatusBadge`.

Layout / feedback : `PageHeader`, `Toaster`.

## Migration

Les anciens composants de `src/frontend/ui.tsx` restent en place tant qu'une page n'a pas été migrée et vérifiée. Il ne faut pas remplacer mécaniquement tous les composants en une seule modification. Chaque domaine réutilisera progressivement le nouveau socle en conservant ses handlers, données, permissions et appels API.

## Phase 4 — POS

Le POS est désormais découpé dans `src/features/pos/` autour des composants `ProductCard`, `ProductSearch`, `ProductFilters`, `Cart`, `CartItem`, `CustomerSelector`, `PaymentSelector`, `CheckoutPanel`, `CheckoutConfirmation`, `MobileCartDrawer` et `Receipt`.

La logique d'encaissement reste orchestrée par `src/frontend/pos.tsx` : calculs de remise et de paiement, contrôle du stock, IMEI, contrôle de vente sous coût, quote serveur et commande `sale.create` sont conservés. Le panier mobile utilise `Drawer` et le reçu utilise le `Dialog` commun avec des styles d'impression isolés dans `src/styles/print.css`.

Le modèle produit actuel ne fournit pas de champ image. `ProductCard` affiche donc un visuel neutre de produit sans inventer d'URL ou de média ; la structure pourra recevoir de vraies photos lorsque l'API les exposera.

## Phase 5 — Ventes + Stock

Les domaines Ventes et Stock sont désormais extraits de `src/frontend/pages.tsx` vers `src/features/sales/` et `src/features/stock/`. Les routes restent identiques et continuent d'utiliser `WorkspaceProvider`, les permissions existantes, `ActionForm` pour les commandes métier qui ne sont pas encore migrées et les mêmes appels `command(...)`.

Le nouveau `DataTable` est devenu le socle des listes métier : recherche globale, tri, pagination, sélection, colonnes masquables, export CSV/Excel, densité configurable et rendu mobile dédié. Les vues Ventes et Catalogue Stock utilisent une représentation mobile compacte au lieu de forcer un tableau horizontal.

La vente détail conserve le reçu, les paiements, les écritures comptables et la logique de retour. Le retour client a été migré vers `RefundDialog` sans changer `quoteReturn`, `returnedQuantity` ni la commande `sale.return`.

Le Stock conserve création produit, entrée, ajustement, transfert, archivage, import atomique CSV/XLSX et réapprovisionnement. L'import a été migré vers `StockImportDialog` en conservant les limites de 5 Mo / 2 000 lignes, le mapping de colonnes, la validation et la commande `stock.import`.

Les anciennes implémentations `src/frontend/workflows.tsx`, `src/frontend/returns.tsx` et `src/frontend/import-stock.tsx` ont été supprimées après vérification qu'elles n'étaient plus importées.

## Phase 6 — Finance + Comptabilité

Les écrans `Trésorerie & caisse`, `Dépenses` et `Paiements` sont désormais extraits de `src/frontend/pages.tsx` vers `src/features/finance/`. Ils utilisent `PageHeader`, `MetricCard`, `DateRangeFilter`, `DataTable`, `Money`, `StatusBadge` et des vues mobiles dédiées, tout en conservant les commandes métier existantes (`cash.open`, `cash.close`, `cash.movement`, `expense.create`, `expense.reverse`, `payment.create`).

La comptabilité a été déplacée de l'ancien `src/frontend/accounting-page.tsx` vers `src/features/accounting/`. Les calculs restent fournis par `src/frontend/accounting.ts` : `balance`, `validateEntry`, `ledger` et `trialBalance` n'ont pas été réécrits. Les journaux, le plan comptable, le grand livre, la balance et les périodes utilisent la variante `dense` du `DataTable`.

L'éditeur d'écriture est maintenant un composant dédié utilisant les primitives du Design System. Les contrôles de période ouverte, compte actif, débit/crédit exclusifs et égalité débit-crédit restent assurés par `validateEntry`. Les actions de publication, extourne, activation de compte et verrouillage de période restent branchées sur les mêmes commandes backend.

`src/frontend/pages.tsx` ne porte plus les implémentations Finance et Comptabilité. Les anciennes pages ne sont donc pas conservées en parallèle avec les nouvelles.

## Phase 7 — Administration

Les domaines Administration sont désormais séparés du routeur générique : `Équipe & rôles` vit dans `src/features/team/`, `Historique & audit` dans `src/features/audit/` et `Paramètres` dans `src/features/settings/`.

La gestion d'équipe utilise le `DataTable` commun et un formulaire dédié `TeamMemberDialog`. Les commandes `team.invite` et `team.update` conservent les mêmes payloads métier, y compris les boutiques autorisées et les permissions personnalisées. Les modèles `rolePermissions` restent des valeurs par défaut ; les permissions effectives sont toujours revalidées par le serveur.

L'audit utilise une table `dense`, des filtres de période et une vue mobile dédiée. La page est volontairement en lecture seule : aucune mutation d'audit n'a été introduite.

Les paramètres sont migrés vers le Design System avec des sections Entreprise, Boutiques, Vente, Stock, Comptabilité, Fiscalité et Sécurité. `settings.save`, `store.save` et le test `fiscal/test` restent inchangés côté métier. La création de boutique utilise désormais un dialogue dédié au lieu du `ActionForm` universel.

L'ancien `src/frontend/settings.tsx` a été supprimé après branchement du nouveau module. `src/frontend/pages.tsx` ne contient plus les implémentations Équipe et Audit.
