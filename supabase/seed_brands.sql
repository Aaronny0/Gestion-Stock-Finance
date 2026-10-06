-- HISTORIQUE ES STORE : ne pas utiliser pour déployer VORTEX.
-- Architecture actuelle : ../vortex-backend/prisma/migrations et database/security/007,008.
-- Voir supabase/README.md et docs/final-project-audit.md.
-- ==========================================================
-- ES STORE — Seed des marques (à exécuter dans Supabase SQL Editor)
-- Script IDEMPOTENT : peut être relancé sans risque
-- ==========================================================

INSERT INTO brands (name) VALUES
  ('ITEL'),
  ('TECNO'),
  ('INFINIX'),
  ('SAMSUNG'),
  ('APPLE'),
  ('REDMI'),
  ('GOOGLE PIXEL'),
  ('AUTRE')
ON CONFLICT (name) DO NOTHING;

-- Vérification après insertion :
SELECT id, name FROM brands ORDER BY name;
