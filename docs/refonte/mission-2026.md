# Refonte produit VORTEX

## Sources et inventaire
Sources lues : AGENTS.md, docs/SKILL.md (le chemin skills/vortex-ui-ux/SKILL.md n'existe pas), docs/VORTEX-FRONTEND-SPEC.md. Aucun changement aux documents fournis.

Architecture : Next 16 App Router, root layout avec AuthProvider Supabase, WorkspaceProvider et shell. Les routes historiques et catch-all distribuent les modules via frontend/pages.tsx. Modules séparés dans features, primitives Radix/TanStack et compatibilité CSS legacy. Démo locale via createDemo/executeDemo, aucune mutation distante requise. API Next en proxy vers NestJS, bearer Supabase, origine des mutations et idempotence conservés. Rôles et boutiques filtrent données/actions ; contrôle final backend.

Fonctions à conserver : devis/vente, reçu, paiement fractionné, remboursement partiel, dette client, achats et dettes fournisseurs, troc/rachat, transferts/ajustements/imports, écritures équilibrées, clôtures, exports, invitations, paramètres fiscaux, filtres persistants et protection des brouillons. Certains anciens modules frontend sont doublés par features ; ne pas les supprimer sans démontrer l'absence d'import.

Diagnostic : racine privée sans présentation ; inscription mélangeant identité, entreprise et boutique ; email confirmé conduisant à onboarding sans approbation. Dashboard avec plusieurs panels équivalents et alertes sous la ligne de flottaison. Sidebar longue, contraste faible, actions principales peu distinguées. Mélange de styles legacy et composants récents. Formulaires, tableaux mobiles, dialogues et logique financière constituent des bases réutilisables.

## Direction
Palette : encre #25263b, indigo #5551c5, papier #f5f5f0, surface #ffffff, jade #22735d, ambre #956019. Typographie sans serif précise, valeurs tabulaires, titres courts ; pas de police externe bloquante. Signature : rail indigo, repère V angulaire, aperçu d'activité associant chiffre principal, courbe et file d'attention. Surfaces ouvertes et séparateurs pour les données, panels réservés aux zones de travail.

Dashboard : titre/actions, période, puis zone principale à deux colonnes (revenu + courbe / priorités), bande de flux financiers, journal des dernières ventes. Mobile : navigation tiroir, priorités lisibles, filtres repliables, une colonne. Site : produit visible immédiatement, liens vers démo réelle. Auth : une seule colonne de formulaire.

Hypothèses : application principalement desktop, mobile 4G pour consultation/vente ; vitrine indexable, app privée. Cibles de conception (non mesures terrain) : LCP 2500 ms, INP 200 ms, CLS 0.1 au p75, WCAG AA avec revue par l'agent puis validation propriétaire, Lighthouse accessibilité 90/performance 80, budget JS initial 200 KB gzip app / 150 KB public. Conservation de Next/RSC et charts chargés dynamiquement, aucune nouvelle dépendance UI.

## Accès implémenté
L’inspection initiale ne trouvait ni demandes, ni approbation, ni Back Admin prospects. La refonte ajoute une administration dédiée à `/admin/access`, protégée par `app_metadata.vortex_admin === true` vérifié côté serveur. Les demandes sont des identités Supabase portant les coordonnées de demande dans `user_metadata`. Ces données modifiables ne constituent jamais une autorisation. Les décisions sont enregistrées dans `app_metadata.vortex_access_status`, avec auteur, date et motif de la dernière décision.

L’accès est vérifié dans le proxy Next ET dans NestJS sur le profil Supabase courant : un JWT antérieur à une suspension ne suffit pas. L’onboarding exige explicitement APPROVED. Les comptes existants sans statut sont conservés uniquement lorsqu’une appartenance active est confirmée par le backend. Les invitations métier existantes sont conservées.

Les notifications d’approbation utilisent la file chiffrée existante du backend et le worker SMTP. Le Back Admin distingue décision enregistrée, notification en file et file indisponible. L’activation de la configuration et un essai de livraison réel restent des opérations de recette de l’environnement cible.
