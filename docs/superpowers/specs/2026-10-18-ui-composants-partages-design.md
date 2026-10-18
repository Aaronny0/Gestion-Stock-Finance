# Audit UI/UX et composants partagés des écrans métier — spec

Date : 18 octobre 2026 · Statut : validé section par section en conversation, à relire avant plan.

## Intention

Les écrans métier de VORTEX n'ont pas tous la même interface : seuls Ventes et Stock (D26) suivent le gabarit Listes, et leurs motifs (bande de synthèse, carte de liste, puces, états vides) sont dupliqués entre leurs CSS modules. Le but est de :

1. corriger les imperfections UI/UX relevées sur chaque écran ;
2. factoriser ces motifs en composants réutilisables ;
3. migrer **tous** les écrans de liste vers ces composants ;
4. unifier les deux familles de modales sur Radix.

Critères de réussite :

- Un seul style par motif.
- Aucune nouvelle couleur.
- Aucun débordement horizontal à 1440, 768 et 360 px.
- Le pied de chaque modale reste visible.
- Les contrôles d'une même barre d'outils ont la même hauteur.
- Le registre des divergences est à jour (D27–D30).

Contraintes : AGENTS.md et docs/design-system font foi. Seules les valeurs HEX déjà appliquées par Ventes et approuvées par D26 sont autorisées (`#dde3e4`, `#eaefef`, `#586767`, `#f9f9fc`, `#0a1a1b`, `#007176`, accent `#dff2f2/#04585c`, warning `#fff2d6/#864900/#e8a127`, destructive `#9e1618`), en plus des tokens existants. La base de données est réinitialisable et aucune compatibilité arrière n'est requise. Les données métier, les permissions serveur et l'activation administrative ne changent pas.

Décisions de l'utilisateur, 18 octobre 2026 :

- Périmètre : composants partagés et migration de tous les écrans.
- Modales : approche A, tout sur Radix.
- Puces de statut Ventes au style Stock.
- Titres fonctionnels, sans eyebrow ni slogan, sur tous les écrans.
- Retrait des fichiers orphelins.
- Dates harmonisées avec Ventes.

## Inventaire des défauts (constaté sur `/demo`, 1440 / 768 / 360 px)

| Écran | Défauts |
|---|---|
| Ventes | Trois hauteurs de contrôles sur une ligne : puces 34 px, champs 42 px, Exporter 38 px. Bande de synthèse et état vide locaux. |
| Stock | Bande, onglets et puces dupliqués avec Ventes. À 768 px : barre d'outils sur 3 lignes avec « Exporter » seul, et table qui défile horizontalement. |
| Fiche produit | Bouton « Retour » en plus du fil d'Ariane, eyebrow « FICHE PRODUIT », 5 actions de même rang. État vide « modifiez vos filtres » sans filtre actif. |
| Réapprovisionnement | Titre « Stock & catalogue » sans onglet actif. |
| Achats, Troc, Rachat | Gabarit historique : eyebrow, slogan, période hors carte, contrôles de 34 à 38 px. Icône de l'état vide alignée à gauche sous un texte centré. Message générique « créez votre premier élément ». |
| Clients, Fournisseurs | Synthèse en 4e style (`.directory-summary`). Colonne « Détail / Voir › » redondante. Cases à cocher sans action groupée. |
| Trésorerie | Eyebrow et slogan. Cartes `MetricCard` tronquées à 360 px. Tables hors carte. En-tête « Montant » à gauche au-dessus de valeurs à droite. Dates ISO. |
| Dépenses, Paiements | `MetricCard`, dates ISO, état vide générique. |
| Comptabilité | « Retour » et fil d'Ariane « Détail » sur une page de premier niveau. Onglets en pastille. Période hors carte. En-têtes Débit/Crédit à gauche. Cartes tronquées à 360 px. Dates ISO. |
| Équipe | Synthèse à icônes (`.team-summary`). Modèles de rôles affichant des clés techniques (`sales.read`). Pied de la modale « Inviter » hors écran. |
| Audit | Débordement horizontal de 12 px à 360 px (période). Période dans l'en-tête. |
| Statistiques | Onglets `.page-tabs` en pastille. `<select>` natifs empilés. Slogan. |
| Paramètres, Caisse | Eyebrow et slogan. |
| Dashboard | Préréglages de période en style local (`.presets`). |
| Crédits | Onglets Radix en pastille, cartes `Card` locales. |
| Modales | Deux familles aux rendus opposés (voir § Dialog). Pied qui défile dans les Dialog Radix. Focus initial sur la croix. « 1 unités ». Textarea « Motif » en demi-largeur à côté d'un vide. |

## Composants

Ils sont placés dans `src/components/`, avec un CSS module par composant. Chaque CSS module n'utilise que des tokens existants et les HEX D26.

### `SummaryStrip` / `SummaryItem` — `src/components/data-display/summary-strip.tsx`

```tsx
<SummaryStrip aria-label="Synthèse des ventes">
  <SummaryItem label="Montant net" value={12010000} currency="XOF" meta="sur la période" />
  <SummaryItem label="À réapprovisionner" value={2} tone="warning" icon={TriangleAlert}
               pressed={onlyLow} onPress={toggle} />
</SummaryStrip>
<SummaryStrip.Skeleton count={4} />
```

- `value` accepte un `ReactNode`. Avec `currency`, le nombre est formaté en chiffres tabulaires et la devise est affichée en petit.
- Avec `onPress`, la cellule devient un `<button aria-pressed>`.
- `tone` vaut `"default"` ou `"warning"`.
- Disposition : une ligne, puis 2 × 2 sous 860 px de largeur utile (container query). La dernière cellule impaire prend toute la largeur.
- Remplace : `.summary` de Ventes et de Stock, `MetricCard` + `.finance-summary`, `.team-summary`, les cartes de la fiche produit et des Crédits, `.directory-summary`, `.sales-ledger-summary`.

### `ListCard` / `ListTabs` — `src/components/data-display/list-card.tsx`

```tsx
<ListCard tabs={<ListTabs items={[{ href, label, count, tone }]} />}>
  <DataTable density="compact" toolbarStart={<PeriodFilter/>} filters={<FilterChips/>} />
</ListCard>
```

- `ListCard` est le conteneur : bordure `#dde3e4`, rayon 12 px, `container-type: inline-size`. Il porte une seule fois les surcharges de `DataTable` aujourd'hui dupliquées en `:global` dans sales.module.css et stock.module.css : en-têtes 11,5 px en majuscules, puces des badges, pagination tactile, et contrôles de la barre d'outils fixés à **40 px**.
- `ListTabs` prend des `items` à `href` (liens, `aria-current="page"`) ou à `value` avec `onValueChange` (`role="tablist"` / `tab`, flèches clavier). Les onglets sont soulignés (44 px, actif `#007176`), avec un compteur et une variante warning.
- `DataTable` reçoit deux props additives :
  - `density: "compact" | "comfortable"` : lignes de 52 px par défaut, 60 px pour Ventes (D06) ;
  - `toolbarStart?: ReactNode` : période ou segmenté placé dans la barre d'outils, avant la recherche.
- `mobileCards` : sous 900 px de largeur utile, la liste passe en lignes-cartes, comme Ventes. Stock l'utilise aussi.

### `FilterChip` et `SegmentedControl` — `src/components/ui/filter-chip.tsx`, `segmented-control.tsx`

- `FilterChip` : `pressed`, `onPressedChange`, `count?`, `tone?: "warning"`, `icon?`. Il se rend en `<button aria-pressed>` de 40 px, rayon 8 px. Actif : `#dff2f2` / `#04585c` ; avertissement : tokens warning. C'est le style unique, y compris pour les statuts de Ventes.
- `SegmentedControl` : `options: { value, label }[]`, `value`, `onValueChange`, `aria-label`. Il se rend en groupe de boutons `aria-pressed` de 40 px. Il remplace `.period` (Ventes) et `.presets` (Dashboard).

### `EmptyState` — `src/components/data-display/empty-state.tsx` (étendu)

```tsx
<EmptyState kind="no-results" title="Aucun achat sur cette période" onClearFilters={clear} />
<EmptyState kind="first-use" title="Votre catalogue est vide" description="…"
            actions={<>…</>} steps={[{ title, description }]} />
```

- `kind` vaut `"first-use"`, `"no-results"` ou `"error"`.
- L'icône est centrée au-dessus du titre. L'icône par défaut dépend de `kind` : `Inbox`, `SearchX` ou `TriangleAlert`.
- `onClearFilters` ajoute le bouton « Effacer les filtres ». `no-results` n'est affiché que si un filtre est actif ; sinon l'écran affiche `first-use`.
- Chaque écran fournit son propre texte, et le message générique disparaît.
- Remplace : l'`EmptyState` de ui.tsx (`.empty-state`), `.empty` de Stock, `.state` de Ventes (l'erreur passe en `kind="error"`).

### `PageHeader` — `src/components/layout/page-header.tsx`

```tsx
<PageHeader title="Achats" description="…" primaryAction={<Button>…</Button>}
            secondaryActions={[{ label, icon, onSelect, disabled? }]} />
```

- La prop `eyebrow` est supprimée.
- Les actions secondaires sont des boutons outline de 40 px. Sous 768 px, elles sont regroupées dans un menu « ⋯ » de 44 px, à gauche de la primaire.
- Le titre est fonctionnel, c'est-à-dire le nom de l'écran (« Achats », « Comptabilité », « Trésorerie & caisse »). La description garde une phrase utile.
- Une page de premier niveau n'a pas de bouton « Retour », c'est le fil d'Ariane qui sert de repère. La fiche produit garde son fil d'Ariane, qui pointe vers Stock.

## Dialog unifié (Radix)

`src/components/ui/dialog.tsx` :

- `DialogContent` prend `size: "sm" | "md" | "lg" | "xl"`, soit 448, 640, 768 et 1024 px (`md` par défaut). Ces tailles remplacent les `max-w-*` passés au cas par cas.
- La mise en page est une colonne `flex` de hauteur maximale `min(100dvh − 32px, 90dvh)`, safe-area comprise :
  - `DialogHeader` : titre 18 px, description, filet bas `#eaefef`, place réservée à la croix ;
  - `DialogBody` : seule zone qui défile, classe `.scroll-hint` (D25) ;
  - `DialogFooter` : filet haut, toujours visible. Sous 640 px, les boutons sont empilés pleine largeur, primaire en haut.
- Le bouton fermer fait 44 × 44 et sert de repère dans l'en-tête.
- À l'ouverture, le focus va au premier champ (`onOpenAutoFocus`), sinon au contenu, jamais à la croix.
- `useReturnFocus()` mémorise l'élément actif à l'ouverture et y rend le focus à la fermeture, y compris pour les dialogues ouverts par état.
- Fond `foreground/35`, ombre `--shadow-dialog`, rayon 12 px.

Façades, dont les API ne changent pas pour les appelants :

- `Modal` (ui.tsx) : `{ title, onClose, children, size? }` rend un `Dialog` ouvert. Le verrou manuel `modalLocks` est supprimé.
- `ActionForm` (forms.tsx) : `DialogBody` / `DialogFooter` et `Button` shadcn remplacent `.modal-body`, `.modal-foot` et `.button`. La garde `discard()` est appelée sur `onOpenChange(false)`, `onEscapeKeyDown` et `onPointerDownOutside` : un formulaire modifié ne se ferme pas sans confirmation.
- `ConfirmDialog` devient un `AlertDialog`.
- Les Dialog et AlertDialog existants (refund, receipt, import, écritures, équipe, finance, boutique, audit, onboarding, admin) passent sur `size` et sur `DialogBody`.

Retraits :

- CSS `.modal*` de legacy/forms.css, navigation.css, responsive.css et print.css (les règles d'impression sont portées sur le reçu Radix).
- `dialog:modal { margin: auto }` de base.css, au lot où le dernier `<dialog>` natif disparaît. Ce correctif n'est pas encore commité dans la copie de travail : l'utilisateur en décide, et son retrait lui sera signalé.
- Fichiers orphelins de src/frontend : returns.tsx, import-stock.tsx, accounting-page.tsx, settings.tsx, workflows.tsx.

Corrections de contenu : accord du pluriel (« 1 unité ») ; « Motif / commentaire » en pleine largeur.

## Harmonisations transverses

- Dates des listes au format de Ventes (`18 oct.`, plus l'heure si utile), via un helper `formatListDate` extrait du formatage inline de `src/features/sales/sales-table.tsx` (≈ l.50) vers `src/lib/`.
- En-têtes des colonnes numériques alignés à droite, avec `meta.align: "right"` déjà disponible.
- Équipe : les modèles de rôles affichent les libellés de permissions déjà utilisés dans la modale « Inviter », pas les clés.
- Clients et Fournisseurs : la colonne « Détail » est supprimée, la ligne entière ouvre le détail. Les cases à cocher sont retirées faute d'action groupée.

## Ordre de migration

Un commit par lot. Chaque lot est vérifié à 1440, 768 et 360 px avant le suivant.

1. **Fondations modales** : Dialog, façades, retrait du CSS `.modal`.
2. **Composants** : SummaryStrip, ListCard/ListTabs, FilterChip, SegmentedControl, EmptyState, PageHeader, props `DataTable`.
3. **Ventes + Stock** (fiche produit, Réappro) : aucun changement visuel hors puces Ventes et lignes-cartes Stock sous 900 px.
4. **Annuaire** : Achats, Troc, Rachat, Clients, Fournisseurs (pages.tsx quitte le `DataTable` legacy).
5. **Finance** : Trésorerie, Dépenses, Paiements, Crédits.
6. **Comptabilité + Statistiques**.
7. **Administration et reste** : Équipe, Audit, Paramètres, Dashboard (préréglages), Caisse (en-tête).
8. **Nettoyage** : MetricCard, `.finance-summary`, `.team-summary`, `.directory-summary`, `.sales-ledger-summary`, CSS legacy morts, `DataTable` / `EmptyState` de ui.tsx, orphelins.

## Tests et vérification

**`tests/ui-components.test.cjs`** (`node --test`, ajouté à `npm test`). Il vérifie :

- la présence et les attributs ARIA des composants ;
- la container query de SummaryStrip ;
- l'absence, dans `src`, de `<dialog`, `modal-foot`, `eyebrow=`, `finance-summary` et `MetricCard` (après le lot 8) ;
- que les nouveaux CSS modules ne contiennent que des HEX de la liste D26.

**`tests/ui-audit.cjs`** (Playwright, ajouté à `test:browser`). Sur 22 routes `/demo` à 1440, 768 et 360 px, il échoue si :

- `scrollWidth > clientWidth` ;
- une barre d'outils de ListCard mêle plusieurs hauteurs de contrôles.

Sur 6 modales, il vérifie :

- qu'elles sont centrées ;
- que leur pied est dans le viewport ;
- que le focus initial n'est pas sur la croix ;
- que le focus revient au déclencheur.

**À chaque lot** : `npm run typecheck`, `npm run lint`, `npm test`, captures aux trois largeurs, contrôle clavier (Tab, Échap) des modales. En fin de chantier : `npm run test:browser:isolated`. Les échecs préexistants (smoke test : lien Comptabilité ligne 25, déconnexion ligne 31) sont rapportés tels quels.

## Documentation

`docs/design-system/references/divergences.md`, sous « Décision utilisateur — 18 octobre 2026 » :

- **D27** : modales unifiées ;
- **D28** : composants de liste partagés ;
- **D29** : états vides ;
- **D30** : en-têtes fonctionnels et harmonisations (dates, alignements).

Chaque entrée précise ses limites. Mettre aussi à jour 05-composants-ui.md et 13-correspondance-code.md. Le commit de documentation reste séparé des commits de code.

## Hors périmètre

Pages publiques et auth, dark mode (D14), contenus métier, permissions, API backend, nouvelles fonctionnalités (pas d'action groupée inventée).
