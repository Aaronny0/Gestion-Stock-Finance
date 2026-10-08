# Interactions et animations

Sources : [DESIGN.md §9](references/claude-original/DESIGN.md), [Auth](references/claude-original/Auth.dc.html), [Ventes](references/claude-original/Ventes.dc.html).

Règle générale :120–200 ms, ease-out, uniquement pour signaler un changement d’état. Hover, focus et pressed doivent être distincts ; disabled ne doit déclencher aucune action. Mutation asynchrone : désactiver l’envoi concurrent, annoncer l’attente, afficher le résultat réel et permettre une nouvelle tentative après erreur.

Exemples exacts : champ auth transition bordure/ombre .12s ; Google .12s ; spinner .7s linéaire ; apparition formulaire .22s ; reçu .5s ; stock .5s avec délai .15s ; panneau Ventes .18s ; squelette pulse1.4s. Les durées .22s/.5s dépassent la règle générale : variantes de maquette archivées, ne pas en faire la norme de tout le produit.

`prefers-reduced-motion:reduce` désactive les animations/transitions auth ; base globale réduit animation/transition à0.01ms, une itération, et scroll auto. Ne jamais imposer une animation indispensable à la compréhension. Les graphiques actuels ont `isAnimationActive={false}` pour leurs séries.

Interactions prévues : drilldown KPI vers liste filtrée même boutique/période ; survol graphique pour lecture, clic barre pour ventes du jour ; filtres persistés dans l’URL ; détail latéral sans perdre liste ; stepper compte/entreprise/boutique/récap avec Retour conservant les données ; œil de mot de passe indépendant, force annoncée, succès et erreurs de liens.

Les maquettes utilisent des données fictives et des délais simulés pour exposer les variantes ; ce mécanisme ne doit jamais devenir l’implémentation métier. Auth réelle : SDK Supabase, handlers code/OTP et cookies, API invitation/activate, décision d’accès existante. Aucun succès graphique sans réponse réelle. Préserver l’approbation administrative après confirmation email.
