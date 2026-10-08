# Navigation, contexte et permissions

Sources : [DESIGN.md §9 et §13](references/claude-original/DESIGN.md), [Rôles et écrans](references/claude-original/R%C3%B4les%20et%20%C3%A9crans.dc.html), `src/frontend/navigation.ts` et `src/frontend/types.ts`.

Rail en sections Pilotage, Opérations, Finance, Administration. Toujours rendre la boutique et la période compréhensibles, le fil d’Ariane, les notifications et l’utilisateur/rôle. Depuis l’approbation du 9 octobre 2026 : double rail312/68 (68 + 244), barre64 : voir [layout](04-espacements-et-layout.md).

| Rôle | Accueil prévu par Claude | Visibilité prévue |
| --- | --- | --- |
| owner | Vue d’ensemble / | Tous + Toutes les boutiques sur / et /analytics |
| manager | Vue d’ensemble / | Tous sauf Équipe, Audit, Paramètres |
| cashier | Caisse /pos | Caisse, Ventes, Stock lecture, Troc, Rachat, Clients, sa Trésorerie |
| stock | Stock /stock | Stock, Achats, Fournisseurs |
| accountant | Comptabilité /accounting | Achats, Fournisseurs, Trésorerie lecture, Dépenses, Paiements, Comptabilité |

Ces chemins de maquette ne sont pas tous les URLs publiques exactes : le frontend ajoute les préfixes `/app` ou `/demo`, et `/` sans session correspond au site public. `canonical()` retire ces préfixes et applique les alias `/dashboard`, `/ventes`, `/troc`, `/rachat`, `/finance`, `/statistiques`, `/historique`, `/roles`. Les règles d’accès et l’accueil effectif restent ceux du code et du backend.

Sans permission écran : masquer l’entrée du rail ; URL directe : carte « Accès réservé » + retour à l’accueil du rôle. Permission fine absente : masquer colonne/chiffre/action, plutôt que bouton grisé inexpliqué. Exceptions motivées : vente sous coût, remise au-delà du plafond → demander validation. Le serveur revalide toujours ; le design ne crée aucun droit.

| Permission fine | Effet UI attendu |
| --- | --- |
| analytics.cost_margin_read | KPI marge, chart-2, détail de vente |
| stock.cost.read | Coût d’achat, valorisation au coût |
| sales.refund | Retour client du détail de vente |
| sales.change_price / sales.discount_above_limit / sales.sell_below_cost | Contrôles prix/remise caisse |
| cash.manual_movement | Mouvement manuel |
| exports.create | Exporter et sélection des listes |
| accounting.close_period | Clôturer la période |

Le manager courant exclut aussi fiscal.manage et accounting.close_period. Le comptable n’a pas cash.open_close dans rolePermissions. La lecture de Trésorerie est autorisée par finance.read ; ses actions d’ouverture/clôture restent conditionnées par cash.open_close. Aucun élargissement de permission.

`Sidebar alternative.dc.html`, initialement **Proposition B**, est explicitement approuvée le 9 octobre 2026 : sections en icônes et panneau,312 px ouverts/68 repliés, caisse persistante et liens contextuels. La capture jointe à la demande utilisateur est l’arbitrage D18. Le clic de section change le panneau ; un lien ouvre l’écran. ⌘/Ctrl K ouvre la recherche des écrans, ventes et IMEI chargés, N ouvre la caisse de vente, G puis D rejoint le dashboard, hors champs de saisie. La clôture rejoint le processus existant de rapprochement ; aucun bouton ne clôture une caisse sans validation métier.
