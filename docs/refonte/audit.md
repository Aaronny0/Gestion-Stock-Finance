# Refonte VORTEX — audit et périmètre initial (25 septembre 2026)

## État des lieux vérifié

- Next 16.1.6 / React 19.2.4, App Router. Les pages physiques françaises et le catch-all réexportent `frontend/pages.tsx`. `navigation.ts` centralise les alias, groupes métier et permissions. Pas de déplacement des routes dans cette phase.
- `layout.tsx` monte `FrontendShell`, puis `WorkspaceProvider`. État React/Context, préférences de listes en mémoire par organisation/rôle/boutique/emplacement ; garde de navigation et brouillons dans `history.ts`. Pas de store SWR actif.
- API réelle : `frontend/api.ts` → `/api/v1/[...path]` → `FRONTEND_API_URL`. Proxy avec liste de routes, contrôle Origin, cookies, timeout et clé d’idempotence. API et backend conservés. `/api/auth` conserve son statut de retrait 410.
- Auth active dans `auth-page.tsx`, session rafraîchie dans le provider. Permissions reçues du backend et contrôlées dans le shell et les actions. La démo reste explicitement séparée, en mémoire. Les garanties serveur ne peuvent pas être validées sans service métier raccordé.
- Changement de boutique/organisation : chargement du snapshot, effacement des données affichées pendant le changement réel, garde des brouillons. Pas de modification de ces comportements.
- `forms.tsx` : formulaire par configuration, étapes de revue, validations métier, commandes et upload. POS : recherche, stock, remises, crédit, paiements fractionnés, monnaie, vente à perte, devis serveur, reçu. Tous conservés.
- Dashboard/analytics : indicateurs calculés depuis le snapshot, graphiques Recharts chargés dynamiquement. Finance/comptabilité : unités mineures, équilibrage, périodes, écritures et extournes ; 24 tests existants.
- `ui.tsx` : table maison avec recherche, tri, pagination, sélection, exports CSV/Excel protégés par permission ; modales natives avec verrou de scroll. Migration métier différée.
- CSS : 3 489 lignes actives, styles et correctifs successifs. Tailwind 4 installé mais non importé dans globals. L’ancien `--muted` désigne du texte : il faut le convertir en `--muted-foreground` avant d’introduire le token de surface shadcn.
- Graphe statique analysé via TypeScript (imports, réexports, imports dynamiques), depuis toutes les entrées app et proxy, complété par recherche des références. Les 20 fichiers legacy ci-dessous sont inaccessibles. Aucune route active n’importe les clients Supabase historiques, ni les deux implémentations JWT avec secret fallback.

## Adaptations au plan fourni

`.gitignore`, `.env.frontend.example`, `public/manifest.webmanifest`, `public/sw.js` et les icônes existent déjà. Le SW ne cache que `/_next/static/`, pas les données métier. Conserver ces fichiers, harmoniser seulement la couleur du manifest. Les archives et sorties QA sont déjà ignorées et non suivies : conserver les preuves locales, ne pas les supprimer arbitrairement. Les deux SQL vides sont suivis et sans référence : suppression. La suppression de `package-lock.json` était déjà présente avant intervention : la respecter.

Le frontend conserve `xlsx` (export actif), Recharts et react-icons (migration Lucide progressive). Supprimer uniquement les dépendances sans consommateur restant. Garder la version package 0.1.0 et faire dériver l’étiquette du package, sans inventer une release 1.0.

## Phase 0 — fichiers exacts

Modifiés : `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `src/frontend/shell.tsx`, `public/manifest.webmanifest`, `README.md`.
Créé : ce document. `.env.frontend.example` reste l’unique exemple documenté, pas de copie redondante.
Supprimés :

- `src/components/Header.tsx`
- `src/components/AppShell.tsx`
- `src/components/LockScreen.tsx`
- `src/components/Toast.tsx`
- `src/components/Sidebar.tsx`
- `src/components/GlobalExportMenu.tsx`
- `src/components/ExportData.tsx`
- `src/components/charts/DashboardChart.tsx`
- `src/components/charts/FinanceRecettesChart.tsx`
- `src/components/charts/FinanceGainsChart.tsx`
- `src/components/ui/Skeleton.tsx`
- `src/hooks/useMarques.ts`
- `src/lib/auth.ts`
- `src/lib/supabase.ts`
- `src/lib/audit.ts`
- `src/lib/constants.ts`
- `src/lib/format.ts`
- `src/utils/supabase/client.ts`
- `src/utils/supabase/middleware.ts`
- `src/utils/supabase/server.ts`
- `src/app/globals_backup.css`
- `src/app/login/actions.ts`
- `backup.sql`
- `public_schema.sql`

Dépendances retirées : @supabase/ssr, @supabase/supabase-js, bcryptjs, cookies-next, date-fns, exceljs, file-saver, framer-motion, jose, jspdf, jspdf-autotable, swr, @types/bcryptjs, @types/file-saver. Outils de compilation déplacés en devDependencies. Vérifications avant et après phase : typecheck, lint, 24 tests métier, build.

## Phase 1 — fichiers prévus

Package et lockfile seront également actualisés. Liste du socle :

- `components.json`
- `src/app/globals.css`
- `src/styles/tokens.css`
- `src/styles/base.css`
- `src/styles/print.css`
- `src/styles/legacy/controls.css`
- `src/styles/legacy/shell.css`
- `src/styles/legacy/dashboard.css`
- `src/styles/legacy/data.css`
- `src/styles/legacy/forms.css`
- `src/styles/legacy/pos.css`
- `src/styles/legacy/auth.css`
- `src/styles/legacy/responsive.css`
- `src/styles/legacy/refinements.css`
- `src/styles/legacy/navigation.css`
- `src/lib/utils.ts`
- `src/components/charts/colors.ts`
- `src/frontend/charts.tsx`
- `src/frontend/ui.tsx`
- `src/components/data-display/money.tsx`
- `src/components/data-display/metric-card.tsx`
- `src/components/data-display/status-badge.tsx`
- `src/components/data-display/data-table.tsx`
- `src/components/feedback/empty-state.tsx`
- `src/components/feedback/loading-state.tsx`
- `src/components/feedback/error-state.tsx`
- `src/components/layout/page-header.tsx`
- `src/components/ui/icon-button.tsx`
- `src/components/ui/search-input.tsx`
- `src/components/ui/filter-bar.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/switch.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/drawer.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/tooltip.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/breadcrumb.tsx`
- `src/components/ui/pagination.tsx`
- `src/components/ui/sonner.tsx`
- `src/components/ui/form.tsx`

Compléments : `docs/refonte/design-system.md`, catalogue de composants et test navigateur du socle (chemins précisés dans le bilan). Les dépendances RHF/Zod, TanStack et Sonner accompagnent des composants réellement fournis ; pas de réécriture des formulaires existants.

## Stratégie CSS et limites

Les règles existantes seront extraites par responsabilité en conservant l’ordre de cascade, les médias historiques et les règles d’impression. Ce découpage est une couche transitoire documentée, pas la refonte des écrans : les nouvelles primitives utilisent Tailwind/CVA, les sélecteurs legacy disparaîtront lors des phases 2–7. Pas de nouveau monolithe. Preflight global différé pour préserver l’existant ; les nouvelles primitives ont une base normalisée ciblée. Référence : https://tailwindcss.com/docs/preflight et https://ui.shadcn.com/docs/installation/manual.

## Vérification initiale

TypeScript, lint, 24/24 tests métier et build Next réussis. Tests navigateur et limites détaillés dans le bilan final. Les parcours réels restent dépendants d’un backend externe ; ne pas confondre validation démo et validation de production.
