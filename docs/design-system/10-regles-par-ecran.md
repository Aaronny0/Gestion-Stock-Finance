# Règles par écran

Sources : [DESIGN.md §9–14](references/claude-original/DESIGN.md), maquettes [dashboard](references/claude-original/Tableau%20de%20bord.dc.html), [Ventes](references/claude-original/Ventes.dc.html), [Auth](references/claude-original/Auth.dc.html), [rôles](references/claude-original/R%C3%B4les%20et%20%C3%A9crans.dc.html).

## Tous les écrans métier

Contexte visible (boutique/période), titre + description + une primaire permise. Ordre état → attention → chiffres → détail. Les cinq états sont obligatoires : **chargement** (squelette de même forme), **vide** (phrase + action pertinente), **erreur** (message + réessayer), **hors connexion** (bandeau warning), **accès réservé** (explication + retour à l’accueil autorisé). Ne pas confondre liste vide et panne. Démo : bandeau info-muted sous contexte, visible, avec sélecteur de rôle ; isolation des données réelles.

## Dashboard et accueils de rôle

1. Salutation + date + boutique/période ; Nouvelle vente primaire, Entrée de stock outline selon permissions.
2. À traiter : stock bas, caisses ouvertes, crédits échus, invitations ; compteur + sujet + verbe ; si vide, « Rien d’urgent ».
3. Performance : CA héros + variation vs période précédente ; Encaissements, Cashflow net, Marge brute si analytics.cost_margin_read.
4. Activité2/3 : histogramme CA/jour + marge ; clic → ventes du jour. Caisses/paiements1/3 : état par boutique et Espèces/Mobile Money/Carte.
5. Dernières ventes2/3 (5 dans la maquette principale) + Stock critique1/3 (3 références dans l’anatomie).
6. Checklist de mise en route pour settings.manage tant qu’incomplète : en haut si moins de2 étapes faites, sinon en bas.

« Le chiffre d’affaires n’est pas le bénéfice » en infobulle du libellé CA, pas en encadré décoratif. L’annotation HTML dit parfois « propriétaire seulement » pour marge : la permission fine reste la règle d’autorisation.

## Listes — Ventes, Stock, Clients, Achats, Fournisseurs, Dépenses, Paiements, Audit, Journal

Gabarit A PageHeader → B SummaryStrip (3–4 totaux filtrés) → C FilterBar (recherche, période, statuts avec compteurs, exporter sous permission) → D DataTable/mobileRow → E DetailSheet460 px, actions en pied. Filtres URL, détail conserve contexte, tri/pagination compréhensibles. Ventes : statuts Payée/À crédit/Retour partiel/Remboursée ; export/sélection via exports.create, coût/marge et retour soumis à leurs permissions. Lignes60 dans Ventes contre52 règle générale ; largeur utile900 vs breakpoint768 général, voir registre.

## Pilotage — Analyses, Trésorerie, comptabilité et administration

Analyses/Trésorerie reprennent anatomie dashboard, pas un nouveau langage graphique. Comptabilité garde références mono, montants tabulaires à droite, périodes et actions protégées ; utiliser densité appropriée des tables sans modifier calculs débit/crédit. Administration réutilise listes/formulaires/dialogues et autorisations serveur ; ne pas inventer de maquette spécifique absente des références. Rôle stock : contexte → à traiter → chiffres → détail avec contenu stock ; comptable idem avec contenu comptabilité.

## Authentification — six parcours

| Route | Contenu et interactions | Règle réelle à préserver |
| --- | --- | --- |
| /login | Email/mot de passe, œil, erreur, chargement, Google si activé, oublié, inscription, démo | Session Supabase + décision accès, aucune permission attribuée par UI |
| /signup | Compte → Entreprise → Boutique → Récapitulatif ; validations ; Retour conservant saisie | Envoyer ma demande, brouillon sans mot de passe ; création espace après approbation |
| /forgot-password | Email, envoi, attente/succès/erreur, retour connexion | Message neutre sur existence compte ; resetPasswordForEmail |
| /reset-password | Lien valide/expiré, mot de passe+confirmation, robustesse, succès | Handler serveur vérifie lien ; updateUser réel, déconnexion après changement |
| /verify-email | Consulter email, renvoyer, lien expiré, confirmation réelle | Confirmation email distincte de validation administrative |
| /invite/activate | Organisation/rôle fournis, compte existant/nouveau, changer identité, confirmer email, activer | Inspection invitation + auth/activate ; backend contrôle adresse et rôle |

Shell : panneau clair avec logo/promesse/reçu/stock, formulaire max400, champs44, labels au-dessus, erreurs locales + globale. Sous960 px logo en tête et panneau supprimé. Les onglets de démonstration de la maquette et données préremplies ne sont pas une navigation produit à reproduire. Le backend ne donne pas l’adresse invitée/émetteur/boutique : ne pas inventer. Voir [rapport d’intégration auth](../auth-design-implementation.md).
