# SQL historique — ne pas déployer ces fichiers

Ces sept scripts appartiennent à l’ancienne application ES STORE : tables minuscules, authentification `app_users`, stockage de mots de passe et architecture mono-boutique. Le frontend actuel ne les utilise plus.

La seule source de déploiement VORTEX est `../vortex-backend/prisma/migrations`, suivie des scripts `007_supabase_backend.sql` et `008_supabase_runtime_role.sql`. Suivre `../vortex-backend/docs/supabase-deployment-guide.md`.

`clean_data.sql` détruit des données. `migration_auth.sql` contient un compte de démonstration ancien qui ne doit jamais être créé en production. `structure.sql` est un export de contexte, pas une migration exécutable. Ces fichiers sont conservés pour comprendre/reprendre l’historique ; ils ne migrent aucune donnée vers le modèle multi-entreprises actuel.
