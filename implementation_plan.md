# ES STORE — 11 Corrections & Améliorations

Ce plan couvre les 11 points d'amélioration demandés, organisés par fichier/composant.

## User Review Required

> [!IMPORTANT]
> **Point 3 (Suppression de produits)** : La stratégie choisie est le **soft-delete** (archivage) pour les produits liés à des ventes/trocs, avec suppression physique uniquement pour les produits sans historique. L'approche actuelle dans [stock/page.tsx](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/stock/page.tsx) tente déjà cela mais utilise un mauvais order d'opérations — il essaie d'abord le DELETE avant de fallback sur le soft-delete. Je vais inverser pour toujours faire un soft-delete propre avec message explicite.

> [!IMPORTANT]
> **Point 1 (Audit)** : Le système d'audit sera implémenté côté client (logging dans une table Supabase `audit_logs`). Cela suppose que vous avez un accès pour créer cette table depuis le SQL Editor de Supabase. Sinon on peut logger côté client uniquement.

> [!WARNING]
> **Point 8 (Valeur Marchande Estimée Boutique)** : Le prix renseigné dans le champ "Valeur Marchande Estimée Boutique" remplacera le prix de vente du produit **uniquement pour cette transaction de troc**, il ne modifiera pas le prix initial dans le stock. C'est le prix utilisé pour calculer la recette du jour.

---

## Proposed Changes

### Charts

#### [MODIFY] [DashboardChart.tsx](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/components/charts/DashboardChart.tsx)
**Point 2** : Changer les couleurs — Ventes = `#22c55e` (vert) / Trocs = `#8B4513` (brun/saddle brown). Utiliser ces couleurs absolues (hardcoded) pour qu'elles restent visibles en mode clair et sombre.

---

### Stock

#### [MODIFY] [stock/page.tsx](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/stock/page.tsx)
- **Point 3** : [confirmDelete()](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/stock/page.tsx#170-207) → toujours faire un soft-delete (`active = false, quantity = 0`) au lieu de tenter un DELETE physique. Le message s'adapte selon qu'il y a des ventes/trocs liées ou non.
- **Point 7** : Ajouter un ⚠️ emoji devant les produits dont `quantity === 0` dans le tableau (en plus du badge danger existant). Modifier le filtre `loadData` pour inclure les produits avec `quantity = 0` (actuellement filtré par `.gt('quantity', 0)` dans ventes mais PAS dans stock — le stock charge déjà tous les produits actifs).

---

### Ventes

#### [MODIFY] [ventes/page.tsx](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/ventes/page.tsx)
- **Point 4** : Le filtre date doit s'initialiser automatiquement à la date du jour : `const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))`. Après clôture, mettre `dateFilter` à la date du lendemain et recharger les données (compteur revient à 0 car pas encore de ventes le lendemain).

---

### Troc

#### [MODIFY] [troc/page.tsx](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/troc/page.tsx)
- **Point 5** : Filtrer l'historique pour ne montrer que les trocs du jour courant (la requête loadData ajoute un filtre `.gte('created_at', todayStart).lte('created_at', todayEnd)` sur les trades).
- **Point 8** : Calculer le `trade_gain` en utilisant `shopPhoneValue` (Valeur Marchande Estimée Boutique) comme prix de vente effectif si renseigné, sinon utiliser `shopPrice` (prix initial du stock). Stocker le prix de vente effectif utilisé pour la recette.
- **Point 11** : Ajouter un filtre par catégorie/marque (dropdown) sur la section du formulaire de sélection de produits, et permettre la recherche par nom/modèle (le combobox existe déjà — il faut ajouter un filtre marque en amont).

---

### Rachat

#### [MODIFY] [rachat/page.tsx](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/rachat/page.tsx)
- **Point 9** : Aucune modification nécessaire ici — les rachats ne sont pas inclus dans la recette déjà (ils n'apparaissent ni dans `sales` ni dans `trades`). Il faut vérifier que la page Finance ne les inclut pas → confirmé : [finance/page.tsx](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/finance/page.tsx) calcule la recette à partir de `sales` + `trades` uniquement. **Aucune modification.**

---

### Finance

#### [MODIFY] [finance/page.tsx](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/finance/page.tsx)
- **Point 8 (suite)** : Modifier le calcul de la recette pour utiliser `shop_phone_value` (si renseigné) au lieu de `client_complement` seul pour les trocs. La recette d'un troc = `shop_phone_value || shop_phone_price` (le prix de vente effectif du téléphone boutique).
- **Point 9** : Confirmer que les rachats sont exclus → déjà le cas.
- **Point 10** : Le semestre est correctement calculé (janv-juin / juil-déc). Les autres périodes utilisent date-fns qui est fiable. Ajouter un affichage de la plage de dates effective sous les tabs pour plus de clarté.

---

### Historique (Nouveau module)

#### [NEW] [historique/page.tsx](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/historique/page.tsx)
- **Point 6** : Nouvelle page centralisée avec 3 filtres (Ventes / Trocs / Rachats + "Tous"). Charge les données de `sales`, `trades` et `buybacks`. Affiche avec filtre par date et filtre par type.

---

### Sidebar

#### [MODIFY] [Sidebar.tsx](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/components/Sidebar.tsx)
- **Point 6** : Ajouter l'entrée "Historique" dans le menu de navigation avec l'icône `FiClock`.

---

### Header

#### [MODIFY] [Header.tsx](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/components/Header.tsx)
- **Point 6** : Ajouter le titre "Historique" dans `pageTitles`.

---

### Audit (Nouveau système)

#### [MODIFY] [stock/page.tsx](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/stock/page.tsx) (déjà listé)
#### [MODIFY] [troc/page.tsx](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/troc/page.tsx) (déjà listé)
- **Point 1** : Créer une fonction utilitaire `logAudit(action, entity, entityId, details)` dans `lib/audit.ts`. L'utiliser dans [saveEdit](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/stock/page.tsx#149-169), [confirmDelete](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/stock/page.tsx#170-207) (stock), et [handleTrade](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/troc/page.tsx#346-390) (troc) pour enregistrer les modifications et suppressions.

#### [NEW] [lib/audit.ts](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/lib/audit.ts)
- Fonction `logAudit` qui insère dans la table `audit_logs` (Supabase) : `{ action, entity_type, entity_id, details, created_at }`.

---

### Dashboard

#### [MODIFY] [page.tsx (dashboard)](file:///c:/Users/PEAQ/Documents/DEV/ES%20STORE/src/app/page.tsx)
- **Point 8** : Le `recetteToday` doit utiliser le prix de vente effectif des trocs (avec `shop_phone_value`).

---

## Verification Plan

### Build automatique
```bash
pnpm run build
```
Vérifie qu'il n'y a aucune erreur TypeScript ou de compilation.

### Vérification visuelle en navigateur
1. Ouvrir `http://localhost:3000` → Dashboard → vérifier couleurs du graphe (vert + brun)
2. Stock → vérifier ⚠️ sur produits à 0 quantity, tester suppression
3. Ventes → vérifier date auto-remplie, tester clôture
4. Troc → vérifier historique du jour seulement, tester Valeur Marchande Estimée Boutique  
5. Historique → vérifier les 3 filtres (Ventes/Trocs/Rachats)
6. Finance → vérifier les périodes et la recette du jour
7. Mode clair / mode sombre → vérifier les couleurs du graphe restent visibles
