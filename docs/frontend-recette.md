# Recette frontend

Référence : `Gestion_Stock_Finance_FRONTEND_Cahier_de_Realisation.pdf`, 26 pages. Le document source est resté inchangé. Le moteur comptable navigateur est inclus conformément à la dérogation utilisateur.

## Disponible dans cette livraison

- Design system, shell responsive, navigation par rôle, boutiques, états vide/erreur/chargement, messages de succès, dialogues natifs avec focus, formats monétaires.
- Connexion, inscription propriétaire en 4 étapes, demande de récupération et activation d’invitation, raccordés au contrat API.
- Dashboard filtrable, indicateurs définis, graphiques à chargement différé, alertes et liens vers les opérations.
- Catalogue, fiche produit, prix/seuil, entrées par quantités, IMEI facultatif, import CSV/XLSX avec mapping/prévisualisation/rapport d’erreurs, ajustements motivés, transferts et historique.
- Caisse avec recherche, panier, quantités, prix autorisés, remises plafonnées, client facultatif ou obligatoire au crédit, paiements simples/fractionnés, reçu, impression/PDF. Raccourcis F2, Entrée pour une recherche unique, F8.
- Trocs et rachats distincts ; effets stock/trésorerie/comptabilité simulés atomiquement. Le rachat ne génère pas de CA ; la vente associée au troc est reconnue avec sa valeur de reprise et son complément séparé.
- Achats à plusieurs lignes et paiement immédiat/partiel/crédit, fournisseurs, dépenses/extournes, justificatifs, règlements ultérieurs, sessions de caisse et écarts.
- Journaux, comptes, brouillons modifiables, contrôle débit/crédit, postage, extourne, grand livre, balance, compte de résultat, bilan, flux, ancienneté des dettes/créances, verrouillage de période.
- Pages BI exécutive, ventes, stock, marge, équipe, clients, trésorerie, comptabilité et troc/rachat ; filtres d’URL, listes sources et exports.
- Équipe, invitations, rôles, boutiques et permissions personnalisées ; paramètres entreprise, vente, stock/comptabilité, fiscalité facultative et sécurité.
- Historique d’audit en lecture seule ; service worker sans cache métier ni transactions hors ligne.

## Contrôles automatisés

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

Tests métier : arrivée de 2 000 unités sans IMEI puis vente de 3, atomicité lors d’un conflit, rachat sans CA ni charge instantanée, troc et marges, achat à crédit et paiement ultérieur, crédit avec client requis, remboursement sans suppression, contrôle des écritures et périodes, balance, permissions, boutiques, devises, import atomique, paiements fractionnés, transfert avec comptes de liaison, achat multi-articles et modification des brouillons.

La vérification navigateur couvre les routes principales, un parcours de vente jusqu’au reçu, entrée de stock, rôles, boutique, comptabilité et largeurs 360 / 768 / 1440 px. Captures dans `output/frontend-qa/`.

## Limites identifiées avant mise en production

La démonstration est interactive mais ne constitue pas une base persistante ni une validation du backend. Les scénarios réels d’authentification/invitation, d’isolation entre entreprises, de concurrence entre caissiers, d’envoi d’emails, de stockage privé, d’e-MECeF et de comptabilisation transactionnelle attendent le service métier.

Les pages BI n’implémentent pas encore tous les axes avancés du cahier (comparaisons N/N-1 alimentées par le serveur, canaux, cohortes, garanties, délai de revente et certains ratios). La consultation locale est bornée ; pagination distante et rapports lourds doivent être raccordés pour les gros volumes.

Les formulaires de transfert traitent une référence à la fois. Les achats réceptionnent immédiatement toutes les quantités saisies ; la réception partielle en plusieurs fois nécessite le parcours/backend correspondant. L’import est intégralement atomique : aucun import partiel n’est annoncé.

La configuration des secrets fiscaux, les logos, les modèles de reçus/taxes/remises, les mappings comptables nationaux, les fermetures définitives d’exercice et les règles détaillées de garanties demandent la configuration serveur et/ou leurs écrans spécialisés. La clôture proposée ici verrouille une période ; elle ne produit pas les écritures légales de clôture.

La simulation de troc ne propose pas le remboursement composite des deux appareils. Les reçus n’affichent pas de numéro fiscal fictif. L’application fournit l’impression navigateur, sans prétendre disposer d’un endpoint PDF serveur ou d’un partage public de document privé.

Ces limites sont distinctes de la décision utilisateur : **le calcul comptable local est bien autorisé et implémenté**. Elles ne doivent pas être considérées comme une recette V1 de production entièrement validée.
