# Rapport de réalisation — Frontend Gestion Stock & Finance

## 1. Demande et décision de périmètre

Le frontend a été refondu à partir du document `Gestion_Stock_Finance_FRONTEND_Cahier_de_Realisation.pdf` (26 pages).

**Dérogation explicitement validée par l’utilisateur : le moteur de calcul comptable côté navigateur est autorisé.** Cette décision est appliquée dans le code. Le PDF original n’a pas été modifié.

La demande complémentaire consistait à vérifier une éventuelle interruption de commande, achever les contrôles et fournir le présent compte rendu en fichier Markdown.

## 2. Vérification après interruption

- Les fichiers sources modifiés étaient toujours présents.
- Aucun processus de compilation ou de serveur Next.js n’était encore actif au moment de la reprise.
- La dernière compilation présente était antérieure aux dernières modifications : les contrôles et la compilation ont donc été relancés.
- Une erreur d’import `Alert` dans le dashboard a été corrigée pendant cette reprise.
- Le serveur local a été redémarré.
- La recette navigateur a détecté un débordement horizontal de la caisse à 360 px : la largeur minimale du catalogue a été corrigée.
- Le style d’impression du reçu a été ajusté afin de placer le document en haut de la page, sans le shell de l’application.
- Le contrôle visuel mobile a conduit à remplacer le résumé de paiement collant par un raccourci fixe vers le panier, pour garder les champs lisibles.

## 3. État de départ et sauvegarde

L’application initiale était un projet Next.js existant avec des écrans stock, ventes, troc, rachat et finance. Les opérations utilisaient directement Supabase et un schéma historique sans les structures multi-entreprises, les permissions ou les API comptables prévues dans le cahier.

Une sauvegarde du code source initial a été créée :

`docs/archives/frontend-avant-cahier.tar.gz` *(archive historique retirée du dépôt pendant le nettoyage de la Phase 0)*

Le dossier de travail ne contenait pas de dépôt Git ; aucun commit n’a été créé.

Aucune migration SQL, aucune suppression de données et aucune écriture dans la base Supabase existante n’ont été effectuées. Les secrets du fichier d’environnement n’ont pas été ajoutés aux documents ni aux sorties.

## 4. Fondation frontend réalisée

- Types partagés : session, entreprise, boutique, permissions, produits, ventes, paiements, écritures, comptes, périodes et collections métier.
- Client API unique avec timeout, gestion des erreurs et requêtes sans cache métier.
- Provider de session et de contexte entreprise/boutique.
- Masquage des menus et des actions selon les permissions, refus d’accès aux pages non autorisées.
- Contrôle périodique de session et actualisation au retour au premier plan.
- Sélection de boutique avec réinitialisation du contenu et des formulaires associés.
- Sélection globale de boutiques réservée aux consultations autorisées.
- Protection contre les doubles soumissions et clé d’idempotence conservée lors d’un nouvel essai du même contenu.
- Proxy API serveur avec liste de routes autorisées, contrôle d’origine sur les mutations, limite de taille et messages d’erreur maîtrisés.
- Retrait de l’ancien endpoint d’authentification sensible : `/api/auth` retourne désormais 410. La migration des anciens comptes vers le service d’authentification cible reste nécessaire.

## 5. Interface et composants communs

L’interface Vortex comprend une navigation latérale sur ordinateur, un en-tête de contexte, des raccourcis mobiles et des écrans adaptés aux petits formats.

Composants réutilisables :

- `Money`, `Badge`, `PermissionGate` ;
- `DataTable` : recherche, tri, pagination, sélection et export ;
- `Field` : libellé, aide, état requis ;
- `Modal`, `ConfirmDialog`, `Alert`, notifications ;
- `EmptyState`, skeletons de chargement ;
- `DateRangePicker`, en-têtes et cartes d’indicateurs.

Les tableaux passent en cartes lisibles sur mobile. Les dialogues natifs gèrent le focus. Les champs sont étiquetés et les erreurs/succès sont annoncés. Le zoom utilisateur est réautorisé dans le viewport.

Les exports CSV neutralisent les préfixes pouvant être interprétés comme des formules. Les exports XLSX sont chargés à la demande. Les calculs et affichages monétaires tiennent compte des décimales de la devise ; le FCFA est présenté sans décimales inutiles.

## 6. Écrans et parcours livrés

### Authentification et démarrage

- Connexion par email et mot de passe.
- Inscription propriétaire en quatre étapes : compte, entreprise, boutique, récapitulatif.
- Demande de récupération d’accès avec message générique.
- Consultation/activation d’une invitation dont le rôle et l’entreprise proviennent du serveur.
- Lien explicite vers une démonstration indépendante des données réelles.

### Dashboard

- CA, encaissements, marge brute et cashflow net.
- Définitions des KPI, contexte boutique/période et liens vers les détails.
- Courbe CA/marge, période 7/30 jours, paiements, meilleures ventes.
- Alertes de stock faible, caisse ouverte et invitations.
- Résultat comptable, décaissements et volumes de troc/rachat.
- Prise en charge d’agrégats serveur via `DashboardReporting`.

### Catalogue et stock

- Recherche, filtres marque/état/stock faible/archivage.
- Fiche produit, prix de vente, seuil, stock et coût selon permission.
- Entrées par quantité, coûts unitaire/total, IMEI facultatif.
- Ajustement motivé avec comparaison du stock actuel et compté.
- Transfert atomique d’une référence entre boutiques.
- Historique des entrées, ajustements et transferts.
- Assistant d’import CSV/XLSX : fichier, mapping, prévisualisation, validation, rapport d’erreurs, confirmation.

### Caisse et ventes

- Catalogue de vente, recherche clavier, ajout au panier, quantités et retrait d’un article.
- Prix modifiable selon permission, remises contrôlées.
- Client facultatif au comptant, obligatoire au crédit.
- IMEI unique facultatif sur une unité vendue.
- Paiements simples ou répartis entre deux modes lorsque l’option est activée.
- Confirmation indiquant total, payé et reste dû.
- Historique, détail, reçu, impression et sauvegarde PDF par l’impression navigateur.
- Paiements ultérieurs et remboursement intégral avec retour du stock et extourne.
- Raccourcis F2, Entrée pour un résultat unique et F8.

### Troc et rachat

- Appareil repris, appareil sortant pour le troc, valeur de reprise et complément.
- Rachat distingué d’une vente négative : stock entrant et trésorerie sortante.
- Historique séparé.
- En démonstration, les effets sont appliqués atomiquement et les écritures restent équilibrées.
- Le CA de la vente associée au troc comprend sa valeur reconnue ; seul le complément est un encaissement nouveau.

### Achats, fournisseurs, dépenses et trésorerie

- Achat à plusieurs articles avec quantités, coûts, fournisseur et référence.
- Paiement immédiat, partiel ou à crédit ; dette puis règlements ultérieurs.
- Réception de stock issue de l’achat sans seconde saisie manuelle.
- Fournisseurs et clients avec coordonnées et historiques associés.
- Dépenses catégorisées et annulation par extourne.
- Justificatifs via une URL de téléversement signée ; pas de fichier en base PostgreSQL.
- Ouverture, mouvements et clôture de caisse.
- Montant théorique, montant compté, écart et commentaire obligatoire en cas d’écart.

### Comptabilité générale

- Plan comptable et ajout/désactivation de comptes.
- Journaux et détail des écritures.
- Brouillons modifiables et postage définitif.
- Extournes en période ouverte, sans réécriture d’une écriture postée.
- Grand livre avec solde cumulatif et accès à la source.
- Balance avec ouverture, mouvements et solde final.
- Compte de résultat, bilan, flux de trésorerie et ancienneté des créances/dettes.
- Périodes ouvertes/verrouillées et contrôle des brouillons avant verrouillage.

### BI, administration et paramètres

- Pages exécutive, ventes, stock, marge, équipe, clients, trésorerie, comptabilité, troc/rachat.
- Filtres persistants dans l’URL et accès aux opérations d’origine.
- Équipe, invitations, modification de rôle/boutiques, suspension/réactivation.
- Personnalisation des permissions à partir d’un modèle de rôle.
- Paramètres entreprise, boutiques, vente, stock, comptabilité, fiscalité et sécurité.
- Activation e-MECeF facultative et test de connexion prévu côté API ; aucun secret fiscal exposé.
- Audit en lecture seule.

### PWA

- Manifest et icônes 192/512 px.
- Service worker limité aux assets statiques Next.js.
- Aucun cache métier sensible et aucune vente hors ligne annoncée.

## 7. Moteur comptable navigateur

Fichier principal : `src/frontend/accounting.ts`.

Il fournit :

1. conversion et formatage en unités monétaires mineures ;
2. validation des montants ;
3. total débit/crédit et calcul de l’écart ;
4. contrôle du compte actif et de la période ouverte ;
5. génération des lignes comptables de vente pour la démonstration ;
6. grand livre cumulatif ;
7. balance avec solde d’ouverture ;
8. calcul distinct de CA, encaissements, décaissements, cashflow, marge, résultat et panier moyen.

Le simulateur `demo.ts` ajoute les opérations commerciales et comptables atomiques, les règlements et les transferts avec comptes de liaison.

Le plan et les comptes de démonstration ne sont pas un paramétrage fiscal universel. La validation définitive, les mappings nationaux, la valorisation officielle, les reliquats d’arrondi et les opérations concurrentes restent du ressort du service métier.

## 8. Mode démonstration et raccordement réel

### Démonstration

Adresse : [http://localhost:3000/demo](http://localhost:3000/demo).

- Données fictives et transactions en mémoire.
- Choix du rôle dans le bandeau de démonstration.
- Choix de boutique dans l’en-tête.
- Rechargement de page = réinitialisation de la démonstration.
- Aucun envoi réel d’invitation, aucun connecteur fiscal réel et aucune écriture Supabase.

### Exploitation réelle

Le service métier attendu ne se trouve pas dans ce dépôt. L’application réelle affiche donc un état explicite si `FRONTEND_API_URL` n’est pas configuré.

Le contrat est documenté dans [docs/frontend-api.md](docs/frontend-api.md), avec endpoints, charges utiles, cookies, permissions, documents, montants, idempotence et erreurs. Un exemple de variable d’environnement est fourni dans `.env.frontend.example`.

**Cette livraison ne prétend pas avoir validé un backend multi-entreprises ni une comptabilité de production inexistants dans le dépôt.**

## 9. Contrôles de qualité

Les commandes de contrôle sont disponibles dans `package.json` :

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Les 16 tests métier couvrent : arrivage 2 000 unités, vente 3 unités, conflits atomiques, rachat, troc, crédit, paiement fournisseur, remboursement, équilibre comptable, périodes, balance, permissions, boutiques, devises, import, paiements fractionnés, transferts, achat multi-articles et édition des brouillons.

Le script `tests/browser-smoke.cjs` couvre les parcours visuels et fonctionnels. Il peut utiliser un module Playwright installé via `PLAYWRIGHT_MODULE` et un navigateur via `CHROME_PATH`. Le résultat détaillé, les contrôles et les captures sont enregistrés dans `output/frontend-qa/`.

## 10. Inventaire technique

| Emplacement | Contenu |
| --- | --- |
| `src/frontend/types.ts` | Modèles et permissions |
| `src/frontend/api.ts` | Client API et erreurs |
| `src/frontend/provider.tsx` | Session, contexte, commandes et démonstration |
| `src/frontend/navigation.ts`, `shell.tsx` | Routes, rôles et navigation responsive |
| `src/frontend/ui.tsx` | Composants communs |
| `src/frontend/forms.tsx` | Formulaires métier et confirmations |
| `src/frontend/import-stock.tsx` | Import CSV/XLSX |
| `src/frontend/pages.tsx` | Catalogue, ventes, finance, équipe et historiques |
| `src/frontend/pos.tsx` | Caisse et reçus |
| `src/frontend/dashboard.tsx`, `charts.tsx`, `analytics.tsx` | Pilotage et analyses |
| `src/frontend/accounting.ts`, `accounting-page.tsx` | Moteur et écrans comptables |
| `src/frontend/demo.ts` | Données et transactions fictives |
| `src/frontend/auth-page.tsx`, `settings.tsx` | Authentification et paramètres |
| `src/app/` | Routes, layout, erreurs et proxy API |
| `src/app/globals.css` | Design, responsive et impression |
| `public/` | Manifest, icônes et service worker |
| `tests/` | Tests métier et navigateur |
| `docs/` | Contrats, couverture, limites et sauvegarde initiale |

## 11. Limites restantes, distinctes des fonctionnalités livrées

La couverture précise est décrite dans [docs/frontend-recette.md](docs/frontend-recette.md). Les points suivants ne sont pas présentés comme terminés :

- raccordement et recette réels du backend, de l’authentification, des invitations, des permissions serveur et de l’isolation entre entreprises ;
- pagination distante et toutes les analyses BI à grand volume, comparaisons N/N-1, cohortes, canaux et certains ratios ;
- transferts multi-références dans une seule saisie et réceptions d’achat partielles en plusieurs étapes ;
- règles avancées de garanties/SAV, logos et personnalisation détaillée des documents ;
- configuration des secrets fiscaux, mappings comptables nationaux et écritures officielles de clôture ;
- remboursement composite d’un troc et endpoint de PDF serveur ;
- tests utilisateurs réels, concurrence de plusieurs caissiers, performance en conditions de production.

Ces éléments nécessitent le service métier ou des parcours spécialisés supplémentaires. Ils ne remettent pas en cause l’intégration du moteur comptable local autorisé, mais empêchent d’assimiler la démonstration à une V1 de production intégralement recettée.

## 12. Démarrage

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

Puis ouvrir `/demo` pour la démonstration ou `/login` pour le parcours réel, après raccordement du service métier.

## 13. Résultats finaux de la reprise

- Vérification TypeScript : réussie.
- Lint : réussi, sans erreur ni avertissement lors du dernier contrôle.
- Tests métier : **16 réussis sur 16**.
- Compilation Next.js de production : réussie après la correction mobile et du style d’impression.
- Recette navigateur terminée le `2026-09-16T22:02:00.370Z`.
- Erreurs JavaScript navigateur : **0**.

Contrôles navigateur validés :

- Dashboard desktop.
- Entrée de 2000 unités sans IMEI.
- Vente de 3 unités, reçu et impression.
- Stock après vente : 2015 unités.
- Isolation des boutiques dans les listes.
- Caissier : aucun accès coûts/comptabilité/ajustement.
- Écriture : déséquilibre bloqué puis brouillon équilibré.
- 24 routes métier sans erreur.
- Drill-down graphique vers les ventes.
- Responsive 768px.
- Responsive 360px.
- API absente : état explicite, aucun faux succès.
- Proxy : mutation externe refusée.
- Ancien endpoint sensible retiré.

Preuve détaillée : [résultats JSON](output/frontend-qa/browser-results.json). Captures à jour dans `output/frontend-qa/`.

Le serveur de prévisualisation local a été relancé sur le port 3000 pour permettre la consultation de la démonstration.

## Complément — améliorations UX du 17 septembre 2026

La seconde phase est détaillée dans [RAPPORT_AMELIORATIONS_UX.md](RAPPORT_AMELIORATIONS_UX.md) : palette indépendante du logo, statuts lisibles, monnaie, vente sous le coût, retours partiels, créances, réapprovisionnement, clôture guidée et protection des saisies. La suite métier comprend désormais **24 tests**, complétée par une recette navigateur UX. Les résultats historiques ci-dessus décrivent la première phase ; les preuves actualisées et limites figurent dans ce complément.
