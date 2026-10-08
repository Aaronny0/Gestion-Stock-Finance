# Intégration des écrans d’authentification — 8 octobre 2026

Les six routes utilisent le design de `Claude design/Refonte design et système du projet/Auth.dc.html` : `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, `/invite/activate`.

## Réalisation

- Composition à deux panneaux, présentation VORTEX, illustration du reçu et du stock, logo fourni, polices Geist / Bricolage Grotesque / Geist Mono hébergées localement avec leurs licences.
- Bleu pétrole officiel `#057176`, champs, boutons, progression, récapitulatif, états de chargement et messages accessibles. CSS Modules et noms de polices propres à l’authentification ; aucun token global remplacé.
- Inscription en quatre étapes avec validation, retour conservant les données, robustesse et visibilité du mot de passe. Minimum de 12 caractères pour les nouveaux mots de passe.
- Authentification email et Google via le client Supabase existant. Google apparaît seulement lorsque les paramètres publics du service déclarent ce fournisseur activé. La préférence de dernière connexion reste une simple indication visuelle.
- Récupération, mise à jour du mot de passe et renvoi de confirmation utilisent les opérations Supabase réelles. Les paramètres `code` et `token_hash` des liens directs sont transmis aux handlers serveur existants qui valident les liens et gèrent les cookies.
- Confirmation email affichée uniquement pour une identité confirmée, sans masquer un lien invalide. Sans lien ni session confirmée, l’écran demande de consulter ou renvoyer l’email, sans bouton simulant une validation.
- Invitation consultée via `auth/invitation` ; organisation et rôle affichés lorsqu’ils sont renvoyés. Connexion ou création de l’identité Supabase, puis acceptation via `auth/activate`. L’API conserve le contrôle de l’adresse invitée.
- Confirmation de changement de mot de passe conservée lors du remontage de la page après déconnexion : indicateur temporaire en mémoire, sans stockage persistant, identifiant ni mot de passe, consommé au remontage et limité à une minute.

## Règles métier conservées

Le formulaire prépare l’entreprise et la boutique, mais son action finale est **Envoyer ma demande**. La création effective de l’espace reste réservée au parcours existant après approbation administrative. Le brouillon sans mot de passe est enregistré par `saveOnboarding` et dans les métadonnées `vortex_onboarding`, déjà prises en charge par la page de configuration. Ces données ne donnent aucun droit d’accès.

L’inscription conserve `vortex_access_request`, `name`, `company` et `phone`. Les redirections passent par la décision d’accès existante. Une adresse email confirmée ne contourne jamais l’approbation administrative.

Le backend d’inspection ne fournit pas l’email de l’invité, le nom de l’émetteur ni sa boutique ; aucune de ces informations n’est inventée. Le reçu commercial du panneau gauche est une illustration de la maquette, sans opération métier associée.

## Vérifications

- `pnpm typecheck` : réussi.
- `pnpm lint` : aucune erreur ; deux avertissements préexistants dans `data-table.tsx` et l’ancien composant `google-login.tsx`, désormais inutilisé par `/login`.
- `pnpm test` : **55 tests réussis dans le workspace, 54 dans une extraction indépendante du contenu indexé** (le test supplémentaire appartient aux modifications préexistantes de déploiement), dont contrats d’authentification, liens OTP/callback, invitations et règles d’approbation.
- `pnpm build` : build de production standard Turbopack réussi après les dernières modifications, également dans une extraction indépendante du contenu indexé, sans les changements préexistants non committés. Un essai supplémentaire avec `--webpack` échoue sur les signatures optionnelles préexistantes des pages `/` et `/access-pending` ; cette variante de compilation n’est pas celle du projet et ces pages n’ont pas été modifiées.
- `tests/browser-auth-design.cjs` via le lanceur isolé : six routes, **320 / 360 / 390 / 768 / 959 / 960 / 1024 / 1440 px**, sans débordement horizontal ; validation, conservation des étapes, fuseau invalide, mot de passe visible, découverte Google, erreurs de connexion, chargement, renvoi de confirmation, récupération, mots de passe différents, changement effectif et déconnexion, invitation absente/expirée et acceptation.
- `tests/browser-access.cjs` : isolation de la démo, coque publique, blocage du parcours entreprise avant approbation, accès suspendu et configuration après approbation vérifiés.
- `tests/browser-smoke.cjs` : 24 routes métier, vente/reçu, stock, isolation des boutiques, restrictions du caissier, comptabilité et refus des requêtes proxy d’origine étrangère vérifiés.
- `tests/design-system-regressions.cjs` : devise, checkbox au clavier, pagination et reçu fiscal/QR vérifiés.
- Aucune exception JavaScript ni erreur d’hydratation détectée sur cette suite navigateur. Les opérations d’identité et métier utilisent des fixtures exclusivement dans les tests ; les liens OTP/PKCE traversent réellement les handlers Next et les cookies avec un service Auth local de recette.
- Comparaison visuelle par captures avec la maquette originale ouverte dans Chromium. Captures dans `output/auth-design/` (sorties locales ignorées par Git).
- Vérifications réseau en lecture seule avec la configuration existante : paramètres Auth HTTP 200, Google activé ; API métier `health/live` et `health/ready` HTTP 200.
- Les imports du nouveau CSS sont limités aux composants d’authentification. Aucun écran métier, composant de navigation, style global, backend ou schéma Supabase modifié dans cette intervention. Les modifications qui existaient déjà dans le workspace ont été conservées.

Commande de reproduction des tests navigateur (avec Playwright disponible) :

```sh
QA_PRODUCTION=1 QA_FRONTEND_PORT=3101 CHROME_PATH=/usr/bin/google-chrome PLAYWRIGHT_MODULE=/chemin/vers/playwright pnpm test:browser:isolated -- tests/browser-auth-design.cjs tests/browser-access.cjs tests/browser-smoke.cjs tests/design-system-regressions.cjs
```

## Limites de validation

Aucune création de compte réel, aucun email réel de récupération/confirmation, aucune connexion interactive Google et aucune activation d’invitation réelle n’ont été déclenchés. La délivrabilité des emails et le cycle de liens provenant d’une boîte mail restent à vérifier avec un compte de recette et une invitation dédiés. Les contrats et leurs appels sont couverts en environnement isolé ; les contrôles réseau de santé ne constituent pas un test métier complet en production.

Accessibilité : labels, erreurs associées aux champs, statuts annoncés, focus visible, navigation native au clavier et respect du mouvement réduit intégrés ; aucun audit externe WCAG/Lighthouse ni essai avec lecteur d’écran effectué. Hypothèses de conception : mobile en 4G et ordinateur, pages publiques menant à un produit protégé, cible WCAG AA, contrôle d’intégration effectué par Codex. Objectifs de performance indicatifs : LCP ≤ 2 000 ms, INP ≤ 200 ms, CLS ≤ 0,1 au p75 mobile, JS ≤ 150 Ko gzip par route, Lighthouse accessibilité ≥ 95 et performance ≥ 90 ; ces mesures ne sont pas certifiées par cette intervention.

Aucune intervention de configuration indispensable détectée. Aucun déploiement effectué.

## Finalisation et synchronisation Git

- Premier commit poussé sur la branche courante `main` : `337c39d` (`feat(auth): integrate Claude authentication screens`).
- Audit complémentaire : liens OTP valides/expirés via les handlers serveur et les cookies réels du frontend en environnement isolé ; retour explicite sur `/verify-email` ; respect des anciens liens vers `/access-pending` et des invitations. Les réponses de confirmation ne sont pas mises en cache.
- Formulaire de vérification prérempli depuis le brouillon de demande, état de chargement OAuth, indication de l’adresse à utiliser pour l’invitation, retour des succès à l’état éditable lorsque le champ change.
- Fidélité complétée : point de bascule à 960 px, couleur de l’icône email, pied de page et transitions de la maquette. Le mouvement réduit désactive ces animations.
- Tests complémentaires : navigation au clavier, mot de passe trop court, refus d’inscription puis nouvelle tentative, récupération refusée puis acceptée, retour OAuth en échec, confirmation expirée malgré une session déjà confirmée, changement d’identité sur invitation et activation refusée puis acceptée. Le serveur Auth de recette est local et ne valide que des jetons de test explicites.
- Les changements préexistants de déploiement, d’origine publique, de documentation et de schéma restent hors des commits. Les fichiers partagés sont indexés uniquement pour les changements propres à cette mission ; aucun force-push.
