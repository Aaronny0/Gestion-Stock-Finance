# Contrôle documentaire — 8 octobre 2026

Mission limitée à documentation, archives et instructions permanentes. Aucun fichier applicatif, token exécuté, schéma ou règle d’accès modifié.

Les vérifications couvrent les 14 chapitres demandés, les six sections du Design System HTML, les §0–14 de DESIGN.md, les variantes Auth/Ventes/Rôles et le statut de proposition de Sidebar alternative. Voir [couverture](couverture.md).

- Manifeste des originaux : 17 fichiers, SHA-256 et taille comparés aux sources fournies.
- Dépendances : React/ReactDOM18.3.1, Babel7.29.0, icônes Lucide static0.469.0, notices/licences et neuf TTF avec licences ; manifeste séparé.
- Valeurs : tous les tokens HEX/OKLCH light/dark, toutes les déclarations handoff, 31 couples de contraste dans chaque thème ; inventaires source des couleurs et styles.
- Liens : 162 liens documentaires internes et chemins de code existants vérifiés par `verify.py`. Les extraits Markdown historiques archivés restent inchangés et ne sont pas un dépôt complet.
- AGENTS : bloc Next.js préservé ; règles officielles au niveau racine frontend, sans AGENTS enfant trouvé dans src/docs.
- Historique : contenu de DESIGN.md racine et docs/design-system.md conservé avec un avertissement et lien vers la nouvelle référence.
- Git : seuls documents, archives, instructions et outils d’aperçu/validation documentaire sont indexés ; modifications préexistantes hors mission conservées.

Commande de validation : `python3 docs/design-system/references/verify.py`. Vérification d’intégrité externe : SHA-256 des 17 copies comparés au dossier fourni. L’aperçu local sert les copies via réécriture des réponses, sans éditer les originaux.

Les tests TypeScript/lint/build applicatifs ne sont pas relancés pour cette mission documentaire : aucun code exécuté par VORTEX ne change. Les derniers résultats auth sont dans le [rapport dédié](../../auth-design-implementation.md), distincts de cette validation. Aucun audit WCAG complet ni refonte visuelle réalisé ; les ratios sont ceux fournis par Claude.

Rendu hors ligne : les six maquettes ont répondu HTTP200 et affiché leurs templates interprétés dans Chromium à1440×1000, sans requête externe, ressource HTTP en erreur ni exception JavaScript. [Résultat JSON](offline-render-validation.json) et [outil reproductible](verify-preview.cjs). Comparaison visuelle de la maquette Design System ouverte avec les polices archivées ; captures locales dans output/design-system-documentation (ignorées par Git).

Inventaires :1413 occurrences de couleurs,935 blocs/attributs CSS,17 originaux et78 fichiers de dépendances (dont59 icônes Lucide et leur licence). Les copies des originaux ont été comparées au dossier Claude, et les manifestes sont vérifiés indépendamment des chemins absolus de la machine.

Les fins de ligne originales (dont CRLF des extraits uploadés) sont conservées. `.gitattributes` désactive la normalisation de texte pour les archives et dépendances ; les empreintes des blobs Git indexés ont également été comparées au manifeste.

Contrôle complémentaire du code exécuté en lecture seule sur `/demo` : styles calculés root14 px / spacing.25rem, rail224 px et topbar56 px. Les conversions en rem sont documentées comme écart D24, sans modification des composants.
