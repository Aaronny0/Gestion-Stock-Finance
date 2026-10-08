# Intégration des références Claude — 9 octobre 2026

La demande utilisateur du 9 octobre, avec la capture de Sidebar B, remplace le périmètre limité au dashboard de la livraison précédente. Les six HTML et DESIGN.md du dossier Claude ont été lus ; leurs archives restent intactes et leurs empreintes sont vérifiées.

| Référence | Application |
| --- | --- |
| Sidebar alternative.dc.html | Double rail de 68 px + panneau de 244 px, repli à 68 px, sections filtrées, organisation/boutique, recherche ⌘/Ctrl K, vente rapide, caisse et profil. Le prototype illustratif et ses notes ne sont pas copiés dans le contenu métier. |
| Tableau de bord.dc.html | Composition, densité, typographie, filtres 7/30 jours, attention, performance, histogramme, caisses, moyens d’encaissement, dernières ventes et stock critique. |
| Ventes.dc.html | Titre, quatre totaux, recherche référence/client/IMEI, périodes, statuts/comptages, tri, export autorisé, pagination, lignes de 60 px et cartes mobiles, panneau de 460 px avec articles, client, paiements, marge autorisée et actions. |
| Auth.dc.html | Les six parcours déjà intégrés sont conservés : connexion, inscription multétape, récupération, réinitialisation, vérification email, activation par invitation. Primaire fonctionnelle HTML `#007176` appliquée. |
| Design System.dc.html | Palette, polices locales, surfaces, dimensions et composants appliqués au workspace. Catalogue original consultable dans l’aperçu documentaire hors ligne. |
| Rôles et écrans.dc.html | Matrice de visibilité et accueil par rôle confrontés aux permissions réelles ; document original consultable dans l’aperçu documentaire. Aucun privilège inventé. |

Les labels clients utilisent le champ métier `label`. Les totaux viennent de `salePosition`, les paiements des données workspace, la caisse du contexte courant et la marge de la permission `analytics.cost_margin_read`. Les montants ISO des nouveaux composants conservent la conversion des unités mineures. Les reçus fiscaux, QR, TVA et retours partiels existants restent disponibles.

Le site public et les handlers d’authentification/API/Supabase ne sont pas refondus par ce travail. Le thème du shell couvre les autres pages métier sans inventer une maquette spécifique qui n’existe pas dans les sources.

## Vérification

- TypeScript : vérifié lors du build de production et par `tsc --noEmit`.
- Lint : aucune erreur ; deux avertissements préexistants (TanStack/React Compiler et navigation Google).
- Tests unitaires : 55 réussis (comptabilité, auth, historique).
- Références documentaires : 17 archives, 78 dépendances locales et 174 liens vérifiés, aucune erreur.
- Authentification : six routes, huit dimensions, validation, chargement/erreur, inscription multétape et reprise du brouillon, récupération/renvoi, réinitialisation et invitation.
- Accès : démo isolée, accueil public, validation administrative obligatoire, demande en attente, suspension et onboarding approuvé.
- Dashboard : cinq largeurs de 320 à 1440 px, périodes, entrée réelle de stock, navigation vers les ventes du jour, marge par permission, activité vide et absence d’exception navigateur.
- Navigation : 20 contrôles, 17 menus sur quatre dimensions/orientations, cinq rôles, historique, filtres conservés et protection des brouillons.
- Métier : 14 contrôles smoke et 11 contrôles UX, dont vente/stock, caisse, reçus, retours partiels, crédits, achats, séparation des boutiques et comptabilité équilibrée.
- Ventes et composants partagés : rail de 312/68 px, changement de section, recherche IMEI, détail de 460 px, lignes de 60 px, filtres et pagination, restauration du focus, quatre largeurs, permissions de marge, formulaire de règlement, effacement des filtres, chargement et reprise après erreur ; devises, sélection clavier, pagination au retour et facturation fiscale/TVA/QR.
- Matrice générale : 48 pages × 13 formats (320 à 1920 px, portrait et paysage), soit 624 contrôles, aucun débordement ni exception navigateur.
- Contrastes : sept paires mesurées sur les tokens effectivement appliqués, toutes supérieures à 4,5:1.
- Formulaires responsive : 53 contrôles et 45 vues complémentaires, dont 17 formulaires sur trois formats ; aucun débordement de dialogue ni exception navigateur.
- Captures locales : `output/claude-integration`, `output/dashboard-design` et `output/frontend-qa` (preuves de validation, non versionnées).

Les tests navigateur utilisent une instance Auth et des données API isolées. Aucune mutation de production, invitation ou transaction réelle n’est utilisée pour valider le rendu. Les parcours Supabase et métier conservent leurs intégrations existantes ; une session de production et ses effets externes ne sont pas certifiés par ces fixtures. Les budgets de performance et Lighthouse ne sont pas mesurés dans cette validation.

Le détail de vente conserve les formulaires métier existants dans son panneau : leur focus, fermeture au clavier et protection des brouillons restent actifs. La matrice complète a également servi à corriger deux débordements causés par le rail élargi à 1024 px (actions de caisse et lien de sécurité), uniquement dans les styles communs. Les modifications étrangères déjà présentes dans le checkout ne font pas partie du commit de cette intégration.
