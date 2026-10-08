# Design System — VORTEX · Stock & Finance

Version 2.1 · octobre 2026. Remplace la direction « corail / minéral » (DESIGN.md v1), les tokens indigo provisoires, puis le violet de la v2.0.

Références visuelles : `Design System.dc.html`, `Auth.dc.html`, `Tableau de bord.dc.html`, `Ventes.dc.html`, `Rôles et écrans.dc.html`, `Sidebar alternative.dc.html`. Tokens prêts à intégrer : `handoff/tokens.css`.

## 0. Idée directrice — « Poste de pilotage »

Un commerce tech qui tourne toute la journée. Un **rail clair** légèrement teinté (la console, toujours là, jamais distrayante) et un plan de travail blanc où les chiffres se lisent d'un coup d'œil. Le **bleu pétrole** est le signal de l'action — et seulement de l'action. Rien de sombre en mode clair : le contraste vient de l'encre, pas des surfaces.

Trois questions auxquelles chaque écran répond en moins de 3 secondes (critère PRODUCT.md) :
1. Où suis-je ? (fil d'Ariane + titre)
2. Quelle boutique / période je pilote ? (barre de contexte, toujours visible)
3. Qu'est-ce qui mérite mon attention et quelle est l'action suivante ? (file « À traiter » + action primaire unique)

## 1. Sélection de la couleur de marque

- Historique : logo violet→magenta, DESIGN.md v1 corail, tokens indigo, v2.0 violet 285 (abandonné : rail trop sombre et trop saturé).
- Retenue : **bleu pétrole, hue OKLCH 200**, primary `#057176` (oklch(0.5 0.084 200)). Sobre, crédible pour la finance, distinct du vert succès (152) et du bleu info (240).
- Le logo reste violet pour l'instant : à recolorer en pétrole ou à passer en monochrome (recommandé) pour cohérence.
- Magenta (hue 350) conservé uniquement comme `chart-2` (marge brute).

## 2. Échelles générées (50–950)

| Pas | Marque | OKLCH | Neutre (teinté 200) |
|---|---|---|---|
| 50 | #eef9fa | oklch(0.975 0.012 200) | #f5f7f7 |
| 100 | #dbf3f4 | oklch(0.948 0.025 200) | #eaefef |
| 200 | #bce8ea | oklch(0.9 0.045 200) | #d9dfe0 |
| 300 | #90d6d9 | oklch(0.83 0.07 200) | #c1c9c9 |
| 400 | #48b7bd | oklch(0.72 0.1 200) | #9ca7a8 |
| 500 | #009298 | oklch(0.6 0.102 200) | #768384 |
| 600 | #057176 | oklch(0.5 0.084 200) | #576767 |
| 700 | #045b5f | oklch(0.43 0.072 200) | #435354 |
| 800 | #00464a | oklch(0.36 0.061 200) | #304142 |
| 900 | #003335 | oklch(0.29 0.05 200) | #1e2f30 |
| 950 | #011d1f | oklch(0.21 0.035 200) | #0e1b1c |

## 3. Tokens shadcn — light & dark

Voir `handoff/tokens.css` (copie intégrale à substituer à `src/styles/tokens.css`). Conserver les alias V1 (`--bg`, `--panel`, `--purple`…) en bas du `:root` tant que `src/styles/legacy/` existe (`--purple` pointe désormais sur `--primary`).

Changements de nommage : `--success-background` → `--success-muted` (+ `--success-muted-foreground`), idem warning / info / destructive. Alias temporaires pendant la migration.

Rail : `--sidebar` est **clair** en light (#eff6f6, élément actif #d2ecee + barre 3 px primary) et graphite en dark. Le dark mode n'est pas une inversion : surfaces élevées plus claires, primary éclairci (#3ebfc6) avec texte sombre.

## 4. Tokens sémantiques

Hues fixes, indépendantes de la marque : destructive 27, success 152, warning 75, info 240.

- **Solide** (`bg-success text-success-foreground`) : icônes, points d'état, boutons pleins.
- **Douce** (`bg-success-muted text-success-muted-foreground`) : badges de statut. **Variante par défaut.**
- Warning solide porte un texte **sombre**, jamais blanc.

## 5. Palette charts

| Token | Hex light | Rôle |
|---|---|---|
| chart-1 | #057176 | Métrique principale (chiffre d'affaires) |
| chart-2 | #d72f92 | Métrique secondaire liée (marge brute) |
| chart-3 | #d08300 | Mobile Money, période précédente |
| chart-4 | #2c965d | Espèces, encaissements |
| chart-5 | #3673cb | Carte / banque |

Ordre fixe ; au-delà de 5 séries → « Autres » en `muted-foreground`.

## 6. Tableau de contraste WCAG 2.2 AA

| Paire | Seuil | Light | Statut | Dark | Statut |
|---|---|---|---|---|---|
| foreground / background | 4.5:1 | 17.22:1 | PASS | 17.4:1 | PASS |
| card-foreground / card | 4.5:1 | 18.01:1 | PASS | 16.15:1 | PASS |
| primary-foreground / primary | 4.5:1 | 5.61:1 | PASS | 8.63:1 | PASS |
| secondary-foreground / secondary | 4.5:1 | 11.86:1 | PASS | 12.23:1 | PASS |
| muted-foreground / muted | 4.5:1 | 5.33:1 | PASS | 6.65:1 | PASS |
| muted-foreground / background | 4.5:1 | 5.68:1 | PASS | 7.8:1 | PASS |
| muted-foreground / card | 4.5:1 | 5.94:1 | PASS | 7.24:1 | PASS |
| accent-foreground / accent | 4.5:1 | 7.09:1 | PASS | 9.89:1 | PASS |
| primary / card | 4.5:1 | 5.77:1 | PASS | 8.09:1 | PASS |
| input / card | 3:1 | 3.62:1 | PASS | 3.27:1 | PASS |
| ring / background | 3:1 | 5.51:1 | PASS | 8.71:1 | PASS |
| destructive-foreground / destructive | 4.5:1 | 5.69:1 | PASS | 6.21:1 | PASS |
| destructive-muted-foreground / destructive-muted | 4.5:1 | 7.24:1 | PASS | 9.13:1 | PASS |
| destructive / card | 3:1 | 5.85:1 | PASS | 5.68:1 | PASS |
| success-foreground / success | 4.5:1 | 5.51:1 | PASS | 8.28:1 | PASS |
| success-muted-foreground / success-muted | 4.5:1 | 7.3:1 | PASS | 9.71:1 | PASS |
| success / card | 3:1 | 5.67:1 | PASS | 7.65:1 | PASS |
| warning-foreground / warning | 4.5:1 | 7.36:1 | PASS | 9.58:1 | PASS |
| warning-muted-foreground / warning-muted | 4.5:1 | 6.38:1 | PASS | 9.54:1 | PASS |
| info-foreground / info | 4.5:1 | 5.27:1 | PASS | 7.94:1 | PASS |
| info-muted-foreground / info-muted | 4.5:1 | 6.89:1 | PASS | 9.57:1 | PASS |
| info / card | 3:1 | 5.43:1 | PASS | 7.32:1 | PASS |
| chart-1 / card | 3:1 | 5.77:1 | PASS | 8.09:1 | PASS |
| chart-2 / card | 3:1 | 4.45:1 | PASS | 6.59:1 | PASS |
| chart-3 / card | 3:1 | 3.02:1 | PASS | 9.35:1 | PASS |
| chart-4 / card | 3:1 | 3.72:1 | PASS | 8.2:1 | PASS |
| chart-5 / card | 3:1 | 4.71:1 | PASS | 7.17:1 | PASS |
| sidebar-foreground / sidebar | 4.5:1 | 14.1:1 | PASS | 16.12:1 | PASS |
| sidebar-muted-foreground / sidebar | 4.5:1 | 5.43:1 | PASS | 8.02:1 | PASS |
| sidebar-primary / sidebar | 3:1 | 5.27:1 | PASS | 8.95:1 | PASS |
| sidebar-accent-foreground / sidebar-accent | 4.5:1 | 14.27:1 | PASS | 15.85:1 | PASS |
| sidebar-primary-foreground / sidebar-primary | 4.5:1 | 5.61:1 | PASS | 8.95:1 | PASS |

Corrections automatiques : light chart-3/card 2.75→3.02.

## 7. Typographie

- **Bricolage Grotesque** (600–700) : titres d'écran, montants héros, auth. Jamais en dessous de 20 px.
- **Geist** (400–600) : tout le reste de l'UI.
- **Geist Mono** : références (VTE-0142), IMEI, codes de compte. Pas pour les montants.
- Montants : Geist, `font-variant-numeric: tabular-nums`, devise en plus petit et en `muted-foreground` (« 1 284 500 XOF »).

| Rôle | Taille / interligne | Graisse |
|---|---|---|
| Montant héros | 44/48 display | 600 |
| Titre d'écran | 28/34 display | 600 |
| Titre de carte | 15/22 | 600 |
| Corps | 14/20 | 400 |
| Libellé / méta | 12/16 | 500 |
| Overline (sections du rail uniquement) | 11/16, +0.08em, capitales | 600 |

Les capitales espacées sont limitées au rail de navigation et aux en-têtes de colonnes de table. Pas d'eyebrow décoratif au-dessus de chaque titre.

## 8. Espace, rayon, élévation

- Grille 4 px. Échelle : 4, 8, 12, 16, 20, 24, 32, 40, 56.
- Gouttières de page : 16 (mobile) / 24 (tablette) / 32 (desktop). Gap entre cartes : 16.
- Rayons : contrôles 8, cartes 12, panneaux / dialogues 18. Badges en pilule.
- Élévation : **bordure `border` seule** sur les cartes. Ombre uniquement sur ce qui flotte (menus, dialogues, toasts). Jamais les deux.
- Cibles tactiles ≥ 44 px (boutons, lignes de liste, nav). Hauteur bouton : 40 desktop / 44 tactile.

## 9. Règles d'écran (toutes pages)

1. **Shell** : rail clair 248 px (72 replié) · barre de contexte 64 px (fil d'Ariane, boutique, période, notifications, utilisateur) · contenu max 1440 px.
2. **En-tête de page** : titre display + une ligne de description + **une seule action primaire** à droite. Actions secondaires en `outline`.
3. **Ordre de lecture** : état → attention → chiffres → détail. Ce qui demande une action passe avant ce qui informe.
4. **Le pétrole signale l'action** : bouton primaire, lien actif, focus, série principale. Une surface pétrole pleine par écran maximum.
5. **Chaque chiffre est cliquable** vers sa source filtrée (même période, même boutique).
6. **Tables** : en-têtes 12 px capitales `muted-foreground`, lignes 52 px, montants alignés à droite, statut en badge doux. Sous 768 px → liste de cartes compactes.
7. **États obligatoires** : chargement (squelettes de même forme), vide (phrase + action), erreur (message + réessayer), hors connexion (bandeau warning), accès réservé.
8. **Démo** : bandeau `info-muted` sous la barre de contexte, toujours visible, avec sélecteur de rôle.
9. **Mouvement** : 120–200 ms, `ease-out`, uniquement pour signaler un changement d'état. Désactivé sous `prefers-reduced-motion`.

## 10. Règles du tableau de bord (écran prioritaire)

Structure de haut en bas :
1. **Salutation + contexte** : « Bonjour Alex » + date + puce boutique/période. Action primaire « Nouvelle vente », secondaire « Entrée de stock ».
2. **File « À traiter »** (si non vide) : cartes horizontales, une par sujet (stock bas, caisses ouvertes, crédits clients échus, invitations). Chaque carte = compteur + verbe d'action. Masquée si vide, remplacée par une ligne « Rien d'urgent ».
3. **Bande performance** : CA en montant héros + variation vs période précédente (badge doux success/destructive) + 3 indicateurs (Encaissements, Cashflow net, Marge brute*). *Masqué sans `analytics.cost_margin_read`.
4. **Activité** (2/3) : histogramme CA/jour, marge en superposition ; clic sur une barre → ventes du jour. **Caisses & paiements** (1/3) : état des caisses par boutique + répartition Espèces / Mobile Money / Carte.
5. **Dernières ventes** (2/3) + **Stock critique** (1/3).
6. **Mise en route** : checklist repliable, uniquement pour `settings.manage` tant qu'elle n'est pas complète — en haut si < 2 étapes faites, sinon en bas.

Rappel permanent : « Le chiffre d'affaires n'est pas le bénéfice » vit en infobulle sur le libellé CA, pas en encadré.

## 11. Auth

- Split 5/7 : panneau identité clair (`sidebar`) avec logo, promesse et ticket de caisse illustré (vente → stock à jour) ; formulaire sur fond `background`.
- Sous 960 px : le panneau disparaît, logo + nom en haut du formulaire.
- Formulaire max 400 px, champs 44 px, libellés au-dessus, erreurs sous le champ en `destructive`, une alerte globale au-dessus du bouton.
- Inscription : stepper 4 étapes visible (Compte · Entreprise · Boutique · Récap), « Retour » secondaire à gauche.
- Démo toujours accessible depuis /login, sous la ligne de séparation.

## 12. Étendre la palette

Nouveau token = choisir une hue hors des réservées (27, 75, 152, 240, 285, 350) ou dériver de l'échelle marque/neutre ; vérifier 4,5:1 (texte) ou 3:1 (graphique) en light ET dark ; ajouter le mapping `--color-x` dans `@theme inline` ; documenter ici.

## 13. Rôles et écrans

Référence visuelle : `Rôles et écrans.dc.html`. Source de vérité : `rolePermissions` (src/frontend/types.ts) et `navigation.ts`.

| Rôle | Accueil | Écrans visibles |
|---|---|---|
| Propriétaire (owner) | Vue d’ensemble `/` | Tous (17) + vue « Toutes les boutiques » sur `/` et `/analytics` |
| Responsable (manager) | Vue d’ensemble `/` | Tous sauf Équipe, Audit, Paramètres |
| Caissier / vendeur (cashier) | Caisse `/pos` | Caisse, Ventes, Stock (lecture), Troc, Rachat, Clients, Trésorerie (sa caisse) |
| Gestionnaire de stock (stock) | Stock `/stock` | Stock, Achats, Fournisseurs |
| Comptable (accountant) | Comptabilité `/accounting` | Achats, Fournisseurs, Trésorerie (lecture), Dépenses, Paiements, Comptabilité |

Règles :
1. Pas de permission d’écran → l’entrée disparaît du rail. Par URL directe → carte « Accès réservé » + bouton « Retour à mon espace » (accueil du rôle).
2. Permission fine absente → on **masque** la colonne, le chiffre ou l’action. On ne grise pas sans explication.
3. Exceptions où l’on montre un état bloqué avec message : vente sous le coût, remise au-delà du plafond (« Demander une validation »).
4. L’accueil de chaque rôle suit la même anatomie que le tableau de bord : contexte → à traiter → chiffres → détail.

Permissions fines et leur effet :
- `analytics.cost_margin_read` : marge brute (KPI, série chart-2, encart du détail de vente).
- `stock.cost.read` : colonne coût d’achat, valeur de stock au coût.
- `sales.refund` : bouton « Retour client » (ghost destructive) du détail de vente.
- `sales.change_price`, `sales.discount_above_limit`, `sales.sell_below_cost` : contrôles de prix/remise de la caisse.
- `cash.manual_movement` : « Mouvement manuel » en Trésorerie.
- `exports.create` : bouton Exporter + cases de sélection de toutes les listes.
- `accounting.close_period` : « Clôturer la période ».

## 14. Guide pour développer un nouvel écran

Écrans de référence : `Tableau de bord.dc.html` (écran de pilotage) et `Ventes.dc.html` (écran liste, tweak `annotate` pour voir les blocs A–E). Tout nouvel écran part de l’un des deux.

Écran liste (Stock, Clients, Achats, Fournisseurs, Dépenses, Paiements, Audit, Journal comptable) :
- **A · PageHeader** — titre + description + une action primaire filtrée par permission.
- **B · SummaryStrip** — 3–4 totaux de la liste filtrée.
- **C · FilterBar** — recherche, période, puces de statut avec compteurs, Exporter (si `exports.create`). Filtres dans l’URL.
- **D · DataTable / mobileRow** — lignes 60 px cliquables ; < 900 px de largeur utile → cartes 76 px ; états squelette / vide / erreur.
- **E · DetailSheet** — panneau latéral 460 px, la liste reste en contexte ; actions en pied.

Écran de pilotage (accueils de rôle, Analyses, Trésorerie) : reprendre l’anatomie du tableau de bord (§10).

Checklist avant livraison d’un écran :
- [ ] Le titre dit où l’on est, la boutique et la période sont visibles.
- [ ] Une seule action primaire pétrole.
- [ ] Chaque élément sensible est conditionné à sa permission (vérifier les 5 rôles).
- [ ] Les 5 états : chargement, vide, erreur, hors connexion, accès réservé.
- [ ] Montants tabulaires alignés à droite, devise en muted.
- [ ] Statuts en badge doux, libellés de `StatusBadge` (Payée, À crédit, Retour partiel, Remboursée…).
- [ ] Rendu vérifié à 375 px, 768 px et 1440 px.
- [ ] Aucune couleur hors tokens ; contraste vérifié si nouveau token.
