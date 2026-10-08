# Correspondance avec le code réel

Inventaire lu le8 octobre2026. Les chemins ci-dessous sont relatifs à la racine frontend et liés ; ils décrivent l’implémentation actuelle, pas une assertion de fidélité intégrale. Les sources originales sont dans [references](references/README.md).

| Responsabilité | Fichier actuel | Observation |
| --- | --- | --- |
| Tokens globaux | [src/styles/tokens.css](../../src/styles/tokens.css) | Indigo/DM Sans ; pas le handoff pétrole |
| Cascade | [src/app/globals.css](../../src/app/globals.css) | Tailwind, tokens/base, legacy puis product ; lire aussi print |
| Socle | [src/styles/base.css](../../src/styles/base.css) | Font14, headings, focus, reduced-motion |
| Surcharges produit | [src/styles/product.css](../../src/styles/product.css) | Rail sombre local ; overrides métier |
| Shell | [src/frontend/shell.tsx](../../src/frontend/shell.tsx) | Auth/WorkspaceProvider, contexte, guards |
| Permissions et rôles | [src/frontend/types.ts](../../src/frontend/types.ts) | rolePermissions ; serveur autorité effective |
| Navigation | [src/frontend/navigation.ts](../../src/frontend/navigation.ts) | Sections, routePermission, aliases, canonical |
| Accès/approbation | [src/lib/access-policy.ts](../../src/lib/access-policy.ts) | Décision accès préservée |
| Charts | [src/frontend/charts.tsx](../../src/frontend/charts.tsx) | RevenueChart AreaChart actuellement ; source cible histogramme |
| Chart mapping | [src/lib/chart-colors.ts](../../src/lib/chart-colors.ts) | primary/success/warning/neutral/info = chart1..5 historiques |
| Provider DS | [src/providers/design-system-provider.tsx](../../src/providers/design-system-provider.tsx) | TooltipProvider + Toaster, pas un fournisseur de thème |
| Auth UI | [src/frontend/auth-page.tsx](../../src/frontend/auth-page.tsx) | Six routes / signup quatre étapes, SDK/API réels |
| Auth layout | [src/frontend/auth-shell.tsx](../../src/frontend/auth-shell.tsx) | Illustration/identité/footer |
| Auth champs | [src/frontend/auth-fields.tsx](../../src/frontend/auth-fields.tsx) | AuthField, AuthNotice, password |
| Auth CSS | [src/frontend/auth-design.module.css](../../src/frontend/auth-design.module.css) | Polices Vortex Auth locales, primaire057176, light isolé |
| Auth métier | [src/frontend/auth-flow.ts](../../src/frontend/auth-flow.ts) | Draft sans secret, businessDestination, authError |
| UI historique | [src/frontend/ui.tsx](../../src/frontend/ui.tsx) | Consommateurs V1 encore présents |
| Pages métiers | [src/frontend/pages.tsx](../../src/frontend/pages.tsx) | À lire avec dashboard, pos, analytics, accounting-page, settings |
| Audit auth | [docs/auth-design-implementation.md](../auth-design-implementation.md) | Tests et limites d’intégration |

## Primitives et composants disponibles

| Chemin existant | Déclarations identifiées |
| --- | --- |
| [src/components/ui/alert-dialog.tsx](../../src/components/ui/alert-dialog.tsx) | AlertDialog, AlertDialogTrigger, AlertDialogPortal, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel |
| [src/components/ui/badge.tsx](../../src/components/ui/badge.tsx) | Badge |
| [src/components/ui/breadcrumb.tsx](../../src/components/ui/breadcrumb.tsx) | Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, Comp, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis |
| [src/components/ui/button.tsx](../../src/components/ui/button.tsx) | Button, Comp |
| [src/components/ui/card.tsx](../../src/components/ui/card.tsx) | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| [src/components/ui/checkbox.tsx](../../src/components/ui/checkbox.tsx) | Checkbox |
| [src/components/ui/dialog.tsx](../../src/components/ui/dialog.tsx) | Dialog, DialogTrigger, DialogClose, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription |
| [src/components/ui/drawer.tsx](../../src/components/ui/drawer.tsx) | Drawer, DrawerTrigger, DrawerPortal, DrawerClose, DrawerOverlay, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription |
| [src/components/ui/dropdown-menu.tsx](../../src/components/ui/dropdown-menu.tsx) | DropdownMenu, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuRadioGroup, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSubTrigger, DropdownMenuSubContent |
| [src/components/ui/form.tsx](../../src/components/ui/form.tsx) | Form, FormFieldContext, FormField, FormItemContext, FormItem, FormLabel, FormControl, FormDescription, FormMessage |
| [src/components/ui/input.tsx](../../src/components/ui/input.tsx) | Input |
| [src/components/ui/label.tsx](../../src/components/ui/label.tsx) | Label |
| [src/components/ui/pagination.tsx](../../src/components/ui/pagination.tsx) | Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis |
| [src/components/ui/popover.tsx](../../src/components/ui/popover.tsx) | Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverHeader, PopoverTitle, PopoverDescription |
| [src/components/ui/search-input.tsx](../../src/components/ui/search-input.tsx) | SearchInput |
| [src/components/ui/select.tsx](../../src/components/ui/select.tsx) | Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem, SelectLabel, SelectSeparator |
| [src/components/ui/sheet.tsx](../../src/components/ui/sheet.tsx) | Sheet, SheetTrigger, SheetClose, SheetPortal, SheetOverlay, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription |
| [src/components/ui/skeleton.tsx](../../src/components/ui/skeleton.tsx) | Skeleton |
| [src/components/ui/sonner.tsx](../../src/components/ui/sonner.tsx) | Toaster |
| [src/components/ui/switch.tsx](../../src/components/ui/switch.tsx) | Switch |
| [src/components/ui/table.tsx](../../src/components/ui/table.tsx) | Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption |
| [src/components/ui/tabs.tsx](../../src/components/ui/tabs.tsx) | Tabs, TabsList, TabsTrigger, TabsContent |
| [src/components/ui/textarea.tsx](../../src/components/ui/textarea.tsx) | Textarea |
| [src/components/ui/tooltip.tsx](../../src/components/ui/tooltip.tsx) | TooltipProvider, Tooltip, TooltipTrigger, TooltipContent |
| [src/components/data-display/data-table.tsx](../../src/components/data-display/data-table.tsx) | DataTable, XLSX |
| [src/components/data-display/date-range-filter.tsx](../../src/components/data-display/date-range-filter.tsx) | DateRangeFilter |
| [src/components/data-display/document-link.tsx](../../src/components/data-display/document-link.tsx) | DocumentLink |
| [src/components/data-display/empty-state.tsx](../../src/components/data-display/empty-state.tsx) | EmptyState |
| [src/components/data-display/fiscal-invoice.tsx](../../src/components/data-display/fiscal-invoice.tsx) | FiscalInvoice |
| [src/components/data-display/metric-card.tsx](../../src/components/data-display/metric-card.tsx) | MetricCard, TrendIcon |
| [src/components/data-display/money.tsx](../../src/components/data-display/money.tsx) | Money |
| [src/components/data-display/status-badge.tsx](../../src/components/data-display/status-badge.tsx) | StatusBadge, Icon |
| [src/components/layout/app-breadcrumb.tsx](../../src/components/layout/app-breadcrumb.tsx) | AppBreadcrumb |
| [src/components/layout/app-logo.tsx](../../src/components/layout/app-logo.tsx) | AppLogo |
| [src/components/layout/app-sidebar.tsx](../../src/components/layout/app-sidebar.tsx) | NavigationLink, SidebarNavigation, Icon, AppSidebar |
| [src/components/layout/mobile-navigation.tsx](../../src/components/layout/mobile-navigation.tsx) | MobileNavigation, Icon, MobileMenuButton |
| [src/components/layout/notifications-menu.tsx](../../src/components/layout/notifications-menu.tsx) | NotificationsMenu |
| [src/components/layout/organization-switcher.tsx](../../src/components/layout/organization-switcher.tsx) | OrganizationSwitcher |
| [src/components/layout/page-container.tsx](../../src/components/layout/page-container.tsx) | PageContainer |
| [src/components/layout/page-header.tsx](../../src/components/layout/page-header.tsx) | PageHeader |
| [src/components/layout/store-switcher.tsx](../../src/components/layout/store-switcher.tsx) | StoreSwitcher |
| [src/components/layout/topbar.tsx](../../src/components/layout/topbar.tsx) | Topbar |
| [src/components/layout/user-menu.tsx](../../src/components/layout/user-menu.tsx) | UserMenu |
| [src/components/feedback/toaster.tsx](../../src/components/feedback/toaster.tsx) | Toaster |

Les anciennes notes [Phase1](../design-system.md) mentionnent des extractions dans `src/features/*` qui ne correspondent pas à tous les fichiers actuels. Ne pas créer ou importer un chemin uniquement parce qu’il figure dans cette note historique ; vérifier le code réel.

## Points d’entrée auth et tests

Pages : `src/app/login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx`, `verify-email/page.tsx`, `invite/activate/page.tsx`. Handlers : `src/app/auth/callback/route.ts`, `src/app/auth/confirm/route.ts` ; destinations sûres dans `src/lib/supabase/redirect.ts` ; SDK dans `src/lib/supabase/client.ts` et `server.ts`.

Tests existants : [auth unitaires](../../tests/auth.test.cjs), [auth responsive](../../tests/browser-auth-design.cjs), [accès](../../tests/browser-access.cjs), [smoke métier](../../tests/browser-smoke.cjs), [régressions DS](../../tests/design-system-regressions.cjs), [lanceur isolé](../../scripts/test-browser-isolated.cjs). Fixtures exclusivement de test, ne pas importer dans l’application.

## Valeurs CSS globales et isolées

L’[inventaire des valeurs](references/inventaire-valeurs.md) contient toutes les déclarations de custom properties du handoff, des tokens implémentés et du CSS auth ; il complète les tables de couleurs. [Occurrences sources](references/source-color-occurrences.json) donne valeur exacte, fichier et ligne de chaque couleur extraite.
