# VORTEX — Stabilisation de la refonte

Date : 25 septembre 2026.

## Périmètre livré

Les phases métier déjà présentes dans le dépôt sont conservées. Cette passe termine la stabilisation du socle et de leur intégration ; elle ne réécrit ni le backend, ni les contrats API, ni les règles de permissions.

- Palette indigo restaurée, couleurs sémantiques centralisées ; texte secondaire assombri pour atteindre le contraste de 4,5:1 sur le fond de page.
- `globals.css` réduit à 14 lignes de couches et d’imports. Les styles encore utilisés sont répartis par responsabilité dans `styles/legacy`, avant les utilities Tailwind ; les anciennes copies non importées sont supprimées. Les règles d’impression sont isolées.
- `Money` respecte la devise de l’organisation et le format existant en unités mineures. Une organisation EUR ne voit plus ses montants présentés en FCFA.
- `DataTable` restaure la pagination après un aller-retour vers un détail, exporte la sélection filtrée, annonce le tri et laisse la barre d’espace activer une case sans ouvrir sa ligne.
- Menu mobile : restitution du focus au bouton déclencheur après fermeture.
- Dialogues limités à la hauteur disponible et défilables, fermeture nommée, contrôles mobiles partagés d’au moins 44 px. Les champs comptables Débit/Crédit et Journal sont nommés pour les lecteurs d’écran.
- Impression du reçu : suppression du décalage hérité du centrage du dialogue et isolation du contenu imprimable.
- Tests navigateur adaptés aux composants migrés, avec attentes de navigation explicites et sélecteurs distinguant tableaux, cartes et menus.

## Dépendances

Aucune dépendance ajoutée ou supprimée par cette stabilisation. Le lockfile actuel est synchronisé : `pnpm install --frozen-lockfile --ignore-scripts` a réussi. Playwright et Chromium proviennent du runtime de QA déjà disponible sur la machine ; aucun paquet de test navigateur n’a été ajouté au projet.

## Validation

- TypeScript : réussi.
- ESLint : réussi, aucun avertissement.
- Tests métier : 24/24 réussis.
- Build de production Next.js : réussi.
- Matrice responsive : 396 visites (44 routes × 9 dimensions), aucune anomalie de débordement ni erreur JavaScript détectée.
- Matrice complémentaire : 51 visites (tableau de bord, caisse, stock × 17 dimensions), aucun débordement de document détecté.
- Smoke navigateur : 14 contrôles réussis (stock, vente, reçu imprimable, comptabilité, permissions et erreurs API).
- UX : 11 contrôles réussis ; 7 paires sémantiques au-dessus de 4,5:1, dont texte secondaire 5,28:1.
- Parcours responsive : 53 contrôles réussis, dont 17 dialogues à 360 × 800, 820 × 1180 et 844 × 390 ; 45 visites supplémentaires sans débordement.
- Navigation : 20 contrôles réussis (menus, focus, retour, recherche, garde du panier et quatre rôles).
- Régressions ciblées : 3/3 réussies (devise EUR, activation clavier d’une case, restauration de la page 2).

Les tests utilisent le mode démonstration ou une API interceptée avec des fixtures isolées. Ils ne constituent pas une validation d’un backend réel. Les zones explicitement défilables (tableaux/onglets) ne sont pas assimilées à un débordement du document.

## Matrice de dimensions

« Validé » désigne le contrôle automatique indiqué, pas une certification visuelle ou d’accessibilité exhaustive. Des captures du stock, de la caisse et du reçu ont aussi été inspectées. A = 44 routes, contrôle du document et des éléments ; B = tableau de bord/caisse/stock, contrôle du document avec mouvement réduit.

| Dimension | Statut | Couverture |
| --- | --- | --- |
| 240 × 320 | Non testé | Sous le minimum de 320 px du périmètre demandé |
| 280 × 653 | Non testé | Sous le minimum de 320 px du périmètre demandé |
| 320 × 568 | Validé | A |
| 360 × 640 | Validé | B |
| 375 × 812 | Validé | B |
| 390 × 844 | Validé | A |
| 412 × 915 | Validé | B |
| 430 × 932 | Validé | A |
| 600 × 960 | Validé | B |
| 768 × 1024 | Validé | A |
| 820 × 1180 | Validé | A |
| 912 × 1368 | Validé | B |
| 1024 × 600 | Validé | B |
| 1024 × 695 | Validé | B |
| 1034 × 695 | Validé | B |
| 1040 × 695 | Validé | B |
| 1180 × 800 | Validé | B |
| 1279 × 800 | Validé | B |
| 1280 × 720 | Validé | B |
| 1366 × 768 | Validé | B |
| 1440 × 900 | Validé | B |
| 1536 × 864 | Validé | B |
| 1920 × 1080 | Validé | B |
| 2560 × 1440 | Validé | B |

Autres dimensions A : 360 × 800, 1024 × 768, 1180 × 820, 844 × 390 (paysage).

Composition conservée : cartes et tri compact sous 768 px, tableaux au-dessus ; navigation latérale à partir de 1024 px, menu compact en dessous. Les dialogues défilent dans la hauteur disponible, y compris en paysage à 390 px de haut.

Variantes couvertes : navigation clavier ciblée, tactile émulé, retour aux listes, tri et pagination, dialogues et tiroir de caisse, succès d’encaissement et retour produit, mouvement réduit dans la matrice B. Restent non vérifiés : zoom natif 125/150/200 %, police système augmentée, allongement généralisé des textes de 30 %, médias lents/absents et matrice exhaustive des erreurs API. Le mode tactile émulé ne remplace pas un appareil physique.

## Inventaire de cette passe

Créé : `tests/design-system-regressions.cjs`.

### Modifiés

- `README.md`
- `docs/FINAL_STABILIZATION.md`
- `docs/design-system.md`
- `package.json`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/data-display/data-table.tsx`
- `src/components/data-display/money.tsx`
- `src/components/layout/app-sidebar.tsx`
- `src/components/layout/mobile-navigation.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/textarea.tsx`
- `src/features/accounting/entry-editor.tsx`
- `src/features/audit/audit-page.tsx`
- `src/features/pos/product-card.tsx`
- `src/frontend/pages.tsx`
- `src/styles/base.css`
- `src/styles/legacy/auth.css`
- `src/styles/legacy/controls.css`
- `src/styles/legacy/data.css`
- `src/styles/legacy/forms.css`
- `src/styles/legacy/navigation.css`
- `src/styles/legacy/refinements.css`
- `src/styles/legacy/responsive.css`
- `src/styles/print.css`
- `src/styles/tokens.css`
- `tests/browser-smoke.cjs`
- `tests/browser-ux.cjs`
- `tests/navigation-responsive.cjs`
- `tests/responsive-matrix.cjs`
- `tests/responsive-workflows.cjs`
### Supprimés (copies CSS non importées)

- `src/styles/legacy/base.css`
- `src/styles/legacy/dashboard.css`
- `src/styles/legacy/finance.css`
- `src/styles/legacy/pos.css`
- `src/styles/legacy/shell.css`

## Limites et suite recommandée

Les écrans Auth, Analytics, Troc, Rachat, Achats, Fournisseurs, Clients et plusieurs formulaires restent partiellement dans `src/frontend`. Leurs styles actifs sont conservés : les supprimer casserait des parcours. La migration progressive peut continuer depuis ce socle stabilisé, puis être validée sur une instance API de recette avec les rôles et données représentatifs.

Les captures et rapports JSON locaux se trouvent dans `output/frontend-qa` et `output/responsive-qa` (artefacts de QA non versionnés). Aucun déploiement ni commit n’a été effectué.
