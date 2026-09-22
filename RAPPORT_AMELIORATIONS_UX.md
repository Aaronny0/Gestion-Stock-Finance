# Améliorations du frontend — 17 septembre 2026

## Périmètre et décision

Améliorations réalisées à la demande de l’utilisateur sur le frontend Vortex existant. Le PDF d’origine reste inchangé. L’autorisation explicite du moteur comptable côté navigateur reste applicable. La palette de l’application est indépendante de la marque et de l’icône Vortex.

Le frontend et sa démonstration sont exécutables. Le service métier de production n’est toujours pas fourni/configuré dans ce projet : les règles démontrées devront être appliquées également par ce serveur. Aucun déploiement public, envoi de message, migration de compte ou modification de données externes n’a été effectué.

## Palette retenue

Fonds neutres, texte ardoise, indigo pour les actions et des couleurs sémantiques pour les états. Les couleurs de statut sont toujours accompagnées d’un texte et d’une icône. Les retours et les clôtures ne sont plus automatiquement assimilés à des erreurs.

| Usage | Texte ou couleur | Fond | Contraste mesuré |
|---|---|---|---|
| Texte principal | `#172033` | `#FFFFFF` | 16,27:1 |
| Texte secondaire | `#475569` | `#F5F7FB` | 7,07:1 |
| Action principale | `#FFFFFF` | `#4F46E5` | 6,29:1 |
| Succès | `#166534` | `#ECFDF3` | 6,76:1 |
| Attention | `#92400E` | `#FFFBEB` | 6,84:1 |
| Erreur | `#B42318` | `#FEF3F2` | 6,05:1 |
| Information | `#1D4ED8` | `#EFF6FF` | 6,16:1 |

Ces sept paires dépassent la cible de 4,5:1 pour le texte courant décrite par le [W3C](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum). Cela ne constitue pas un audit complet de conformité WCAG de chaque écran.

La variable `--brand` est réservée au symbole Vortex. Les actions utilisent une autre variable. Les petites tailles de texte ont été augmentées, les axes des graphiques assombris, les champs mieux délimités et le focus clavier rendu visible. Les animations respectent la préférence de réduction des mouvements.

## Parcours améliorés

### Encaissement

- Saisie des espèces remises et calcul de la monnaie à rendre, y compris avec deux modes de paiement.
- Affichage dans la confirmation et le reçu. Le paiement comptabilisé reste le montant de la vente effectivement encaissé.
- Échéance facultative des ventes à crédit.
- Vente sous le coût : contrôle par ligne après remise, permission responsable et motif obligatoires.
- En production, demande d’un devis au serveur sans exposer les coûts au caissier ; revalidation obligatoire lors de l’enregistrement.
- Vérification de la longueur et de l’unicité des IMEI suivis. L’IMEI demeure facultatif pour un stock groupé.

### Retours partiels

- Choix des articles, quantités et état revendable ou défectueux.
- Contrôle des quantités déjà retournées ; refus d’un double retour.
- Répartition exacte des remises et arrondis en unités monétaires mineures.
- Réduction prioritaire de la créance, remboursement du reliquat.
- Réintégration du stock uniquement pour les articles revendables ; les articles défectueux conservent leur coût en charge dans le moteur démo.
- Confirmation, motif et historique visibles sur la vente ; montant net et solde recalculés.
- Indicateurs, analyses, classement des produits, créances et sélecteur de règlement prennent les retours en compte.

### Suivi quotidien

- Vue **Crédits et échéances** depuis les ventes : soldes ouverts, client, échéance, retard et accès au règlement.
- Vue **Réapprovisionnement** depuis le stock : disponible, seuil, cible, quantité suggérée et fournisseur habituel.
- Préparation d’un achat avec valeurs proposées, modifiables avant confirmation. Aucun envoi automatique au fournisseur.
- Fiche produit enrichie avec cible et fournisseur habituel.
- Clôture guidée : comptage des espèces, écart, rapprochement des modes électroniques et commentaire obligatoire en cas d’écart.
- Liste de mise en route repliable pour le propriétaire : organisation, stock, équipe et ouverture de caisse.
- Détection des doublons dans le moteur démo : produits actifs, contacts, références de facture et IMEI.

### Protection des saisies

- Panier, formulaires d’action, retours, paramètres et éditeur comptable signalent leurs modifications non enregistrées.
- Confirmation avant fermeture d’un formulaire modifié, navigation par les liens de l’application, changement de boutique, d’organisation, de rôle ou de période.
- Protection native du navigateur au rechargement ou à la fermeture, selon les restrictions du navigateur.
- Aucun brouillon financier persistant en localStorage. Le bouton Retour/Avancer de l’historique navigateur n’est pas intercepté : cette limite demeure à traiter séparément. L’import CSV conserve son parcours existant et n’a pas reçu cette nouvelle garde.

## Vérifications

- **24 tests métier réussis** : les 16 tests existants et 8 nouveaux tests couvrant monnaie, vente à perte, retours partiels, arrondis, règlement après retour, doublons, clôture et échéances.
- TypeScript, ESLint et compilation Next.js de production vérifiés.
- Recette existante : 24 routes métier, arrivage de 2 000 unités puis vente de 3, permissions, isolation des boutiques, écritures, graphiques, impression et comportements sans backend.
- Recette UX supplémentaire : conservation/abandon du panier, monnaie sur reçu, retour et historique, accès aux crédits et au réapprovisionnement, changement de boutique protégé.
- Nouvelles vues vérifiées aux largeurs **360, 768 et 1 440 px**, sans débordement horizontal détecté.
- Sept paires sémantiques mesurées automatiquement. Captures bureau et mobile inspectées.
- Aucune erreur JavaScript observée dans les parcours automatisés.

Preuves : [recette générale](output/frontend-qa/browser-results.json), [recette UX et contrastes](output/frontend-qa/ux-results.json), captures dans `output/frontend-qa/`.

## Fichiers principaux

- `src/app/globals.css` : palette, lisibilité, focus et responsive.
- `src/frontend/operations.ts` : retours, répartition des montants, solde, monnaie, échéances et propositions de réapprovisionnement.
- `src/frontend/returns.tsx`, `workflows.tsx` : nouveaux parcours.
- `pos.tsx`, `forms.tsx`, `provider.tsx`, `settings.tsx`, `accounting-page.tsx` : saisies et garde des modifications.
- `demo.ts`, `types.ts`, `accounting.ts`, `analytics.tsx`, `dashboard.tsx`, `pages.tsx`, `ui.tsx`, `charts.tsx`, `shell.tsx` : règles, affichage et intégration.
- `src/app/api/v1/[...path]/route.ts` : route de devis autorisée dans le proxy.
- `tests/accounting.test.cjs`, `tests/browser-ux.cjs` : couverture supplémentaire.
- [Contrat API actualisé](docs/frontend-api.md).

Sauvegarde antérieure aux changements : `docs/archives/frontend-avant-ameliorations-ux.tar.gz`. Le dossier ne possède pas de dépôt Git ; aucun commit n’a été créé.

## Limites de production

Le contrat décrit les nouveaux champs et contrôles serveur, les droits, la validation concurrente et la nécessité de récupérer les créances ouvertes anciennes. Le backend, ses contraintes d’unicité, ses transactions, la persistance, les migrations et ses tests restent à implémenter/raccorder. Les calculs de démonstration ne prouvent pas leur mise en œuvre en production. Les intégrations fiscales restent celles documentées lors de la première phase.

Le CA commercial net porte sur les ventes sélectionnées après leurs retours ; le résultat comptable porte sur les écritures de la période. Leur différence doit être expliquée lorsqu’un retour concerne une période antérieure.
