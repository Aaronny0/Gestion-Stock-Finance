# Logique Métier : Module de Troc, Échange et Rachat Client

Ce document décrit la logique d'implémentation pour une application Next.js avec un backend Supabase. L'objectif est de gérer les opérations d'échange de téléphones (Troc) et d'achat direct de téléphones aux clients (Rachat), avec leurs impacts respectifs sur l'inventaire et la trésorerie journalière.

## 1. Fonctionnalité : Troc et Échange

Cette fonctionnalité permet à un client d'échanger son téléphone actuel contre un téléphone de la boutique, en payant la différence.

* **Module Téléphone Client (Entrant)** : L'interface doit capturer la marque, le modèle, la valeur marchande estimée par le vendeur, ainsi qu'une description ou l'état du téléphone.
* **Module Téléphone Boutique (Sortant)** : Le téléphone de la boutique doit être sélectionné directement depuis l'inventaire/stock existant, ce qui remplit automatiquement son prix de vente.
* **Calcul du Complément** : Le système doit calculer automatiquement le "Complément versé par le client", qui correspond à la différence entre le prix du téléphone de la boutique et la valeur estimée du téléphone du client.
* **Mouvement de Stock** : Lors de la validation, le téléphone de la boutique est retiré du stock.
* **Mouvement de Stock** : Le téléphone du client est simultanément ajouté au stock de la boutique.
* **Traçabilité de la Transaction** : Le système doit enregistrer la date de l'opération, les identifiants des deux téléphones, leurs prix respectifs, le montant du complément, et l'utilisateur (vendeur) ayant effectué l'opération.
* **Impact Financier** : Le montant du complément versé par le client doit être additionné aux finances et aux ventes réalisées du jour.

## 2. Fonctionnalité : Rachat Client

Cette fonctionnalité permet à la boutique d'acheter directement le téléphone d'un client contre de l'argent comptant.

* **Saisie des informations** : L'interface doit enregistrer les détails du téléphone racheté et le "montant décaissé" remis au client.
* **Mouvement de Stock** : Le téléphone racheté au client doit être ajouté immédiatement à l'inventaire de la boutique.
* **Impact Financier Immédiat** : Le montant décaissé doit être soustrait de la trésorerie journalière, créant potentiellement un déficit sur la journée en cours.
* **Impact Financier Futur** : Le système doit prévoir que la revente ultérieure de ce téléphone générera un impact positif sur les finances d'une journée future.

## 3. Directives d'implémentation pour l'Agent IA

* Créer ou mettre à jour les tables Supabase pour gérer un type de transaction (`type: 'TROC' | 'RACHAT' | 'VENTE_CLASSIQUE'`).
* S'assurer que les opérations d'ajout/retrait de stock et de mise à jour de la caisse du jour soient exécutées dans une transaction sécurisée (RPC Supabase ou API Route Next.js) pour éviter les incohérences de données.


Voici les détails précis extraits de tes audios, point par point, pour que ton agent IA ait une vue exhaustive de la mécanique attendue :

### 1. Le module "Troc et Échange"

Le locuteur explique que l'application possède déjà un tableau de bord qui gère les stocks, l'inventaire et les ventes. L'onglet "Troc et échange" vient s'y greffer et se divise en deux parties distinctes.

**A. Saisie des informations**

* **Téléphone du client :** Il faut renseigner la marque et le modèle du téléphone que le client souhaite céder (l'exemple donné est un iPhone 11). Le vendeur doit estimer la valeur marchande de ce téléphone et saisir une description. Cette description sert notamment à garder une trace des éventuels problèmes de l'appareil pour ne pas les oublier par la suite.
* **Téléphone de la boutique :** Le vendeur sélectionne un produit existant directement depuis le stock. Les informations comme la marque, le modèle et le prix de vente s'affichent automatiquement.

**B. Logique financière et de stock**

* **Le complément :** L'application simule le "déficit" pour la boutique (par exemple, si le téléphone client vaut 80 000 et celui de la boutique vaut 400 000) et calcule le montant exact que le client doit verser pour combler la différence.
* **Les stocks :** Une fois validé, le téléphone donné par le client entre dans le stock de la boutique, et le téléphone choisi par le client sort du stock.
* **Les données à sauvegarder :** L'enregistrement de l'opération doit inclure la date, les modèles des deux téléphones, leurs prix respectifs, le complément versé par le client, ainsi que le nom de l'employé qui a fait la transaction.
* **Trésorerie :** Le "complément versé" s'ajoute aux finances du jour, en plus des autres ventes réalisées de manière classique.

---

### 2. Le module "Rachat Client"

Cette partie gère les clients qui viennent uniquement pour vendre leur téléphone contre de l'argent comptant, par exemple un iPhone 17 Pro Max, pour résoudre un problème personnel.

* **Saisie :** Le vendeur enregistre les informations de ce téléphone et le montant qui est "décaissé", c'est-à-dire l'argent liquide remis au client.
* **Les stocks :** Comme pour le troc, le téléphone racheté entre directement dans le stock et l'inventaire de la boutique.
* **Trésorerie du jour (Impact négatif) :** Le montant payé au client est automatiquement soustrait des finances de la journée. Le locuteur donne l'exemple d'une journée où il y a eu 200 000 de ventes, mais un décaissement de 400 000 ou 500 000 pour un rachat : la journée se termine alors en déficit.
* **Trésorerie future (Impact positif) :** Le locuteur précise que ce système est logique car, bien que les finances du jour soient impactées négativement, le téléphone racheté sera vendu plus tard, ce qui viendra gonfler de manière positive les finances d'une journée future.

Voudrais-tu que je traduise ces détails en instructions techniques (Prompt système) prêtes à être copiées-collées pour ton agent IA ?