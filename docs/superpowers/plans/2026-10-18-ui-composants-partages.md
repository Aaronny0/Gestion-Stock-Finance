# Composants UI partagés et migration des écrans métier — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** unifier les modales sur Radix, factoriser les motifs de liste en composants partagés, puis migrer tous les écrans métier vers ces composants, en corrigeant les défauts relevés.

**Architecture :** les primitives restent dans `src/components/ui`, et les blocs de liste vont dans `src/components/data-display`, avec un CSS module par composant. Les façades `Modal`, `ConfirmDialog` et `ActionForm` gardent leur API, ce qui épargne les appelants. Les écrans sont migrés par lots ; chaque lot fait l'objet d'un commit vérifié à 1440, 768 et 360 px.

**Tech Stack :** Next.js 16.3 (lire `node_modules/next/dist/docs/` avant toute API Next), React 19, Radix Dialog et AlertDialog, TanStack Table, CSS modules, tests `node --test` (assertions sur la source et fonctions pures transpilées par `typescript`), Playwright (`node_modules/playwright`).

**Spec :** `docs/superpowers/specs/2026-10-18-ui-composants-partages-design.md`

## Global Constraints

- Lire `docs/design-system/README.md` et `references/divergences.md` avant toute modification d'UI (AGENTS.md).
- HEX autorisés dans les nouveaux CSS modules : `#fff`, `#dde3e4`, `#eaefef`, `#586767`, `#f9f9fc`, `#0a1a1b`, `#007176`, `#dff2f2`, `#04585c`, `#fff2d6`, `#864900`, `#e8a127`, `#9e1618`. Tout le reste passe par les tokens existants (`var(--…)`).
- Contrôles de barre d'outils : **40 px**. Cibles tactiles : **44 px** (`pointer: coarse` et menu « ⋯ »).
- Lignes de table : 52 px par défaut, 60 px pour Ventes (D06).
- Bande de synthèse : 2 × 2 sous **860 px** de largeur utile. Liste en lignes-cartes sous **900 px** de largeur utile.
- Tailles de Dialog : `sm` 448, `md` 640 (défaut), `lg` 768, `xl` 1024 px. Hauteur maximale `min(100dvh - 32px, 90dvh)`. Rayon 12 px. Ombre `--shadow-dialog`. Fond `foreground/35`.
- Textes en français. Titres fonctionnels sans eyebrow ni slogan. Aucun bouton « Retour » sur une page de premier niveau.
- Données métier, permissions (`can(...)`) et appels API inchangés. Aucune action groupée inventée.
- Une migration d'écran ne casse pas son export CSV ni ses colonnes (`exportRow` conservé à l'identique).
- Commits : un par tâche, se terminant par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Ne jamais embarquer `src/styles/base.css` ni `tests/ui-scroll-layout.test.cjs` (correctif non commité de l'utilisateur) avant la tâche 19.
- Vérification de chaque tâche d'écran :
  - `npm run typecheck && npm run lint && npm test` ;
  - `node tests/ui-audit.cjs <routes du lot>` sur le serveur de dev de cette copie (`TEST_BASE_URL=http://localhost:3001`).

## Review Focus

1. **Formulaire modifié fermé par Échap ou par un clic sur le fond.** On attend la confirmation `discard()`, et non une perte silencieuse. Test : tâche 2, étape 1 (assertion sur la source) et tâche 4 (navigateur, Échap après saisie).
2. **Modale plus haute que l'écran à 360 × 640.** Le pied doit rester visible et le corps défiler. Test : tâche 4, modale « Nouvelle entrée » à 360 × 640.
3. **Filtre actif sans résultat, puis « Effacer les filtres ».** La liste doit revenir, et l'état vide « premier usage » ne doit pas apparaître à la place. Test : tâche 4, audit Stock avec une recherche `zzzz`.
4. **Libellés longs** (nom de boutique, compteurs à 3 chiffres) dans la bande et les onglets à 360 px : aucun débordement. Couvert par la mesure `scrollWidth` de la tâche 4 sur toutes les routes.
5. **Fermeture d'une modale ouverte par état.** Le focus doit revenir au bouton déclencheur, et non à `body`. Test : tâche 4, `document.activeElement` après Échap.

---

## Lot 0 — Outil de vérification

### Task 1: Garde-fous statiques et audit navigateur

**Files:**
- Create: `tests/ui-components.test.cjs`
- Create: `tests/ui-audit.cjs`
- Modify: `package.json` (scripts `test` et `test:browser`)

**Interfaces:**
- Produces :
  - `node tests/ui-audit.cjs [route…]` : sans argument, les 22 routes du spec ; avec arguments, uniquement celles-ci. Sortie non nulle en cas d'échec. Lit `TEST_BASE_URL` (défaut `http://localhost:3000`).
  - Dans `tests/ui-components.test.cjs`, les helpers `read(path)`, `srcFiles()` (tous les `.ts`, `.tsx` et `.css` de `src`) et `ALLOWED_HEX` (le Set des HEX autorisés).

- [ ] **Step 1 : écrire `tests/ui-components.test.cjs`** avec un seul test pour l'instant, qui sera complété par chaque tâche.

```js
test("les CSS modules des composants partagés n'utilisent que les HEX approuvés", () => {
  for (const f of srcFiles().filter(f => /src\/components\/.*\.module\.css$/.test(f)))
    for (const hex of read(f).match(/#[0-9a-f]{3,8}\b/gi) ?? [])
      assert.ok(ALLOWED_HEX.has(hex.toLowerCase()), `${f} : ${hex} hors palette D26`);
});
```

- [ ] **Step 2 : écrire `tests/ui-audit.cjs`.** Le script reprend le scratchpad d'audit de la session, sur Playwright Chromium, aux largeurs `[1440, 768, 360]` et avec une hauteur de 900. Pour chaque route :
  - échouer si `documentElement.scrollWidth - clientWidth > 0` ;
  - pour chaque `[data-list-toolbar]`, échouer si les hauteurs arrondies des `button, input, [role=combobox]` visibles ne forment pas un ensemble d'une seule valeur.

  Ajouter les contrôles des modales (bloc `modals`, à 1440 × 900 et 360 × 640) :
  - `/demo/stock` → « Nouvelle entrée » ;
  - `/demo/purchases` → « Nouvel achat » ;
  - `/demo/team` → « Inviter un membre » ;
  - `/demo/expenses` → « Nouvelle dépense » ;
  - `/demo/accounting/journals` → « Nouvelle écriture » ;
  - `/demo/stock` → « Importer ».

  Sous 768 px, passer par le menu « Autres actions ». Pour chacune, vérifier :
  - `[role=dialog]` est centré à ±2 px horizontalement ;
  - le `[data-dialog-footer]` a son `getBoundingClientRect().bottom <= innerHeight` ;
  - `document.activeElement` n'a pas `aria-label="Fermer"` ;
  - après une saisie dans le premier champ puis Échap, un `[role=alertdialog]` ou un `confirm` intercepté (`page.on("dialog")`) apparaît (Review Focus 1) ;
  - après fermeture sans saisie, `document.activeElement` est le bouton déclencheur (Review Focus 5).

  Ajouter le cas Stock « recherche `zzzz` » : un `[data-empty-kind=no-results]` est visible, et après un clic sur « Effacer les filtres » la table a au moins une ligne (Review Focus 3).

- [ ] **Step 3 : brancher les scripts.** Ajouter `tests/ui-components.test.cjs` à la fin de `test`, et `node tests/ui-audit.cjs` à la fin de `test:browser`.
- [ ] **Step 4 : constater l'état de départ.** `npm test` passe (aucun module de composant n'existe encore). `TEST_BASE_URL=http://localhost:3001 node tests/ui-audit.cjs` échoue, entre autres sur `/demo/audit` à 360 (12 px), sur les modales Équipe et Comptabilité (pied hors écran) et sur le focus initial. Conserver cette sortie comme référence dans le message de commit.
- [ ] **Step 5 : commit** `test(ui): garde-fous des composants partagés et audit navigateur`.

## Lot 1 — Modales

### Task 2: Dialog à en-tête et pied fixes, façades Modal / ConfirmDialog / ActionForm

**Files:**
- Modify: `src/components/ui/dialog.tsx`, `src/components/ui/alert-dialog.tsx`
- Create: `src/components/ui/use-return-focus.ts`
- Modify: `src/frontend/ui.tsx:165-238` (Modal, ConfirmDialog, `modalLocks`)
- Modify: `src/frontend/forms.tsx:473-830` (ActionForm)
- Modify: `src/styles/legacy/forms.css:64-105`, `src/styles/legacy/navigation.css:2-11,59-71,109-114`, `src/styles/legacy/responsive.css:175-193`, `src/styles/print.css:10-29` (suppression des règles `.modal*`)
- Test: `tests/ui-components.test.cjs`

**Interfaces:**
- Produces :
  - `DialogContent` reçoit les props `size?: "sm" | "md" | "lg" | "xl"` et `hideClose?`.
  - `DialogBody` (div, `data-dialog-body`, `.scroll-hint`, `min-h-0 flex-1 overflow-y-auto`).
  - `DialogFooter` porte `data-dialog-footer`, une bordure haute et `shrink-0`.
  - `DialogHeader` a une bordure basse et un `pr-12` pour la croix.
  - `useReturnFocus(open: boolean): void` rend le focus à l'élément actif mémorisé à l'ouverture.
  - `Modal({ title, onClose, children, size?, description?, onCloseRequest? })`, où `onCloseRequest(): boolean` peut refuser la fermeture.
  - `ConfirmDialog` garde ses props actuelles et rend un `AlertDialog`.
- La mise en page passe `DialogContent` en `flex flex-col p-0 overflow-hidden`. Le padding de 24 px est porté par l'en-tête (`px-6 pt-6 pb-4`), le corps (`px-6 py-5`) et le pied (`px-6 py-4`). Sous `sm`, le pied est en `flex-col-reverse`, avec des boutons `w-full`.
- `onOpenAutoFocus` vaut par défaut : focus sur le premier `input, select, textarea, [tabindex]:not([tabindex="-1"])` de `[data-dialog-body]`, sinon sur le contenu. On appelle `preventDefault` sur le comportement Radix.

- [ ] **Step 1 : ajouter les tests qui échouent** dans `tests/ui-components.test.cjs` :
  - `dialog.tsx` contient `DialogBody`, `data-dialog-footer`, `size` avec les quatre largeurs `max-w-[448px]`, `max-w-[640px]`, `max-w-[768px]`, `max-w-[1024px]`, ainsi que `onOpenAutoFocus` ;
  - `ui.tsx` ne contient ni `<dialog`, ni `showModal`, ni `modalLocks` ;
  - `forms.tsx` ne contient ni `modal-body`, ni `modal-foot`, ni `className="button` ;
  - `ActionForm` passe `onCloseRequest` à `Modal`, qui l'appelle depuis `onEscapeKeyDown` et `onPointerDownOutside` (regex `onEscapeKeyDown[\s\S]*onCloseRequest`) ;
  - aucun fichier de `src/styles` ne contient `.modal-` ;
  - `forms.tsx:382` utilise l'accord : regex `unité\$\{|unités?` remplacée par un helper `plural(n, "unité")`.
- [ ] **Step 2 : lancer** `node --test tests/ui-components.test.cjs`. Attendu : FAIL sur ces assertions.
- [ ] **Step 3 : implémenter `dialog.tsx`, `alert-dialog.tsx` (même mise en page, `data-dialog-footer`) et `use-return-focus.ts`.**
- [ ] **Step 4 : réécrire `Modal` et `ConfirmDialog` dans `ui.tsx`** au-dessus de `Dialog` et `AlertDialog` (ouverts en permanence, `onOpenChange(false)` → `onCloseRequest?.() !== false && onClose()`).
- [ ] **Step 5 : migrer `ActionForm`.**
  - `<form className="flex min-h-0 flex-1 flex-col">` contient `DialogBody` puis `DialogFooter`.
  - Les boutons deviennent des `Button` shadcn : `variant="outline"` pour Annuler/Modifier, `default` pour la soumission.
  - `onCloseRequest={() => !busy && discard()}`.
  - Ajouter `plural(count: number, word: string): string` dans `src/lib/format.ts` (créé s'il n'existe pas) et l'utiliser aux lignes 382 et 600.
  - Les champs `kind === "textarea"` prennent la classe pleine largeur de la grille (`sm:col-span-2`).
- [ ] **Step 6 : supprimer les règles `.modal*`** des quatre fichiers CSS. La règle `dialog:modal` de base.css reste, car elle appartient à l'utilisateur (tâche 19).
- [ ] **Step 7 : vérifier.**
  - `npm run typecheck && npm run lint && npm test` passe.
  - `node tests/ui-audit.cjs /demo/stock /demo/purchases /demo/expenses` : les contrôles des modales natives migrées passent (centrage, pied visible, focus initial, Échap gardé, retour du focus).
  - Ouvrir aussi « Clôturer la caisse » (`/demo/cash`) et « Nouvelle vente → encaisser » (`/demo/pos`) au clavier : Tab parcourt le formulaire, Échap demande confirmation après saisie.
- [ ] **Step 8 : commit** `feat(ui): modales unifiées sur Radix (en-tête et pied fixes)`.

### Task 3: Dialogs Radix existants sur `size` et `DialogBody`

**Files:**
- Modify :
  - `src/features/sales/refund-dialog.tsx:49` → `size="lg"`
  - `src/features/pos/receipt.tsx:22` → `size="md"`, avec les règles d'impression de `print.css` portées sur `[data-receipt]`
  - `src/features/stock/stock-import-dialog.tsx:73` → `size="xl"`
  - `src/features/accounting/entry-editor.tsx:47` → `size="xl"`, avec `<form>` en flex colonne
  - `src/features/accounting/entry-detail.tsx:39` → `size="lg"`
  - `src/features/team/team-member-dialog.tsx:162` → `size="lg"`, avec `requestClose` branché sur `onEscapeKeyDown` et `onPointerDownOutside`
  - `src/features/finance/finance-record-dialog.tsx:45` → `size="md"`
  - `src/features/settings/store-dialog.tsx:34` → `size="sm"`
  - `src/features/audit/audit-page.tsx:54` → `size="md"`
  - `src/features/stock/stock-page.tsx:30` → `size="sm"`
  - `src/features/onboarding/onboarding-modal.tsx:77` → `size="lg"`
  - `src/app/admin/access/page.tsx:203` → `size="md"`, `DialogFooter` à la place du pied fait main
  - `src/features/pos/checkout-confirmation.tsx`, `src/features/accounting/accounting-page.tsx:124` (AlertDialog) : aucun changement d'API, ils héritent de la mise en page
- Test: `tests/ui-components.test.cjs`

**Interfaces:**
- Consumes : `DialogContent size`, `DialogBody` et `DialogFooter` (tâche 2).

- [ ] **Step 1 : test qui échoue.** Aucun fichier de `src/features` ni de `src/app` ne passe `max-w-` ou `max-h-` à `DialogContent` (regex `<DialogContent[^>]*className="[^"]*max-[wh]-`). Chaque `DialogContent` de ces fichiers contient un `DialogBody`.
- [ ] **Step 2 : lancer le test.** Attendu : FAIL avec la liste des fichiers.
- [ ] **Step 3 : migrer chaque fichier** (contenu central dans `DialogBody`, pied dans `DialogFooter`).
- [ ] **Step 4 : vérifier.**
  - Tests verts.
  - `node tests/ui-audit.cjs /demo/team /demo/accounting/journals` : les modales Équipe et Écriture ont leur pied visible à 360 × 640.
  - Le reçu de `/demo/pos` s'imprime sans en-tête de modale : aperçu `page.emulateMedia({ media: "print" })` et capture.
- [ ] **Step 5 : commit** `refactor(ui): dialogs existants sur les tailles nommées`.

## Lot 2 — Composants

### Task 4: `formatListDate` et accord du pluriel

**Files:**
- Modify/Create : `src/lib/format.ts` (déjà créé à la tâche 2 avec `plural`)
- Modify : `src/features/sales/sales-table.tsx:48-53`
- Test : `tests/format.test.cjs` (ajouté à `npm test`), qui transpile `src/lib/format.ts` comme `tests/onboarding-modal.test.cjs`

**Interfaces:**
- Produces :
  - `formatListDate(value: string | Date, opts?: { time?: boolean }): string`, avec `fr-FR`, `day: "2-digit"`, `month: "short"`, plus `hour` et `minute` si `time` (défaut `false`). Une date ISO `YYYY-MM-DD` sans heure est lue à midi local, pour éviter le décalage de jour.
  - `plural(count: number, word: string): string` → `"1 unité"`, `"0 unité"`, `"18 unités"`.

- [ ] **Step 1 : écrire les tests.**
  - `formatListDate("2026-10-18") === "18 oct."`
  - `formatListDate("2026-10-18T19:34:00", { time: true })` contient `"18 oct."` et `"19:34"`
  - `plural(1, "unité") === "1 unité"`, `plural(0, "unité") === "0 unité"`, `plural(18, "unité") === "18 unités"`
- [ ] **Step 2 : lancer le test.** Attendu : FAIL (`formatListDate` absent).
- [ ] **Step 3 : implémenter, puis remplacer le formatage inline de sales-table.tsx** par `formatListDate(date, { time: true })`.
- [ ] **Step 4 : lancer le test.** Attendu : PASS. Ventes affiche toujours « 18 oct., 01:00 » (capture à 1440).
- [ ] **Step 5 : commit** `feat(format): date de liste et pluriel partagés`.

### Task 5: `SummaryStrip`

**Files:**
- Create : `src/components/data-display/summary-strip.tsx`, `summary-strip.module.css`
- Test : `tests/ui-components.test.cjs`

**Interfaces:**
- Produces :
  - `SummaryStrip(props: React.ComponentProps<"section">)`
  - `SummaryItem({ label: ReactNode; value: ReactNode; currency?: string; meta?: ReactNode; icon?: LucideIcon; tone?: "default" | "warning"; pressed?: boolean; onPress?: () => void })`
  - `SummaryStrip.Skeleton({ count: number })`
- CSS repris de `stock.module.css:17-93` et `459-490` (la version la plus complète) :
  - grille `grid-auto-flow: column` ;
  - `@container summary (max-width: 859px)` → 2 colonnes, la dernière cellule impaire en `grid-column: 1 / -1` ;
  - `@media (max-width: 500px)` → padding `14px 16px` et valeur 18 px ;
  - libellés et valeurs en `overflow-wrap: anywhere` (Review Focus 4).
- Un `SummaryItem` avec `onPress` se rend en `<button type="button" aria-pressed>`, sinon en `<div>`. La devise s'affiche dans un `<span class=currency>`.

- [ ] **Step 1 : test qui échoue.** Le fichier existe et contient `@container`, `859px`, `aria-pressed`, `tabular-nums` et `grid-column: 1 / -1`.
- [ ] **Step 2 : lancer le test.** Attendu : FAIL.
- [ ] **Step 3 : implémenter.**
- [ ] **Step 4 : tests verts** (y compris le contrôle des HEX).
- [ ] **Step 5 : commit** `feat(ui): SummaryStrip partagée`.

### Task 6: `FilterChip` et `SegmentedControl`

**Files:**
- Create : `src/components/ui/filter-chip.tsx`, `filter-chip.module.css`, `src/components/ui/segmented-control.tsx`, `segmented-control.module.css`
- Modify : `src/components/ui/index.ts` (exports)
- Test : `tests/ui-components.test.cjs`

**Interfaces:**
- Produces :
  - `FilterChip({ pressed: boolean; onPressedChange: (v: boolean) => void; count?: number; tone?: "default" | "warning"; icon?: LucideIcon; children: ReactNode })`
  - `SegmentedControl<T extends string>({ options: { value: T; label: ReactNode }[]; value: T; onValueChange: (v: T) => void; "aria-label": string })`
- CSS de `FilterChip` repris de `stock.module.css:196-243` : 40 px, rayon 8 px, actif `#dff2f2` / `#04585c`, warning `#fff2d6` / `#864900` / `#e8a127`, compteur en `small`.
- CSS de `SegmentedControl` repris de `sales.module.css:83-104`, porté à 40 px : un conteneur `#eaefef`, et l'option active en `#fff` avec `var(--shadow-xs, …)`, sans nouvelle couleur.
- Ces deux composants imposent `min-height: 44px` sous `@media (pointer: coarse)`.

- [ ] **Step 1 : test qui échoue.** Les deux fichiers rendent `aria-pressed` ; `filter-chip.module.css` contient `height: 40px` et `#dff2f2` ; `segmented-control.tsx` contient `role="group"`.
- [ ] **Step 2 : lancer le test.** Attendu : FAIL.
- [ ] **Step 3 : implémenter.**
- [ ] **Step 4 : tests verts.**
- [ ] **Step 5 : commit** `feat(ui): FilterChip et SegmentedControl`.

### Task 7: `EmptyState` étendu

**Files:**
- Modify : `src/components/data-display/empty-state.tsx`
- Create : `src/components/data-display/empty-state.module.css`
- Modify : `src/components/data-display/data-table.tsx:393` (le repli passe `kind`)
- Test : `tests/ui-components.test.cjs`

**Interfaces:**
- Produces : `EmptyState({ kind?: "first-use" | "no-results" | "error"; title: string; description?: ReactNode; icon?: LucideIcon; actions?: ReactNode; steps?: { title: string; description: string }[]; onClearFilters?: () => void })`.
  - `title` devient obligatoire, ce qui supprime le défaut générique.
  - Icônes par défaut : `Inbox`, `SearchX` et `TriangleAlert`.
  - Rendu : `data-empty-kind={kind}`, colonne centrée, icône au-dessus du titre.
  - `onClearFilters` ajoute un `Button variant="outline"` « Effacer les filtres ».
  - `steps` est rendu comme les trois étapes de Stock (`stock.module.css:342-374`).
- `DataTable` reçoit la prop `emptyKind?: "first-use" | "no-results"`. Son repli rend `<EmptyState kind={emptyKind ?? (globalFilter ? "no-results" : "first-use")} title={emptyTitle ?? (globalFilter ? "Aucun résultat pour cette recherche" : "Rien à afficher pour le moment")} onClearFilters={globalFilter ? () => setGlobalFilter("") : undefined} />`.

- [ ] **Step 1 : test qui échoue.**
  - `empty-state.tsx` contient `data-empty-kind`, `Effacer les filtres` et `steps` ;
  - `title?:` n'y apparaît pas ;
  - aucun fichier de `src` ne contient « créez votre premier élément ».
- [ ] **Step 2 : lancer le test.** Attendu : FAIL.
- [ ] **Step 3 : implémenter.** Corriger les appelants actuels qui n'ont pas de `title` (stock-page:109, pos/cart:101, frontend/pos:353) en leur passant leurs textes actuels.
- [ ] **Step 4 : tests verts.** typecheck passe.
- [ ] **Step 5 : commit** `feat(ui): états vides typés`.

### Task 8: `ListCard`, `ListTabs` et props `DataTable`

**Files:**
- Create : `src/components/data-display/list-card.tsx`, `list-card.module.css`
- Modify : `src/components/data-display/data-table.tsx` (props `toolbarStart`, `data-list-toolbar`, bascule en cartes par container query)
- Test : `tests/ui-components.test.cjs`

**Interfaces:**
- Produces :
  - `ListCard({ tabs?: ReactNode; children: ReactNode; className?: string })`, rendu en `<section>` avec `container: list / inline-size`.
  - `ListTabs`, en deux formes :
    - `{ items: { href: string; label: string; count?: number; tone?: "warning"; active: boolean }[] }`, rendu en `nav` avec des `Link` et `aria-current="page"` ;
    - `{ items: { value: string; label: string; count?: number; tone?: "warning" }[]; value: string; onValueChange(v: string): void; "aria-label": string }`, rendu en `role="tablist"`, avec flèches gauche/droite, Début et Fin.
  - `DataTable` reçoit `toolbarStart?: ReactNode` (rendu avant la recherche) et `data-list-toolbar` sur `.data-toolbar`. Il garde `density` (`"default"` = 52 px, `"comfortable"` = 60 px).
- Bascule en cartes : quand `mobileRow` est fourni, les classes `md:hidden` et `hidden md:block` (data-table.tsx:398 et 430) sont remplacées par `data-list-mobile` et `data-list-desktop`. `list-card.module.css` les bascule par `@container list (max-width: 899px)`. Hors `ListCard`, une règle de repli dans `data-table` garde le seuil `md` actuel.
- CSS : déplacer dans `list-card.module.css` les sélecteurs `:global` communs de `sales.module.css:41-180` et `stock.module.css:94-330` (en-têtes, badges `::before`, pagination tactile, checkbox de 16 px). Contrôles de la barre d'outils à 40 px ; recherche en `flex: 1 1 220px; max-width: 360px` ; `margin-left: auto` sur le premier bouton d'action seulement. Onglets : 44 px, `border-bottom: 2px`, actif `#007176`.

- [ ] **Step 1 : test qui échoue.**
  - `list-card.module.css` contient `@container list (max-width: 899px)` et `height: 40px` ;
  - `data-table.tsx` contient `toolbarStart` et `data-list-toolbar` ;
  - `list-card.tsx` contient `aria-current` et `role="tablist"`.
- [ ] **Step 2 : lancer le test.** Attendu : FAIL.
- [ ] **Step 3 : implémenter.**
- [ ] **Step 4 : tests verts.** typecheck passe.
- [ ] **Step 5 : commit** `feat(ui): ListCard, ListTabs et barre d'outils commune`.

### Task 9: `PageHeader` à actions primaire et secondaires

**Files:**
- Modify : `src/components/layout/page-header.tsx`
- Test : `tests/ui-components.test.cjs`

**Interfaces:**
- Produces : `PageHeader({ title: string; description?: string; primaryAction?: ReactNode; secondaryActions?: { label: string; icon?: LucideIcon; onSelect: () => void; disabled?: boolean }[]; actions?: ReactNode; eyebrow?: string })`.
  - `eyebrow` et `actions` restent tolérés jusqu'à la tâche 19, qui les supprime.
  - Les actions secondaires sont des `Button variant="outline"` (40 px) visibles à partir de 768 px. Sous 768 px, elles passent dans un `DropdownMenu` déclenché par un `Button size="icon"` de 44 px, `aria-label="Autres actions"`, placé avant la primaire.
  - Reprendre le comportement de stock-page (menu « ⋯ » de D26), qui devient l'implémentation commune.
- [ ] **Step 1 : test qui échoue.** `page-header.tsx` contient `secondaryActions` et `Autres actions`.
- [ ] **Step 2 : lancer le test.** Attendu : FAIL.
- [ ] **Step 3 : implémenter.**
- [ ] **Step 4 : tests verts.**
- [ ] **Step 5 : commit** `feat(ui): PageHeader avec actions secondaires repliables`.

## Lot 3 — Écrans de référence

### Task 10: Ventes sur les composants partagés

**Files:**
- Modify : `src/features/sales/sales-page.tsx:93-225`, `sales-table.tsx:125-165`, `sales-state.tsx:20-31`, `sales.module.css` (suppression de `.summary`, `.period`, `.chips`, `.state` et des `:global` déplacés)
- Test : `tests/ui-components.test.cjs`

**Interfaces:**
- Consumes : `SummaryStrip`/`SummaryItem`, `SegmentedControl` (période), `FilterChip` (statuts avec `count`), `ListCard`, `EmptyState kind="no-results" | "error"`, `PageHeader secondaryActions` (« Crédits et échéances »), `DataTable density="comfortable" toolbarStart`.

- [ ] **Step 1 : test qui échoue.**
  - `sales.module.css` ne contient plus `.summary`, `.chips`, `.period`, `.state` ni `:global(.data-toolbar)` ;
  - `sales-page.tsx` importe `SummaryStrip`, `FilterChip` et `SegmentedControl`.
- [ ] **Step 2 : lancer le test.** Attendu : FAIL.
- [ ] **Step 3 : migrer.** Les puces de statut passent au style FilterChip, ce qui est le seul changement visuel voulu. Le panneau de détail (Sheet de 460 px) est inchangé.
- [ ] **Step 4 : vérifier.**
  - Tests, typecheck et lint passent.
  - `node tests/ui-audit.cjs /demo/sales /demo/sales/sale0` passe (barre d'outils sur une seule hauteur).
  - Captures à 1440, 768 et 360, comparées aux captures d'audit : même structure, seules les puces diffèrent.
- [ ] **Step 5 : commit** `refactor(sales): Ventes sur les composants de liste partagés`.

### Task 11: Stock, fiche produit et Réapprovisionnement

**Files:**
- Modify : `src/features/stock/stock-page.tsx`, `stock-tabs.tsx` (remplacé par `ListTabs`, puis le fichier est supprimé), `stock-filters.tsx`, `stock-table.tsx`, `product-details.tsx`, `replenishment-page.tsx`, `stock.module.css`
- Test : `tests/ui-components.test.cjs`

**Interfaces:**
- Consumes : tous les composants du lot 2.

- [ ] **Step 1 : test qui échoue.**
  - `stock.module.css` ne contient plus `.summary`, `.chip`, `.tabs`, `.empty` ni `:global(.data-toolbar)` ;
  - `stock-tabs.tsx` n'existe plus ;
  - `product-details.tsx` ne contient ni `eyebrow` ni « Retour ».
- [ ] **Step 2 : lancer le test.** Attendu : FAIL.
- [ ] **Step 3 : migrer.**
  - Stock : la bande avec la cellule « À réapprovisionner » en `onPress`, `ListTabs` à `href` (quatre onglets avec compteurs), des `FilterChip` pour Stock faible et Archivés, l'état vide `first-use` (actions Importer et Créer un produit, trois `steps`) ou `no-results` (Effacer les filtres), et `mobileRow` pour les lignes-cartes sous 900 px.
  - Fiche produit : `PageHeader title={marque modèle} description={variante · état}`, primaire « Nouvelle entrée », secondaires Modifier, Ajuster, Transférer et Archiver. La grille de cartes devient un `SummaryStrip` (Stock, Prix de vente, Coût unitaire sous `stock.cost.read`, IMEI). L'état vide dit « Aucun mouvement pour ce produit », sans phrase sur les filtres, avec `kind="first-use"`.
  - Réapprovisionnement : il s'affiche dans la `ListCard` de Stock, onglet « Réapprovisionnement » actif.
- [ ] **Step 4 : vérifier.**
  - Tests, typecheck et lint passent.
  - `node tests/ui-audit.cjs /demo/stock /demo/products/p0 /demo/stock/replenishment` passe, y compris le cas `zzzz` puis « Effacer les filtres » et la modale Importer.
  - À 768, la barre d'outils tient sur au plus deux lignes, sans « Exporter » isolé, et la liste est en cartes.
- [ ] **Step 5 : commit** `refactor(stock): Stock, fiche produit et réappro sur les composants partagés`.

## Lot 4 — Annuaire

### Task 12: Achats, Troc, Rachat, Clients, Fournisseurs (`BusinessPage`)

**Files:**
- Modify : `src/frontend/pages.tsx:90-440` (`BusinessPage`, la synthèse `.directory-summary` en l.271, l'usage du `DataTable` et du `DateRangePicker` legacy, ainsi que du `PageHeading`)
- Test : `tests/ui-components.test.cjs`

**Interfaces:**
- Consumes :
  - `PageHeader`, `SummaryStrip` (Clients et Fournisseurs : nombre et créances, cellule créances en `onPress` qui filtre les soldes dus), `ListCard` ;
  - le `DataTable` moderne avec `toolbarStart` portant le filtre de période existant (`src/components/data-display/date-range-filter.tsx`) ;
  - `EmptyState` ;
  - `formatListDate`, et `meta.align: "right"` pour les colonnes de montant.
- Titres : « Achats », « Troc & reprise », « Rachat client », « Clients », « Fournisseurs », avec les descriptions actuelles.
- États vides propres à chaque écran, en `first-use` :
  - « Aucun achat enregistré », action « Nouvel achat » ;
  - « Aucun troc enregistré » ;
  - « Aucun rachat enregistré » ;
  - « Aucun client », « Aucun fournisseur ».

  En `no-results`, « Aucun achat sur cette période », avec Effacer les filtres.
- Supprimer la colonne « Détail / Voir › » (le clic de ligne reste via `onRow`) et la sélection (`enableSelection={false}`). L'export reste dans Exporter.

- [ ] **Step 1 : test qui échoue.**
  - `pages.tsx` n'importe plus `DataTable`, `PageHeading`, `DateRangePicker` ni `EmptyState` depuis `./ui` ;
  - il ne contient ni `eyebrow`, ni `directory-summary`, ni « ESPACE DE GESTION ».
- [ ] **Step 2 : lancer le test.** Attendu : FAIL.
- [ ] **Step 3 : migrer.**
- [ ] **Step 4 : vérifier.**
  - Tests, typecheck et lint passent.
  - `node tests/ui-audit.cjs /demo/purchases /demo/trade /demo/buyback /demo/clients /demo/suppliers` passe, y compris la modale « Nouvel achat ».
  - Captures à 1440, 768 et 360 : l'icône de l'état vide est centrée au-dessus du titre.
- [ ] **Step 5 : commit** `refactor(directory): achats, troc, rachat, clients et fournisseurs au gabarit Listes`.

## Lot 5 — Finance

### Task 13: Trésorerie, Dépenses, Paiements

**Files:**
- Modify : `src/features/finance/cash-page.tsx:50-80`, `expenses-page.tsx:35-50`, `payments-page.tsx:35-50`

**Interfaces:**
- Consumes : `PageHeader` (titres « Trésorerie & caisse », « Dépenses », « Paiements »), `SummaryStrip` à la place de `MetricCard` et `.finance-summary`, `ListCard`, `toolbarStart` (période), `formatListDate`, `meta.align: "right"` sur toutes les colonnes de montant et sur leur en-tête.
- Trésorerie : deux `ListCard` titrées. Le titre de section est rendu au-dessus de chaque carte, par un `<h2>` existant. « Mouvement manuel » devient une action secondaire du `PageHeader`.
- Le `mobileRow` existant et `exportRow` sont conservés. Les dates de `mobileRow` passent par `formatListDate`.

- [ ] **Step 1 : test qui échoue.** Ces trois fichiers n'importent plus `MetricCard`, ne contiennent ni `finance-summary` ni `eyebrow=`, et importent `formatListDate`.
- [ ] **Step 2 : lancer le test.** Attendu : FAIL.
- [ ] **Step 3 : migrer.**
- [ ] **Step 4 : vérifier.**
  - Tests, typecheck et lint passent.
  - `node tests/ui-audit.cjs /demo/cash /demo/expenses /demo/payments` passe.
  - À 360, plus aucun libellé tronqué (« CAISSE O… ») : capture.
- [ ] **Step 5 : commit** `refactor(finance): trésorerie, dépenses et paiements sur les composants partagés`.

### Task 14: Crédits

**Files:**
- Modify : `src/features/sales/credits-page.tsx:25-45`

**Interfaces:**
- Consumes : `PageHeader` (« Crédits et échéances », secondaire « Toutes les ventes »), `SummaryStrip` (à la place des 2 `Card`), `ListTabs` en mode `value` (à la place des `Tabs` Radix en pastille), `ListCard`, `formatListDate` pour la colonne Échéance (l.30), `EmptyState`.

- [ ] **Step 1 : test qui échoue.** `credits-page.tsx` n'importe ni `TabsList` ni `Card`, et importe `ListTabs`.
- [ ] **Step 2 : lancer le test.** Attendu : FAIL.
- [ ] **Step 3 : migrer.**
- [ ] **Step 4 : vérifier** `node tests/ui-audit.cjs /demo/sales/credits` et le parcours clavier des onglets (flèches).
- [ ] **Step 5 : commit** `refactor(credits): crédits au gabarit Listes`.

## Lot 6 — Comptabilité et Statistiques

### Task 15: Comptabilité

**Files:**
- Modify : `src/features/accounting/accounting-page.tsx:60-130`
- Modify : la source du fil d'Ariane « Détail » (`src/components/layout/app-breadcrumb.tsx` et/ou `parentRoute` dans `src/frontend/navigation.ts:159`), pour que `/accounting/<onglet>` soit vue comme une page de premier niveau

**Interfaces:**
- Consumes :
  - `PageHeader` (« Comptabilité », primaire « Nouvelle écriture »), sans bouton « Retour » ;
  - `SummaryStrip` ;
  - `ListTabs` à `href` pour les six onglets (`/accounting/journals`, `accounts`, `ledger`, `trial-balance`, `statements`, `periods`) ;
  - `ListCard` contenant chaque `DataTable`, avec `toolbarStart` (période) et `filters` (sélecteurs de journal ou de compte, trigger à 40 px) ;
  - `meta.align: "right"` sur Débit, Crédit et Solde ;
  - `formatListDate`.
- « Ajouter un sous-compte » passe dans `filters` de l'onglet Plan comptable. L'encadré d'information du Grand livre reste, au-dessus de la `ListCard`.

- [ ] **Step 1 : test qui échoue.**
  - `accounting-page.tsx` ne contient ni `TabsList`, ni `MetricCard`, ni « Retour » ;
  - il importe `ListTabs` ;
  - `parentRoute("/accounting/journals")` renvoie `undefined` (assertion sur la fonction transpilée).
- [ ] **Step 2 : lancer le test.** Attendu : FAIL.
- [ ] **Step 3 : migrer.**
- [ ] **Step 4 : vérifier.**
  - `node tests/ui-audit.cjs /demo/accounting/journals /demo/accounting/ledger` passe, y compris la modale Écriture.
  - Le fil d'Ariane affiche « Finance / Comptabilité ».
  - Tests, typecheck et lint passent.
- [ ] **Step 5 : commit** `refactor(accounting): comptabilité au gabarit Listes`.

### Task 16: Statistiques

**Files:**
- Modify : `src/frontend/analytics.tsx:90-370` (`.page-tabs` en l.94, `.compact-metrics` en l.149 et 349, `DataTable` legacy, `button primary` en l.364, `<select>` natifs)

**Interfaces:**
- Consumes :
  - `PageHeader` (« Analyses & rapports ») ;
  - `ListTabs` à `href` pour les sous-pages d'analyse existantes ;
  - `SummaryStrip` à la place de `.compact-metrics` ;
  - `ListCard`, et `DataTable` moderne à la place du legacy ;
  - `Select` shadcn (`src/components/ui/select.tsx`) à 40 px à la place des `<select>` natifs, rangés dans `filters` ;
  - `Button` shadcn.

- [ ] **Step 1 : test qui échoue.** `analytics.tsx` ne contient ni `page-tabs`, ni `compact-metrics`, ni `<select`, ni `className="button`, et n'importe pas `DataTable` depuis `./ui`.
- [ ] **Step 2 : lancer le test.** Attendu : FAIL.
- [ ] **Step 3 : migrer.**
- [ ] **Step 4 : vérifier** `node tests/ui-audit.cjs /demo/analytics` (et chaque sous-onglet à 360), puis tests, typecheck et lint.
- [ ] **Step 5 : commit** `refactor(analytics): statistiques sur les composants partagés`.

## Lot 7 — Administration et en-têtes restants

### Task 17: Équipe et Audit

**Files:**
- Modify : `src/features/team/team-page.tsx:60-140`
- Modify : `src/features/team/team-member-dialog.tsx:43` (`permissionLabel` exporté)
- Modify : `src/features/audit/audit-page.tsx:20-60`

**Interfaces:**
- Produces : `export function permissionLabel(permission: Permission): string` (team-member-dialog.tsx), qui renvoie la clé si aucun libellé n'existe.
- Consumes :
  - Équipe : `PageHeader` (« Équipe & rôles »), `SummaryStrip` à la place de `.team-summary`, `ListCard`. Les puces des modèles de rôles affichent `permissionLabel(p)`.
  - Audit : `PageHeader` (« Historique & audit »), la période déplacée dans `toolbarStart` de la `ListCard`, `formatListDate(date, { time: true })`.
- Le débordement de 12 px à 360 px disparaît : le filtre de période passe sur une colonne pleine largeur dans la barre d'outils.

- [ ] **Step 1 : test qui échoue.**
  - `team-page.tsx` ne contient pas `team-summary` et importe `permissionLabel` ;
  - `audit-page.tsx` ne contient pas `eyebrow=`.
- [ ] **Step 2 : lancer le test.** Attendu : FAIL.
- [ ] **Step 3 : migrer.**
- [ ] **Step 4 : vérifier.**
  - `node tests/ui-audit.cjs /demo/team /demo/audit` passe, avec `scrollWidth` à 0 à 360.
  - La modale « Inviter » a son pied visible.
- [ ] **Step 5 : commit** `refactor(admin): équipe et audit sur les composants partagés`.

### Task 18: Paramètres, Caisse (POS), Dashboard

**Files:**
- Modify : `src/features/settings/settings-page.tsx` (en-tête), `src/frontend/pos.tsx` (en-tête, ~l.340), `src/features/dashboard/dashboard-period-filter.tsx:32` et `src/features/dashboard/dashboard.module.css:219-232`

**Interfaces:**
- Consumes :
  - `PageHeader` (« Paramètres » ; « Nouvelle vente » avec la secondaire « Historique des ventes ») ;
  - `SegmentedControl` pour les préréglages du dashboard. La hauteur passe de 28 à 40 px ; le bouton calendrier, à 34 px aujourd'hui, est aligné à 40 px.

- [ ] **Step 1 : test qui échoue.**
  - aucun `eyebrow=` dans `settings-page.tsx` ni dans `pos.tsx` ;
  - `dashboard.module.css` ne contient plus `.presets` ;
  - `dashboard-period-filter.tsx` importe `SegmentedControl`.
- [ ] **Step 2 : lancer le test.** Attendu : FAIL.
- [ ] **Step 3 : migrer.**
- [ ] **Step 4 : vérifier** `node tests/ui-audit.cjs /demo /demo/pos /demo/settings`. Le dashboard reste conforme à sa maquette (capture à 1440 comparée à l'audit).
- [ ] **Step 5 : commit** `refactor(ui): en-têtes fonctionnels de paramètres et caisse, préréglages du dashboard`.

## Lot 8 — Nettoyage et preuves

### Task 19: Suppression du code mort et garde-fous définitifs

**Files:**
- Delete :
  - `src/frontend/returns.tsx`, `import-stock.tsx`, `accounting-page.tsx`, `settings.tsx`, `workflows.tsx` ;
  - `src/components/data-display/metric-card.tsx`.
- Modify :
  - `src/frontend/ui.tsx` : supprimer `DataTable`, `EmptyState`, `PageHeading` et `DateRangePicker` s'ils ne sont plus importés ;
  - `src/styles/product.css` : `.finance-summary` (l.1184), `.team-summary` (l.1203), `.directory-summary` (l.1291), `.sales-ledger-summary` (l.1148) ;
  - `src/styles/claude-product.css:247` ;
  - `src/styles/legacy/data.css` : `.empty-state` (l.164), `.page-tabs` (l.265-293), `.compact-metrics` (l.141) ;
  - `src/components/layout/page-header.tsx` : retirer `eyebrow` et `actions` ;
  - `src/styles/base.css` : retirer `dialog:modal`, et dans `tests/ui-scroll-layout.test.cjs` le test associé. **Avant cette étape, demander l'accord de l'utilisateur**, car ces deux changements sont les siens et ne sont pas commités. Sans accord, laisser les deux fichiers tels quels et le signaler dans le compte rendu.

- [ ] **Step 1 : tests de garde-fou définitifs.** Aucun fichier de `src` ne contient `<dialog`, `modal-foot`, `eyebrow`, `finance-summary`, `team-summary`, `directory-summary`, `MetricCard`, `page-tabs`, `compact-metrics` ni `className="button`. Exception documentée : `src/app/error.tsx` et `not-found.tsx` passent au `Button` shadcn dans cette même tâche.
- [ ] **Step 2 : lancer le test.** Attendu : FAIL, avec la liste des restes.
- [ ] **Step 3 : supprimer.** `npm run typecheck` sert de vérification d'absence d'import.
- [ ] **Step 4 : vérifier.**
  - `npm run typecheck && npm run lint && npm test` passe.
  - `TEST_BASE_URL=http://localhost:3001 node tests/ui-audit.cjs` passe sur les 22 routes, aux trois largeurs et pour les six modales.
- [ ] **Step 5 : commit** `chore(ui): retrait des styles et composants remplacés`.

### Task 20: Documentation du design system (commit séparé)

**Files:**
- Modify : `docs/design-system/references/divergences.md` (sous « Décision utilisateur — 18 octobre 2026 », après D26)
- Modify : `docs/design-system/05-composants-ui.md` et `docs/design-system/13-correspondance-code.md`

- [ ] **Step 1 : rédiger les entrées.**
  - **D27 — Modales unifiées.** Radix, tailles 448/640/768/1024, en-tête et pied fixes, focus initial, garde de fermeture, retrait de l'ombre violette `#28123833`, du rayon de 15 px et du `<dialog>` natif.
  - **D28 — Composants de liste partagés.** SummaryStrip à 860 px, ListCard et ListTabs, barre d'outils à 40 px, cartes sous 900 px, FilterChip au style unique (y compris pour les statuts Ventes), SegmentedControl.
  - **D29 — États vides typés** (`first-use`, `no-results`, `error`, sans message générique).
  - **D30 — En-têtes fonctionnels sans eyebrow ni slogan**, primaire unique avec secondaires repliées sous 768 px, pas de « Retour » en premier niveau, dates `formatListDate`, montants alignés à droite, libellés de permissions.

  Chaque entrée indique : « aucune nouvelle couleur » avec la liste HEX, les fichiers concernés, les largeurs vérifiées (1440, 768 et 360 px) et ses limites (pas de vérification à 320 px, dark mode non traité, pas de données de démonstration pour certains états vides si c'est le cas).
- [ ] **Step 2 : mettre à jour 05 et 13** (API et chemins de chaque composant).
- [ ] **Step 3 : vérifier** que `node --test tests/docs-frontend-api.test.cjs` passe.
- [ ] **Step 4 : commit** `docs(design-system): D27–D30 composants partagés et modales unifiées`, avec uniquement les fichiers `docs/`.

### Task 21: Vérification finale

- [ ] **Step 1 : lancer** `npm run test:browser:isolated` en arrière-plan et noter le résultat de chaque suite. Les échecs préexistants du smoke test (lien Comptabilité ligne 25, déconnexion ligne 31) sont rapportés tels quels, et tout autre échec est traité avant de conclure.
- [ ] **Step 2 : lancer** `npm run build`. Attendu : succès.
- [ ] **Step 3 : préparer les preuves.** Captures finales de Ventes, Stock, Achats, Trésorerie, Comptabilité, Équipe et d'une modale à 1440, 768 et 360, rassemblées dans le dossier de notes partagé. Le compte rendu donne la liste des commits et les limites restantes.
