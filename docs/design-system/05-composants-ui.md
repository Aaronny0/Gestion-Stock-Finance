# Composants UI et états

Sources : [Design System, composants](references/claude-original/Design%20System.dc.html), [Ventes](references/claude-original/Ventes.dc.html), [Auth](references/claude-original/Auth.dc.html). Chemins/API actuels dans [correspondance code](13-correspondance-code.md).

| Composant | Variantes / comportement officiel | États et contraintes |
| --- | --- | --- |
| Bouton | Primaire pétrole, outline secondaire, ghost tertiaire, destructive avec confirmation | Idle, hover, focus, pressed, disabled, loading ; empêcher doubles envois ; texte de chargement explicite |
| Champ | Label au-dessus, aide puis erreur sous champ ; input/select/textarea | 44 px auth, radius8, focus halo3 ; aria-invalid et erreur associée ; autocomplete pertinent |
| Mot de passe | Œil indépendant par champ ; indicateur 4 segments | 12 caractères nouveaux mots de passe ; confirmation identique ; visibilité au clavier ; ne jamais stocker le secret |
| Carte | Surface card, radius12, bordure seule | Pas d’ombre sur carte ordinaire ; zones cliquables nommées |
| Badge | Doux par défaut pour statut, solide pour signal ; pilule | Statut textuel et icône ; pas de sens transmis par la seule couleur |
| Alerte | Warning, destructive, success, info ; douce | Message utile et action quand possible ; erreur globale + erreurs locales |
| Table | Entêtes12 capitales muted, montant à droite, chiffres tabulaires | Tri, recherche, filtres, pagination, sélection/export selon permission ; skeleton/vide/erreur |
| Indicateur / Money | CA héros + variation, devise petite muted ; compteur À traiter + verbe | Source cliquable avec boutique/période conservées ; masquer marge sans permission |
| Graphique | CA/jour histogramme, marge superposée ; palette fixe | Survol lecture ; clic détail filtré ; légende et information textuelle accessibles |
| Menu / popover / tooltip | Élément flottant avec ombre | Clavier, focus visible, fermeture, placement adapté ; délai tooltip actuel300 ms |
| Dialog / AlertDialog | Rayon18 ; mutation destructive confirmée | Nom accessible, modalité, focus capturé/restauré, Escape selon action ; pas de perte silencieuse du brouillon |
| Sheet / Drawer | DetailSheet460 px ou largeur viewport ; liste en contexte | Fermeture clavier/focus ; actions en pied ; mobile sans dépassement |
| Navigation | Rail clair groupé, entrée active accent + barre3 px | Permissions effectives, rôle visible, retour accueil rôle, repli avec intitulé accessible |
| Auth | Shell partagé,6 routes, inscription4étapes | Succès/échec, attente, lien expiré, retour, renvoi, Google uniquement si activé ; vraie intégration |

## API des composants disponibles

`Button` : `variant=default|secondary|outline|ghost|destructive|link`, `size=default|sm|lg|icon`, `asChild`, attributs natifs et ref. Classes default h-11/min-h-11, sm h-9/min-h-9, lg h-12 ; elles correspondent à38.5/31.5/42 px avec html14 px et spacing standard. Les min-height explicites44 px au breakpoint mobile et les variantes icon influencent la taille finale : mesurer le rendu au lieu de supposer un root16 px. La cible tactile reste44 minimum.

`Input`, `Textarea` : attributs natifs/ref ; `Select`, `Checkbox`, `Switch`, `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `DropdownMenu`, `Popover`, `Tooltip`, `Tabs` : primitives réutilisables du dossier ui, façades Radix/Vaul selon fichier. Il n’existe pas de composant générique `Alert` dans ce dossier : les alertes auth sont `AuthNotice`, l’historique `frontend/ui.tsx` a ses propres composants.

`Card` : CardHeader/Title/Description/Content/Footer ; `Badge` : default/secondary/outline/success/warning/destructive/info. `StatusBadge` : value, label facultatif, tone et showIcon ; libellés Payée, À crédit, Retour partiel, Remboursée, Brouillon, Postée, Extournée, Ouverte, Clôturée, Verrouillée.

`DataTable` : colonnes et données, `density=default|comfortable|dense`, `mobileRow`, tri/recherche/export/pagination ; voir sa définition pour l’ensemble des props. Les états ne sont pas tous fournis automatiquement : la page doit traiter le chargement, l’erreur, l’offline et les permissions.

`Money` reçoit des unités mineures et la devise courante/explicite. Réutiliser les calculs métier, ne pas reformater un montant en perdant devise ou précision. `MetricCard`, `EmptyState`, `PageHeader`, `SearchInput`, `DateRangeFilter`, `Skeleton`, `Toaster` complètent ce socle.

## Écarts à ne pas cacher

Input actuel porte bordure + shadow-sm ; Card porte une classe d’ombre mais token actuel `none` ; Badge consomme les anciens `*-background` ; le handoff `.dark` et les nouveaux `*-muted` ne sont pas encore installés. Aucun de ces constats n’autorise une migration globale dans une demande locale.
