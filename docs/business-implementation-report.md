# Livraison métier — 6 octobre 2026

Ce document remplace les constats « seules deux commandes équipe sont implémentées » des rapports précédents. L’architecture existante est conservée. Le moteur de démonstration ne constitue pas la preuve d’implémentation serveur.

## Commandes et persistance

Les 30 commandes du contrat frontend possèdent désormais un schéma Zod, une permission serveur et un handler :

| Domaine | Commandes |
| --- | --- |
| Catalogue et stock | product.save, product.archive, stock.entry, stock.adjust, stock.transfer, stock.import |
| Ventes et reprises | sale.create, sale.return, sale.refund, trade.create, buyback.create |
| Achats et contacts | purchase.create, supplier.save, client.save |
| Finance | payment.create, expense.create, expense.reverse, cash.open, cash.close, cash.movement |
| Comptabilité | entry.save, entry.post, entry.reverse, account.save, account.toggle, period.lock |
| Administration | store.save, settings.save, team.invite, team.update |

Une commande vérifie la membership active, l’entreprise, la boutique et sa permission **dans sa transaction Serializable**. Le verrou transactionnel par entreprise et les retries des conflits protègent les invariants multi-connexions. Le reçu d’idempotence est durable, lié à l’acteur et au hash canonique du payload ; réutiliser la même clé avec un autre contenu est refusé. Reçu, opération, mutations, paiements, écritures et audit sont atomiques. Aucun secret ni coût d’acquisition n’est renvoyé dans le reçu de vente.

Les quantités disponibles et la valeur du stock sont distinctes. Les coûts sortants conservent les reliquats entiers jusqu’à la dernière unité. Les retours partiels restituent exactement les valeurs et coûts cumulés, réduisent la dette avant remboursement et excluent les unités défectueuses du stock disponible. Les IMEI suivis utilisent leur coût réel ; un transfert déplace leur fiche sans supprimer leur historique. Un troc ne peut être annulé que si les deux appareils sont restituables. Un retour revendable réactive son produit archivé ; une collision avec une nouvelle identité catalogue active est refusée explicitement. Les stocks, créances et paiements excessifs sont refusés.

## Comptabilité

L’onboarding initialise les comptes techniques, quatre journaux, cinq mappings de paiement et l’exercice annuel. Les anciennes entreprises sont complétées au premier appel métier. Les comptes incluent stock, client, fournisseur, caisse, banque, Mobile Money, virements internes, capital, ventes, coût des marchandises, charges, TVA et écarts positifs de caisse.

Les opérations financières produisent des écritures équilibrées, postées et protégées par les contraintes SQL existantes. Les comptes inactifs, les périodes verrouillées et les écritures déséquilibrées sont refusés. Une écriture manuelle peut être enregistrée, modifiée tant qu’elle est brouillon, postée puis extournée. Une opération métier doit être annulée par son retour/extourne métier pour conserver la concordance stock/finance.

La première ouverture de caisse rapproche son solde initial avec le compte technique 581 ; ce compte doit être ventilé par le comptable selon l’origine réelle des fonds. Une réouverture différente du solde précédent exige un motif. Les écarts à la clôture sont comptabilisés et les moyens électroniques doivent être rapprochés. Le plan initial est un paramétrage technique, dont les libellés/comptes complémentaires peuvent être adaptés dans l’application ; sa validation comptable selon l’entreprise relève de son responsable.

## HTTP et frontend

`POST /commands`, `POST /sales/quote`, `GET /workspace`, `POST /documents/upload-url`, `POST /documents/complete`, `POST /documents/download-url`, `POST /fiscal/test` et `POST /telemetry` fonctionnent dans le runtime Supabase. Les routes d’identité/invitation existantes restent conservées.

Les formulaires projettent uniquement les champs du contrat serveur. Les achats utilisent leurs lignes ; les transferts et trocs acceptent les IMEI concernés ; les mouvements de caisse portent un compte de contrepartie. Les messages métier français de validation sont affichés. Les reçus utilisent les montants définitifs du serveur.

Workspace est paginé côté SQL : 250 lignes par collection par défaut, taille autorisée 1–500. Les collections sont ordonnées et une version d’opérations détecte une mutation entre pages. Le frontend assemble les pages et reprend le chargement après conflit, sans présenter une première page comme un résultat complet. Les vues existantes qui nécessitent tout leur historique restent alimentées par cet assemblage. Les agrégats du tableau de bord sont calculés sur l’ensemble autorisé en base et ne dépendent pas de la première page. Les ventes et retours sont affectés à leur date réelle : un retour d’une ancienne vente diminue le revenu de la période du retour. La TVA est exclue du revenu et le résultat provient des écritures. Les filtres frontend suivent cette même chronologie. Cette stratégie limite les réponses, sans prétendre éliminer tout coût mémoire des vues historiques du navigateur.

## Storage privé

Deux adaptateurs : fichiers locaux privés pour les tests/développement, Supabase Storage privé en production. Réservation UUID scoped → URL signée → PUT direct → validation serveur du contenu et de la taille → Document uploaded → achat/dépense. Le serveur refuse les fausses signatures PDF/PNG/JPEG, les documents étrangers/non validés et les dépôts trop volumineux. Une clé Storage privée n’est utilisée que côté backend ; elle n’a aucun grant sur les tables métier. Les téléchargements sont signés pour 60 secondes. Les URLs déjà émises sur Supabase restent valides jusqu’à leur expiration.

Le SQL 009 interdit l’accès direct anon/authenticated au bucket documentaire même si une ancienne policy permissive existe ; il laisse le fonctionnement des autres buckets intact. Il ne faut pas installer la stratégie historique Storage direct du script 004 pour cette livraison.

## Fiscalité facultative

Connecteur e-MECeF Bénin/XOF, configuré **par entreprise** via FISCAL_CONFIG_JSON. IFU, token, endpoint officiel, groupe fiscal et taux sont privés. L’activation est refusée sans configuration compatible. `/fiscal/test` vérifie le compte, l’expiration du token et le taux renvoyé par le fournisseur, sans divulguer de secret.

La commande de vente écrit une demande fiscale durable dans sa transaction ; le worker traite l’émission hors de cette transaction. Les remises sont réparties en articles entiers sans perdre de montant. Le UID fournisseur est enregistré avant confirmation ; une initialisation ambiguë est recherchée dans les demandes en attente avant une nouvelle création. Les données récupérées doivent correspondre à la demande VORTEX. Les erreurs sont expurgées et réessayées avec temporisation. Les retours produisent des avoirs liés au code DGI de la facture originale ; une facture émise n’est pas simplement marquée « annulée » localement. TVA, UID et éléments de sécurité sont conservés. L’interface et le reçu imprimable affichent l’état réel, l’IFU, la TVA, le code DGI et un QR encodé à partir des données du fournisseur. La détection des ventes à perte compare le revenu HT au coût.

Source du contrat fournisseur : [OpenAPI DGI](https://developper.impots.bj/sygmef-emcf/swagger/v1/swagger.json). Les tests du contrat utilisent un fournisseur simulé et couvrent un timeout après création. L’homologation et la recette réelle avec le compte fiscal de l’entreprise restent des opérations personnelles. Aucun autre pays/prestataire n’est activé implicitement.

## Throttling

Deux quotas par route : périmètre réseau 1 200/minute et identité vérifiée 120/minute. La clé utilisateur repose sur issuer/sub vérifiés, pas sur le JWT brut ; la rotation du token ne réinitialise pas le quota. Les JWT invalides restent groupés par IP. X-Forwarded-For fourni par un client n’est pas considéré comme fiable. La limitation précède le guard de session. Les tests HTTP couvrent deux utilisateurs derrière le même proxy et les tentatives de falsification.

Le stockage des quotas est en mémoire par instance NestJS. La livraison cible une instance backend ; passer à plusieurs instances avec un quota global demanderait une évolution de capacité, hors recette de cette instance. Cela n’affecte pas l’idempotence ni les transactions, qui sont partagées dans PostgreSQL.

## Migrations et sécurité

Deux migrations additives : opérations métier (réduction de troc et unicité d’extourne) et livraison fiscale (TVA, avoirs, demandes, sécurité, leases/reprises). Dix migrations au total. Aucun modèle supplémentaire non classifié : le SQL 007 conserve les grants privés des modèles existants et la fermeture de la Data API. Le SQL 009 est testé séparément avec des rôles anonymes/authentifiés.

Les vérifications finales et les tâches personnelles sont consignées dans [final-project-audit.md](final-project-audit.md).
