# VORTEX — FRONTEND PRODUCT SPECIFICATION

## 1. OBJECTIF DU DOCUMENT

Ce document définit l'architecture produit et frontend cible de VORTEX.

Il constitue la source de vérité concernant :

- le site public ;
- la présentation de VORTEX ;
- la démonstration publique ;
- l'authentification ;
- la demande d'accès ;
- la validation administrateur ;
- l'onboarding ;
- l'application privée ;
- la séparation des différents parcours.

Toute modification importante du frontend doit respecter ce document.

---

# 2. VISION PRODUIT

VORTEX est une plateforme de gestion permettant de centraliser les opérations d'une entreprise.

Le produit couvre notamment :

- ventes ;
- caisse ;
- stock ;
- catalogue ;
- clients ;
- fournisseurs ;
- achats ;
- reprises ;
- trocs ;
- trésorerie ;
- dépenses ;
- paiements ;
- comptabilité ;
- analyse ;
- rapports ;
- équipe ;
- permissions ;
- historique ;
- audit.

Le frontend doit présenter VORTEX comme un vrai logiciel professionnel et non comme un simple dashboard administratif.

---

# 3. ARCHITECTURE GÉNÉRALE

Le frontend doit être conceptuellement séparé en quatre espaces.

## A. VORTEX PUBLIC

Site de présentation accessible sans compte.

Objectifs :

- présenter VORTEX ;
- montrer sa valeur ;
- présenter les fonctionnalités ;
- permettre d'explorer une démonstration ;
- convertir un visiteur en prospect ;
- permettre de demander un accès ;
- permettre aux utilisateurs existants de se connecter.

## B. VORTEX DEMO

Expérience de démonstration publique.

Objectifs :

- montrer le produit réel ;
- permettre une exploration sans compte ;
- utiliser uniquement des données fictives ;
- permettre au prospect de comprendre VORTEX avant de demander un accès.

## C. VORTEX APP

Application réelle.

Accessible uniquement aux comptes autorisés.

Contient :

- dashboard ;
- ventes ;
- stock ;
- clients ;
- fournisseurs ;
- finances ;
- administration ;
- autres modules métier.

## D. VORTEX ADMIN

Back-office utilisé par l'équipe VORTEX.

Permet notamment :

- consulter les demandes d'accès ;
- consulter les informations des prospects ;
- suivre leur statut ;
- valider ou refuser un accès ;
- suspendre un compte si nécessaire.

Les discussions commerciales et les prix peuvent rester privés et hors du frontend client.

---

# 4. ARCHITECTURE DES ROUTES CIBLE

Architecture conceptuelle recommandée :

```text
/
├── /
├── /features
├── /demo
├── /login
├── /signup
├── /verify-email
├── /access-pending
├── /forgot-password
├── /reset-password
├── /onboarding
└── /app
    ├── /dashboard
    ├── /analytics
    ├── /sales
    ├── /inventory
    ├── /trade-in
    ├── /buyback
    ├── /purchases
    ├── /suppliers
    ├── /customers
    ├── /treasury
    ├── /expenses
    ├── /payments
    ├── /accounting
    ├── /team
    ├── /audit
    └── /settings
```

Les noms exacts des routes peuvent être adaptés à l'architecture existante.

Ne pas casser les routes existantes sans raison.

---

# 5. SITE PUBLIC — HOME

La home doit être une vraie présentation de VORTEX.

Elle ne doit pas simplement afficher :

- connexion ;
- inscription ;
- liste d'attente.

Le visiteur doit pouvoir comprendre ce qu'est VORTEX avant de fournir ses informations.

---

# 6. HERO

Le hero doit communiquer immédiatement la proposition de valeur.

Exemple de direction :

> Pilotez toute votre activité depuis un seul espace.

Texte secondaire possible :

> Ventes, stock, clients, fournisseurs, trésorerie, dépenses et analyses réunis dans une plateforme conçue pour vous donner une vision claire de votre entreprise.

CTA principal :

> Voir la démonstration

CTA secondaire :

> Demander un accès

Accès utilisateur existant :

> Se connecter

---

# 7. PRODUIT VISIBLE RAPIDEMENT

Le site public doit montrer rapidement l'interface réelle de VORTEX.

Éviter :

- illustrations abstraites ;
- mockups décoratifs sans contenu ;
- hero extrêmement haut avant de voir le produit.

Afficher par exemple :

- dashboard ;
- statistiques ;
- graphiques ;
- stock ;
- ventes ;
- rapports.

Le visiteur doit voir le produit rapidement.

---

# 8. STRUCTURE RECOMMANDÉE DE LA HOME

La page peut suivre cette logique :

```text
Navigation
Hero
Preview produit
Problèmes résolus par VORTEX
Modules principaux
Dashboard / Analytics
Ventes
Stock
Finance
Clients / Fournisseurs
Démonstration
Bénéfices
Sécurité / contrôle / permissions
CTA final
Footer
```

La structure finale peut évoluer selon la qualité du design.

---

# 9. NAVIGATION PUBLIQUE

Navigation recommandée :

```text
VORTEX
Produit
Fonctionnalités
Démonstration
[ Se connecter ]
[ Demander un accès ]
```

Éviter une navbar contenant trop de liens.

---

# 10. FONCTIONNALITÉS À PRÉSENTER

Le site peut présenter notamment :

## Pilotage

- dashboard ;
- rapports ;
- tendances ;
- indicateurs.

## Ventes

- caisse ;
- historique ;
- suivi ;
- performances.

## Stock

- catalogue ;
- disponibilité ;
- mouvements ;
- alertes.

## Clients

- profils ;
- historique ;
- activité.

## Fournisseurs

- achats ;
- relations ;
- historique.

## Finance

- trésorerie ;
- dépenses ;
- paiements ;
- comptabilité.

## Administration

- équipes ;
- rôles ;
- permissions ;
- audit.

---

# 11. PRICING

Le prix n'a pas besoin d'être affiché publiquement.

Le modèle commercial prévoit une discussion avec le prospect avant activation.

Le site peut utiliser des formulations telles que :

> Demander un accès

ou :

> Parler avec notre équipe

Éviter de créer artificiellement une page Pricing si les offres ne sont pas standardisées.

---

# 12. VORTEX DEMO

Créer une véritable démonstration publique.

Route conceptuelle :

```text
/demo
```

Aucun compte ne doit être nécessaire pour consulter la démonstration.

---

# 13. OBJECTIF DE LA DÉMO

La démo doit répondre à :

> « À quoi ressemble VORTEX lorsque mon entreprise contient déjà des données ? »

Elle doit convaincre par le produit lui-même.

---

# 14. DONNÉES DE DÉMONSTRATION

Utiliser uniquement des données fictives.

Créer un dataset réaliste comprenant par exemple :

- 200+ clients ;
- 300+ commandes / ventes ;
- produits ;
- catégories ;
- fournisseurs ;
- achats ;
- dépenses ;
- paiements ;
- mouvements de stock ;
- rapports ;
- plusieurs mois d'historique.

Les nombres exacts peuvent être adaptés.

L'objectif est de donner suffisamment de matière pour que :

- tableaux ;
- filtres ;
- recherche ;
- rapports ;
- charts ;
- KPI ;

semblent réalistes.

---

# 15. ISOLATION DE LA DÉMO

La démo ne doit JAMAIS :

- lire les vraies données clients ;
- écrire dans la production ;
- avoir accès à des secrets ;
- posséder de vrais droits administrateurs ;
- utiliser un compte production avec privilèges élevés.

Préférer :

- données locales ;
- mock data ;
- fixture data ;
- environnement démo séparé.

---

# 16. SIGNALER LE MODE DÉMONSTRATION

Afficher de manière élégante :

> Mode démonstration — données fictives

Le message doit être visible sans gêner l'utilisation.

---

# 17. INTERACTIONS DÉMO

La démo peut permettre :

- navigation ;
- recherche ;
- filtres ;
- périodes ;
- consultation client ;
- consultation produit ;
- consultation vente ;
- graphiques ;
- tables ;
- rapports.

Certaines mutations peuvent être simulées si cela apporte une vraie valeur.

Il n'est pas nécessaire de reproduire 100 % du backend réel.

---

# 18. CTA DANS LA DÉMO

La démo doit progressivement amener vers :

> Demander un accès

Exemple :

> Vous souhaitez utiliser VORTEX dans votre entreprise ?

CTA :

> Demander mon accès

---

# 19. AUTHENTIFICATION — PRINCIPE

Il faut distinguer :

- se connecter ;
- demander un accès.

Ce sont deux intentions différentes.

---

# 20. PAGE LOGIN

Route :

```text
/login
```

Cette page sert aux personnes ayant déjà accès à VORTEX.

Elle doit être très simple.

Contenu recommandé :

```text
VORTEX

Accéder à VORTEX

[ Continuer avec Google ]

────────── ou ──────────

Adresse e-mail
Mot de passe
[ Se connecter ]

Mot de passe oublié ?

────────────

Vous souhaitez découvrir VORTEX ?
Voir la démonstration

Vous souhaitez utiliser VORTEX ?
Demander un accès
```

Ne pas surcharger cette page.

---

# 21. GOOGLE AUTH

Si Google OAuth est activé :

le présenter comme une méthode d'authentification simple.

Après OAuth :

le système doit toujours vérifier le statut du compte.

Un compte Google authentifié n'est pas automatiquement un utilisateur autorisé de VORTEX.

---

# 22. DEMANDE D'ACCÈS

Route :

```text
/signup
```

Cette page représente une demande d'accès.

Elle ne signifie pas :

> Accès immédiat au produit.

---

# 23. INFORMATIONS DE DEMANDE

Demander uniquement les informations utiles.

Exemple :

```text
Nom
Prénom
Entreprise
Adresse e-mail
Téléphone
```

Éventuellement :

- secteur ;
- taille de l'entreprise ;

uniquement si réellement utile.

Éviter les formulaires interminables.

---

# 24. CRÉATION DU COMPTE

Après demande :

créer le compte selon l'architecture backend prévue.

L'utilisateur doit ensuite confirmer son adresse e-mail si cette vérification est activée.

---

# 25. FLUX D'ACCÈS COMPLET

Flux cible :

```text
VISITEUR
   ↓
SITE PUBLIC
   ↓
DÉMONSTRATION
   ↓
DEMANDE D'ACCÈS
   ↓
CRÉATION DU COMPTE
   ↓
CONFIRMATION EMAIL
   ↓
PENDING_APPROVAL
   ↓
BACK ADMIN
   ↓
CONTACT AVEC LE PROSPECT
   ↓
DISCUSSION COMMERCIALE
   ↓
APPROBATION
   ↓
APPROVED
   ↓
NOTIFICATION
   ↓
CONNEXION
   ↓
ONBOARDING
   ↓
VORTEX APP
```

---

# 26. RÈGLE CRITIQUE

## EMAIL CONFIRMÉ ≠ ACCÈS AUTORISÉ

La validation de l'adresse e-mail prouve seulement que l'adresse appartient à l'utilisateur.

Elle ne donne pas automatiquement accès à VORTEX.

---

# 27. STATUTS D'ACCÈS

Prévoir une logique claire.

Exemple :

```text
PENDING_EMAIL
PENDING_APPROVAL
CONTACTED
APPROVED
REJECTED
SUSPENDED
```

L'architecture backend peut utiliser d'autres noms si nécessaire.

L'important est de préserver la logique.

---

# 28. APRÈS CONFIRMATION EMAIL

Si le compte n'est pas encore approuvé :

ne pas envoyer vers le dashboard.

Afficher une page d'attente.

Route :

```text
/access-pending
```

---

# 29. PAGE ACCESS PENDING

Exemple :

```text
Demande reçue ✓

Votre adresse e-mail a été vérifiée.

Votre demande d'accès à VORTEX est maintenant
en cours d'examen.

Notre équipe vous contactera prochainement
pour finaliser votre accès.

[ Retourner sur VORTEX ]
```

Le ton doit être :

- clair ;
- professionnel ;
- rassurant.

---

# 30. DISCUSSION COMMERCIALE

Une fois la demande reçue :

l'administrateur peut contacter le prospect.

La négociation concernant :

- prix ;
- offre ;
- conditions ;

peut rester hors du frontend.

Il n'est pas nécessaire d'exposer ces données dans l'espace prospect.

---

# 31. BACK ADMIN

Le back admin doit permettre de consulter les demandes.

Informations possibles :

```text
Prospect
Entreprise
E-mail
Téléphone
Date de demande
Statut
Dernière activité
```

---

# 32. ACTIONS ADMIN

Actions possibles :

```text
Voir
Marquer comme contacté
Approuver
Refuser
Suspendre
```

Les actions sensibles doivent être protégées.

---

# 33. APPROBATION

Lorsque l'administrateur valide :

```text
PENDING_APPROVAL
→
APPROVED
```

L'utilisateur peut alors accéder à VORTEX.

---

# 34. NOTIFICATION D'APPROBATION

Après approbation :

envoyer une notification selon les mécanismes disponibles.

Exemple :

> Votre accès à VORTEX est prêt.

> Votre compte a été activé.

CTA :

> Accéder à VORTEX

---

# 35. REDIRECTION APRÈS LOGIN

Lorsqu'un utilisateur se connecte :

## Si non vérifié

```text
→ verify-email
```

## Si vérifié mais non approuvé

```text
→ access-pending
```

## Si approuvé mais onboarding incomplet

```text
→ onboarding
```

## Si approuvé et onboarding terminé

```text
→ app/dashboard
```

## Si suspendu

afficher un état approprié.

---

# 36. ONBOARDING

L'onboarding commence APRÈS l'approbation.

Il ne faut pas demander trop d'informations métier pendant l'inscription.

---

# 37. DONNÉES D'ONBOARDING

L'onboarding peut demander :

- nom de l'entreprise ;
- informations entreprise ;
- boutique ;
- localisation ;
- devise ;
- paramètres initiaux ;
- configuration opérationnelle.

La liste exacte dépend des besoins backend existants.

---

# 38. FIN D'ONBOARDING

À la fin :

```text
Onboarding
   ↓
Création/configuration workspace
   ↓
Dashboard réel
```

---

# 39. APPLICATION PRIVÉE

L'application réelle doit rester séparée du marketing.

Shell principal :

```text
Sidebar
Topbar
Content
```

mais il ne doit pas ressembler à un dashboard administratif générique.

---

# 40. NAVIGATION MÉTIER

Structure de référence :

## PILOTAGE

- Vue d'ensemble
- Analyses & rapports

## OPÉRATIONS

- Caisse / Vente
- Ventes
- Stock & catalogue
- Troc & reprise
- Rachat client
- Achats
- Fournisseurs
- Clients

## FINANCE

- Trésorerie & caisse
- Dépenses
- Paiements
- Comptabilité

## ADMINISTRATION

- Équipe & rôles
- Historique & audit
- Paramètres

Cette structure peut évoluer si une UX plus pertinente est trouvée.

---

# 41. DASHBOARD

Le dashboard doit immédiatement montrer :

- état de l'activité ;
- chiffre d'affaires ;
- marge ;
- ventes ;
- stock ;
- trésorerie ;
- dépenses ;
- alertes ;
- tendances ;
- actions importantes.

Il doit répondre à :

1. Que se passe-t-il ?
2. Qu'est-ce qui a changé ?
3. Qu'est-ce qui nécessite mon attention ?
4. Que puis-je faire maintenant ?

---

# 42. DESIGN DU DASHBOARD

Éviter :

```text
Titre
4 cards
Graphique
Table
```

comme recette universelle.

Construire une vraie hiérarchie.

Tous les KPI ne doivent pas avoir la même importance.

---

# 43. PAGES MÉTIER

Chaque module doit avoir une UX propre.

Ne pas reproduire systématiquement :

```text
PageHeader
+
4 KPI
+
Table
```

---

# 44. CAISSE / VENTE

Priorités :

- rapidité ;
- minimisation des clics ;
- produits rapidement accessibles ;
- panier clair ;
- total visible ;
- paiement clair ;
- erreurs évitées.

---

# 45. STOCK & CATALOGUE

Priorités :

- recherche ;
- disponibilité ;
- mouvement ;
- seuils ;
- alertes ;
- variants ;
- prix ;
- actions groupées.

---

# 46. CLIENTS

Priorités :

- identification ;
- historique ;
- activité ;
- valeur ;
- transactions ;
- actions.

---

# 47. FOURNISSEURS

Priorités :

- achats ;
- historique ;
- contacts ;
- activité ;
- soldes ;
- délais.

---

# 48. FINANCE

Priorités :

- précision ;
- confiance ;
- période ;
- variation ;
- traçabilité ;
- lisibilité.

---

# 49. ÉQUIPE & RÔLES

Priorités :

- compréhension ;
- permissions ;
- statut ;
- invitations ;
- sécurité.

---

# 50. HISTORIQUE & AUDIT

Priorités :

- acteur ;
- action ;
- date ;
- contexte ;
- filtres ;
- lisibilité.

---

# 51. PARAMÈTRES

Éviter une page immense.

Préférer :

- catégories ;
- navigation secondaire ;
- sections ;
- états modifiés ;
- sauvegarde claire ;
- danger zone distincte.

---

# 52. RESPONSIVE

Tout le frontend doit être conçu pour :

- mobile ;
- tablette ;
- laptop ;
- desktop ;
- grands écrans.

Breakpoints à tester approximativement :

```text
375
430
768
1024
1280
1440
1920
```

---

# 53. MOBILE

Le mobile ne doit pas être un desktop réduit.

Adapter :

- sidebar ;
- topbar ;
- KPI ;
- charts ;
- tables ;
- filters ;
- dialogs ;
- navigation ;
- actions.

---

# 54. DESIGN SYSTEM

L'ensemble :

- site public ;
- demo ;
- auth ;
- onboarding ;
- app ;

doit appartenir à la même marque VORTEX.

Mais ces espaces ne doivent pas nécessairement utiliser exactement la même densité.

Exemple :

## Marketing

plus éditorial.

## Demo

proche de l'application.

## Auth

extrêmement simple.

## App

plus dense et opérationnelle.

---

# 55. COHÉRENCE

La cohérence doit venir de :

- couleurs ;
- typography ;
- spacing ;
- iconographie ;
- controls ;
- states ;
- motion ;
- vocabulaire.

Pas de duplication mécanique du même layout partout.

---

# 56. SÉCURITÉ FRONTEND

Le frontend ne doit jamais être considéré comme une frontière de sécurité suffisante.

Les restrictions critiques doivent être vérifiées côté backend.

Le frontend peut masquer ou désactiver certaines actions selon le rôle.

Mais les permissions réelles doivent être contrôlées serveur.

---

# 57. DEMO ET SÉCURITÉ

La démonstration doit être considérée comme publique.

Donc :

- aucune donnée sensible ;
- aucune clé privée ;
- aucune API privilégiée ;
- aucune permission production ;
- aucune donnée réelle.

---

# 58. QUALITÉ ATTENDUE

Le frontend final doit être assez qualitatif pour qu'un prospect puisse :

1. découvrir VORTEX ;
2. comprendre le produit ;
3. explorer une démonstration ;
4. vouloir demander un accès ;
5. créer sa demande sans confusion ;
6. comprendre pourquoi son accès est en attente ;
7. être activé ;
8. configurer son entreprise ;
9. utiliser VORTEX.

---

# 59. PARCOURS FINAL DE RÉFÉRENCE

```text
                    VISITEUR
                       │
                       ▼
                SITE VITRINE
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
        VOIR LA DÉMO        SE CONNECTER
             │                   │
             ▼                   ▼
       EXPLORER VORTEX      COMPTE EXISTANT
             │
             ▼
      DEMANDER UN ACCÈS
             │
             ▼
        CRÉER COMPTE
             │
             ▼
       CONFIRMER EMAIL
             │
             ▼
       PENDING_APPROVAL
             │
             ▼
          BACK ADMIN
             │
             ▼
     CONTACT DU PROSPECT
             │
             ▼
   DISCUSSION COMMERCIALE
             │
             ▼
          APPROVED
             │
             ▼
         CONNEXION
             │
             ▼
         ONBOARDING
             │
             ▼
        VORTEX APP
```

---

# 60. SOURCE DE VÉRITÉ

Pour toute modification frontend importante :

1. lire ce document ;
2. lire le skill UI/UX VORTEX ;
3. inspecter le code actuel ;
4. préserver ce qui fonctionne ;
5. identifier les écarts avec cette architecture ;
6. planifier la modification ;
7. implémenter ;
8. observer le rendu ;
9. tester ;
10. valider techniquement.

---

# 61. RÈGLE FINALE

VORTEX ne doit plus être conçu uniquement comme :

> une application derrière une page de connexion.

VORTEX doit désormais être considéré comme un produit complet comprenant :

> Présentation → Démonstration → Conversion → Demande d'accès → Validation → Onboarding → Application.

La qualité de l'expérience avant connexion est aussi importante que la qualité du dashboard après connexion.
