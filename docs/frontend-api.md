# Frontend Vortex — contrat de raccordement

## État de l’intégration

Le dépôt initial contient un schéma historique mono-boutique, des appels Supabase directs et une authentification personnalisée. Il ne contient pas les API multi-entreprises, de permissions et de comptabilité décrites dans le cahier frontend.

Le nouveau frontend n’utilise pas ces anciennes écritures directes. **Aucune migration ni écriture n’a été exécutée dans Supabase.** L’ancien code est conservé dans `docs/archives/frontend-avant-cahier.tar.gz`.

- `/demo` : données fictives en mémoire, commandes atomiques simulées, réinitialisation au rechargement. Aucune transmission de transaction ni de justificatif.
- Routes normales : requêtes à `/api/v1/*`, relayées vers `FRONTEND_API_URL` par Next.js. Sans service configuré : HTTP 503 et écran explicite avec lien vers la démonstration.
- Les types du contrat sont définis dans `src/frontend/types.ts`. Le client se trouve dans `src/frontend/api.ts`.
- Le retrait de l’ancien endpoint `/api/auth` (HTTP 410) retire notamment l’ancien changement de mot de passe public sans vérification. Les anciens comptes ne sont pas migrés automatiquement : prévoir leur migration vers l’authentification du service métier.

## Session et périmètres

`GET /workspace?storeId=...&organizationId=...&start=YYYY-MM-DD&end=YYYY-MM-DD` retourne `Snapshot` :

```ts
{
  session: UserSession,
  data: Database,
  reporting?: DashboardReporting
}
```

`GET /session` retourne `UserSession`. Appelé au retour au premier plan et toutes les 60 secondes pour actualiser les droits. Le service contrôle l’authentification et les suspensions.

La session contient l’utilisateur, l’entreprise active, les entreprises accessibles, les boutiques autorisées, la boutique habituelle et les permissions effectives. L’entreprise et la boutique demandées ne sont que des filtres : **le serveur doit en vérifier l’appartenance**. `all` est réservé aux consultations globales autorisées, jamais à une mutation.

Toutes les collections doivent être présentes, même vides. Les clés privées et mots de passe ne font jamais partie des réponses. Les coûts et marges doivent être omis côté serveur lorsque les permissions correspondantes manquent. L’interface masque aussi les menus, colonnes et actions.

Les données comptables utilisées pour les soldes d’ouverture doivent inclure l’historique antérieur nécessaire, ou être remplacées par un contrat de rapports serveur. Ne pas envoyer des comptes tronqués en les présentant comme une balance complète. Ne pas tronquer silencieusement une liste : la première intégration attend un jeu de données complet et borné pour les filtres demandés. Le composant de liste effectue recherche, tri, sélection et pagination locale (8 lignes/cartes).

Le dashboard accepte `reporting` pour utiliser des agrégats calculés côté serveur sur la totalité des opérations. Les calculs analytiques locaux sont limités à 2 000 ventes ; les pages BI invitent à réduire la période au-delà. La pagination distante et les agrégats des pages BI à grand volume doivent être raccordés avant un déploiement à cette échelle.

## Authentification

Les cookies de session sont émis par le service métier, puis relayés côté Next.js. Employer des cookies `HttpOnly`, `Secure` en production, `SameSite=Lax` ou plus strict, `Path=/`. Le proxy retire un éventuel domaine upstream afin de conserver un cookie de l’application.

| Méthode / route              | Corps / résultat attendu                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /auth/login`           | `{email,password}` ; session HTTP-only, succès JSON                                                                                                                                        |
| `POST /auth/signup`          | `{name,email,password,organizationName,country,currency,timezone,storeName,city}` ; création atomique du propriétaire, de l’entreprise et de la boutique, ou message de confirmation email |
| `POST /auth/logout`          | `{}` ; expiration des cookies                                                                                                                                                              |
| `POST /auth/forgot-password` | `{email}` ; réponse générique, même si le compte n’existe pas                                                                                                                              |
| `POST /auth/invitation`      | `{token}` ; `{organization,role}` après validation du token                                                                                                                                |
| `POST /auth/activate`        | `{token,password}` ; rôle et entreprise déterminés exclusivement par le token côté serveur                                                                                                 |

Le fournisseur d’identité doit héberger le parcours sécurisé de changement de mot de passe pointé par l’email de récupération. Le frontend ne restaure pas l’ancien formulaire qui modifiait un mot de passe à partir d’un identifiant seul.

## Commandes métier

`POST /commands` reçoit :

```ts
{
  type: string,
  storeId: string,
  idempotencyKey: string,
  payload: { organizationId: string, ...fields }
}
```

L’en-tête `Idempotency-Key` répète la clé. Elle est conservée lors d’un nouvel essai du même contenu après échec ou réponse incertaine. Une seule commande peut être soumise à la fois depuis le provider. Le backend doit dédupliquer **durablement** les commandes et vérifier droits, boutique, disponibilité, dates et montants dans sa transaction.

Réponse : `{reference: string, sale?: Sale}`. Pour `sale.create`, retourner la vente définitive dans `sale` : le reçu utilise ce résultat, pas les montants supposés par le panier. Après une mutation, le snapshot du contexte courant est rechargé.

| Commandes                                       | Champs principaux du payload                                                                                                                                          |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product.save`, `product.archive`               | `id?`, `brand`, `model`, `variant`, `condition`, `price`, `threshold` ; archivage : `productId`, `reason`                                                             |
| `stock.entry`                                   | `productId`, `quantity`, `cost`, `imei?`, `reason?`                                                                                                                   |
| `stock.adjust`                                  | `productId`, quantité comptée `quantity`, `reason` obligatoire                                                                                                        |
| `stock.transfer`                                | `productId`, `quantity`, `destination`, `reason` ; transfert atomique                                                                                                 |
| `stock.import`                                  | `rows[]` : `brand`, `model`, `variant`, `quantity`, `cost`, `price` ; import atomique, toutes lignes validées                                                         |
| `sale.create`                                   | `lines[]` : `productId`, `quantity`, `price`, `imei?` ; `discount`, `clientId?`, `method`, `paid`, `payments?[]` : `method`, `amount`                                 |
| `sale.refund`                                   | `id`, `reason` ; remboursement intégral et retour du stock ; une reprise composite exige son propre traitement serveur                                                |
| `trade.create`, `buyback.create`                | `brand`, `model`, `variant`, `condition`, `value`, `price`, `imei?`, `clientId?`, `method` ; troc : `productId` sortant                                               |
| `purchase.create`                               | `supplierId`, `reference?`, `date`, `lines[]` : `productId`, `quantity`, `cost` ; `paid`, `method`, `dueDate?`, `documentId?` ; quantités immédiatement réceptionnées |
| `supplier.save`, `client.save`                  | `label`, `phone?`, `email?`                                                                                                                                           |
| `expense.create`, `expense.reverse`             | `label`, `category`, `account`, `amount`, `method`, `date`, `documentId?` ; extourne : `id`, `reason`                                                                 |
| `payment.create`                                | `sourceId`, `amount`, `method`, `date` ; dette ou créance existante                                                                                                   |
| `cash.open`, `cash.close`, `cash.movement`      | `amount` ; clôture : `reason` si écart ; mouvement : `direction`, `method`, `reason`                                                                                  |
| `entry.save`                                    | `id?` pour un brouillon existant, `date`, `journal`, `label`, `lines[]` : `account`, `label`, `debit`, `credit`                                                       |
| `entry.post`, `entry.reverse`                   | `id` ; extourne : `date`, `reason`                                                                                                                                    |
| `account.save`, `account.toggle`, `period.lock` | Compte : `number`, `label`, `accountType`, `normal` ; changement d’état : `id`                                                                                        |
| `team.invite`, `team.update`                    | `label`, `email`, `role`, `stores[]`, `permissions[]` ; mise à jour : `id`, `status`                                                                                  |
| `store.save`, `settings.save`                   | Boutique : `label`, `city` ; entreprise : `name`, `country`, `timezone`, `splitPayments`, `fiscalEnabled?`                                                            |

## Montants et calcul comptable autorisé

Décision utilisateur du 16 septembre 2026 : le moteur comptable côté navigateur est autorisé, malgré la mention hors périmètre du PDF. Le PDF original est inchangé.

Les montants typés échangés sont des **entiers en unités monétaires mineures** : `1234` signifie 1 234 FCFA pour XOF et 12,34 EUR pour EUR. Les champs de saisie convertissent selon la devise. Les agrégats ne confondent pas CA, coût du stock, marge, résultat et trésorerie.

`accounting.ts` contient le calcul monétaire, la validation débit/crédit, la validation de période ouverte, la balance avec ouverture, le grand livre cumulatif et les indicateurs. Le moteur local permet l’interaction immédiate ; l’API reste responsable de la validation transactionnelle, des périodes verrouillées, de la comptabilisation officielle et des arrondis configurés.

Le jeu de comptes et les mappings de `demo.ts` sont **des exemples de démonstration**, non un paramétrage fiscal universel : stock, client, fournisseur, caisse, Mobile Money, banque, ventes, coût des marchandises, charges et virements internes. Aucune taxe nationale unique n’a été inventée. Les opérations de démonstration appliquent un coût moyen arrondi ; une valorisation officielle doit utiliser la politique serveur et gérer les reliquats d’arrondi.

## Documents, fiscalité et télémétrie

- `POST /documents/upload-url` : `{name,size,mime,storeId}` → `{uploadUrl,documentId}`. Le navigateur téléverse directement via `PUT` vers le stockage autorisé. Seul `documentId` est envoyé à la commande. Limite UI : 10 Mo, PDF/JPEG/PNG.
- `POST /fiscal/test` : `{organizationId}`. Réponse sans clé/token. La configuration des secrets de connexion est opérée sur le service métier. Le frontend fournit activation et test, et affiche e-MECeF uniquement si autorisé/activé.
- `POST /telemetry` : `{kind:'ui_error',digest}`. Ne reçoit ni message d’erreur brut, ni état de formulaire, ni données financières.
- Reçus : aperçu, impression navigateur et sauvegarde PDF via la boîte de dialogue d’impression. Aucune URL publique ou transmission WhatsApp n’est créée.

## Erreurs et contrôles

401 → retour à la connexion. 403 → accès refusé. 409 → conflit et invitation à actualiser. 422 → validation. 503 → service non configuré/indisponible. Les erreurs backend brutes sont remplacées par des messages compréhensibles.

Le proxy applique une liste de routes autorisées, refuse les écritures d’une origine différente, limite la taille des corps et ne met pas les réponses métier en cache. Il n’est pas une implémentation de RLS : l’isolation multi-entreprises, la gestion des sessions, la validation des commandes et les tests de sécurité backend restent indispensables.

La PWA met uniquement les assets `/_next/static/` en cache. Elle n’enregistre aucune vente hors ligne et ne stocke aucune donnée financière en localStorage.

## Ajouts UX du 17 septembre 2026

Ces ajouts définissent le contrat attendu ; ils ne constituent pas une implémentation du service métier.

- `POST /sales/quote` reçoit `{organizationId,storeId,lines,discount}` et retourne `{requiresApproval:boolean}`. Recalculer avec les coûts courants côté serveur sans les communiquer au caissier. Le devis n’autorise pas une vente : `sale.create` doit refaire tous les contrôles atomiquement.
- Permission `sales.sell_below_cost` : le moteur de démonstration exige cette permission **et** `priceOverrideReason` si une ligne, après répartition de la remise, est vendue sous son coût. Conserver le motif dans l’audit. Le serveur doit appliquer la même règle.
- `sale.create` reçoit aussi `cashTendered?`, `dueDate?`, `priceOverrideReason?`. La réponse `sale` contient `cashTendered`, `cashChange`. Seul le montant effectivement encaissé alimente les paiements et les comptes ; la monnaie n’est pas une vente supplémentaire.
- `sale.return` reçoit `{id,reason,method,lines:[{lineIndex,quantity,restock}]}`. Recalculer les valeurs depuis la vente originale, les remises et les retours précédents ; verrouiller la vente et les stocks durant la transaction. Le client ne décide ni du coût ni de la valeur de remboursement.
- Retour : diminution prioritaire du solde impayé, puis remboursement de l’excédent. La politique retenue est explicite dans l’écran. `restock:true` réintègre le stock revendable et son coût ; `false` ne le réintègre pas. Les articles de reprise/troc exigent un traitement composite distinct, toujours exclu de ce retour simple.
- `Sale.returns[]` contient `id,date,reason,amount,cashRefund,creditReduction,method,lines[]`. Chaque ligne ajoute `value,cost` calculés. Statut intermédiaire : `partially_refunded`. `total` et `paid` gardent l’historique original ; les valeurs nettes et le solde sont calculés à partir des retours.
- `sale.refund` reste accepté par le moteur démo comme retour de toutes les quantités restantes, revendables. Le nouveau parcours UI utilise `sale.return` et exige le choix de l’état.
- `product.save` accepte `supplierId?`, `reorderTarget?` ; garantir une cible entière et une référence fournisseur appartenant à l’organisation. La proposition ne réserve ni ne commande de stock.
- `cash.close` reçoit `reconciledMethods:string[]` pour tous les modes non espèces rencontrés depuis l’ouverture. Enregistrer les confirmations, le comptage, le montant théorique, l’écart, le motif et `closedAt`. Le serveur doit calculer sa propre liste et gérer les paiements concurrents.
- Unicités à garantir côté serveur : produit actif par boutique/marque/modèle/variante/état ; contact par téléphone normalisé ou email ; facture par fournisseur/référence ; IMEI déjà vendu non retourné comme revendable. Un contrôle UI ou démo ne remplace pas une contrainte transactionnelle.
- La vue `/sales/credits` ignore le filtre de période de l’écran. Le snapshot doit donc inclure **toutes les créances encore ouvertes** du périmètre autorisé, même anciennes. Pour les grands volumes, fournir un endpoint paginé dédié avant mise en production ; ce raccordement n’est pas implémenté ici.
- Les indicateurs commerciaux présentent le montant net des ventes sélectionnées, après leurs retours. Le résultat comptable suit la date des écritures : un retour d’une vente d’un mois antérieur peut donc produire un écart légitime entre ces deux vues. Les agrégats `reporting` du serveur doivent documenter et conserver cette distinction.
