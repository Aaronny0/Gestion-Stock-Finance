# Registre des divergences — aucune correction implicite

Constats du8 octobre2026. Toutes ces divergences sont signalées avant une éventuelle correction ; la présente mission documente et protège, sans arbitrage graphique ni changement de sécurité.

| ID | Sources en contradiction | Constat / décision requise |
| --- | --- | --- |
| D01 Version | Titre HTML / DESIGN.md Claude | 2.0 vs2.1 ; nom documentaire2.0 conservé, versions originales inchangées |
| D02 Primaire | HTML / scale600 et handoff / auth actuelle | Fonctionnelle007176 vs marque/token057176 ; auth choisit057176 ; aucune équivalence silencieuse |
| D03 Surfaces | HTML / palette JSON | backgroundf9f9fc contre HEX du token handoff ; foreground0a1a1b contre HEX handoff ; conserver couples exacts par source |
| D04 Sémantiques | HTML / handoff | Info0070b5/e4f5ff vs0470a5/e8f5fe ; destructive douceffede9 vsfeeeec ; warningfff2d6 vsfff2d9 |
| D05 Typo | DESIGN.md / HTML | Titre28/34 vs30/1.15 ; méta12/16/500 vs12.5/400 ; auth32 et30mobile |
| D06 Tables | DESIGN.md§9 / §14 et Ventes | Ligne52 vs60 ; cartes sous768viewport vs contenu utile<900 ; ne pas fusionner seuils |
| D07 Élévation | Règle carte bordure seule / handoff et Auth | Token shadow-card non nul en light ; stock auth bordure+ombre ; INPUT actuel border+shadow-sm |
| D08 Rayons | Règles / handoff / frontend | 8/12/18 ; handoff ajoute base10 et sm6 ; frontend xl16 ; illustration auth14 et Google10 |
| D09 Mouvement | Règle120–200 / Auth | Formulaire220ms, reçu/stock500ms ; spinners/pulse cycliques ; exceptions documentées |
| D10 Split auth | DESIGN.md / HTML et frontend | 5/7 décrit contre44% max640 px réalisé ; seuil960 cohérent |
| D11 Global actuel | DESIGN.md racine / tokens frontend / Claude | Racine corail, tokens indigo5551c5 +DM Sans, cible pétrole+Geist/Bricolage ; aucune migration dans cette mission |
| D12 Rail actuel | product.css / Claude | Rail sombre25263b et active454365 contre rail claireff6f6, accentd2ecee, barre3 ; code barre2 |
| D13 Dimensions actuelles | PageContainer/AppSidebar / Claude | 1680 vs1440 ; rail w-64 en rem vs248 px ; repli72 px cohérent ; topbar h-16 en rem vs64 px ; tête rail72 |
| D14 Dark | Handoff / application | Handoff light+dark complet ; tokens globaux sans.dark ; auth light forcé ; pas de dark produit certifié |
| D15 Charts | Mapping et charts actuels / Claude | chart2 nommé success et utilisé marge, code vert historique contre marge magenta ; CA AreaChart vs histogramme cible |
| D16 Statuts | DS HTML / Ventes / StatusBadge | Exemple destructive Remboursée dans DS ; Ventes rembourse neutre et crédit warning, Retour partiel info ; garder sémantique métier explicite |
| D17 Permissions | Annotation HTML / DESIGN.md / code | Marge parfois propriétaire seulement contre analytics.cost_margin_read ; serveur autorité ; comptable Trésorerie design lecture mais cash.open_close manquant dans defaults |
| D18 Sidebar B | Proposition alternative / standard | 312/68 et double rail sont une proposition, pas248/72 validé |
| D19 Ancienne documentation | docs/design-system.md / fichiers actuels | Référence Phase1 déclare tokens autorité et extractions features/* ; certains chemins absents ; documentation officielle nouvelle hiérarchie |
| D20 Signup | Maquette / activation réelle | CTA de création espace immédiat doit rester Envoyer ma demande ; activation administrative obligatoire |
| D21 Tactile | Règle44 / contrôles existants | Bouton design desktop40, classe code small h-9 en rem, nav min34 ; vérifier zone réelle44 ; aucune conformité tactile globale déduite |
| D22 Contrastes | JSON/MD / exemples HTML et code | Ratios31couples du handoff ne certifient ni HEX alternatifs, ni indigo, ni alpha composés |
| D23 Logo | Logo fourni / note DESIGN.md | Violet toujours fourni, recoloration pétrole suggérée seulement ; conserver original |
| D24 Unités rem | Base14 px / utilitaires Tailwind | Ne pas convertir h-16 en64 px ou w-64 en256 px sans vérifier le root. Avec --spacing:.25rem et root14 : h-16=56 px, w-64=224 px, px-4/6/8=14/21/28 px ; cibles en pixels du design distinctes. |

Pour arbitrer : citer ID, fichiers/sections, valeur retenue, usages, permission éventuelle et validation explicite. Ajouter une entrée datée ; ne pas supprimer l’historique ni changer les originaux. Si aucune décision n’est fournie, ne pas transformer ce registre en autorisation automatique de refonte.

## Application dashboard — 8 octobre 2026

La demande d’implémenter le dashboard Claude applique la maquette `Tableau de bord.dc.html` uniquement à `/app` et `/demo` (route canonique `/`). D02/D03/D05 : primaire fonctionnelle `#007176`, surfaces HTML, Geist/Bricolage/mono locaux. D12/D13/D24 : rail clair 248/72 px, contexte64 px, contenu1440 px et gouttières32/24/16 px physiques. D15 : histogramme CA pétrole et marge magenta `#d72f92`, valeurs négatives visibles. D17 : marge commandée par `analytics.cost_margin_read`, jamais par le seul nom du rôle. Logo original conservé (D23).

Ces décisions sont isolées dans `src/features/dashboard/dashboard.module.css` ; les valeurs globales, les autres pages et les originaux archivés ne changent pas. D11/D12/D13/D15 restent applicables aux autres modules historiques. La variation comparative n’est affichée que si la période précédente est calculable à partir des données disponibles ; aucun pourcentage fictif n’est ajouté au reporting serveur.

## Décision utilisateur — 9 octobre 2026

La demande explicite de reproduire tous les HTML, accompagnée d’une capture de `Sidebar alternative.dc.html`, approuve D18 : la navigation produit utilise maintenant le double rail 68 + 244 = 312 px, replié à 68 px. Les liens sont filtrés par les permissions existantes ; le panneau montre uniquement la section choisie et la caisse de la boutique active. La recherche interroge les données autorisées déjà chargées, sans recherche serveur inventée.

D02/D03/D11/D12/D13/D24 : les écrans métier utilisent désormais les couleurs HEX et les polices locales des HTML, avec une racine physique de 16 px limitée au workspace et des dimensions explicites. Les pages publiques ne sont pas refondues. Auth applique la primaire fonctionnelle HTML `#007176` ; les archives et le handoff `#057176` restent intacts. Dashboard : gouttière HTML 28 px, blocs et tables denses. Ventes : lignes 60 px, filtres et panneau de détail 460 px ; cartes lorsque la largeur utile devient inférieure à 900 px.

Le contenu métier reste celui des API : pas de chiffres de maquette, de paiements simulés, de fausse activation ou de privilèges supplémentaires. Les documents `Design System.dc.html` et `Rôles et écrans.dc.html` restent des références et matrices consultables dans l’aperçu hors ligne ; ils ne deviennent pas des parcours métier artificiels.
