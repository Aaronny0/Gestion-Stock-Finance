-- ============================================================
-- ES STORE — Migration : Table buybacks (Rachat Clients)
-- À exécuter dans la console SQL de Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS buybacks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name     TEXT,                             -- Nom client (optionnel)
  brand_name      TEXT NOT NULL,                    -- Marque (texte, ex: APPLE)
  model           TEXT NOT NULL,                    -- Modèle du téléphone
  description     TEXT,                             -- État, couleur, stockage...
  purchase_price  NUMERIC(12, 2) NOT NULL,          -- Prix payé au client
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_buybacks_date ON buybacks(created_at);
CREATE INDEX IF NOT EXISTS idx_buybacks_brand ON buybacks(brand_name);
