-- HISTORIQUE ES STORE : ne pas utiliser pour déployer VORTEX.
-- Architecture actuelle : ../vortex-backend/prisma/migrations et database/security/007,008.
-- Voir supabase/README.md et docs/final-project-audit.md.
-- ============================================================
-- VORTEX — Migration : Table app_users (Authentification locale)
-- À exécuter dans la console SQL de Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS app_users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed initial user: robert / 002026
INSERT INTO app_users (username, password_hash)
VALUES ('robert', '$2b$10$qWOvbs8SBRzjyN9o5w4Y.uiFpTxhvw0e2Z6j5aAMlIYzvJB6CvB8S')
ON CONFLICT (username) DO NOTHING;
