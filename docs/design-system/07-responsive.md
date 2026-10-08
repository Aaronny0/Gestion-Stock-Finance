# Responsive

Sources : [DESIGN.md §8–11 et §14](references/claude-original/DESIGN.md), ResizeObserver dans les maquettes Auth et Ventes. Les seuils ci-dessous portent sur des contextes différents.

| Contexte | Règle source | Code actuel |
| --- | --- | --- |
| Auth | Deux panneaux à partir de960 px ; dessous logo + formulaire | CSS max959 ; ajustements max480 ; maxform400 |
| Table générale | Sous768 px : cartes compactes | DataTable mobileRow md:hidden / hidden md:block |
| Ventes | Largeur utile <900 px : cartes76 px ; sinon lignes60 | Maquette ResizeObserver sur contenu ; pas équivalent à un viewport900 |
| Shell | Gouttières16/24/32 ; rail repliable | lg:flex à1024 ; mobile drawer/barre inférieure en dessous |
| Détail | 460 px limité à100vw | Vérifier Sheet/Drawer et styles consommateurs |
| Validation Claude | 375,768,1440 px | Auth récemment testé320,360,390,768,959,960,1024,1440 |

Ne pas inventer une grille de breakpoints universelle à partir d’une maquette desktop. La navigation mobile et les priorités d’action doivent rester utilisables : noms, boutique, montants et statut lisibles ; actions tactiles44 px ; pas de débordement horizontal de page. Un tableau complexe peut avoir sa région défilante explicitement accessible, mais la maquette demande une représentation compacte pour les listes métier.

Vérifier portrait/paysage, clavier virtuel, contenu long, zoom et reflow ; aucune troncature de montant critique ou perte de CTA. Réduire les colonnes selon pertinence et permission, jamais supprimer une donnée sensible seulement parce que l’écran rétrécit : elle doit aussi être protégée sur desktop.

Tester chaque seuil de part et d’autre et distinguer largeur viewport / largeur utile après rail. Le panneau auth se masque sans perdre le logo, le retour, le formulaire ni les messages. Les composants métier gardent leurs propres règles existantes tant qu’une migration n’est pas autorisée.
