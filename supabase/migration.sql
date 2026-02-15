-- ============================================================
-- ES STORE — Script de création de la base de données
-- À exécuter dans la console SQL de Supabase
-- ============================================================

-- ============================================================
-- 1. TABLE : brands (Marques prédéfinies)
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insertion des marques prédéfinies
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

-- ============================================================
-- 2. TABLE : products (Catalogue des produits / Stock)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id      UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  model         TEXT NOT NULL,
  unit_price    NUMERIC(12, 2),          -- Prix unitaire (NULLABLE — pas obligatoire)
  quantity      INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour recherche rapide par marque
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);

-- Empêcher les doublons marque + modèle
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_brand_model 
  ON products(brand_id, LOWER(model));

-- ============================================================
-- 3. TABLE : stock_entries (Historique des entrées de stock)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_entries (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(12, 2),          -- Prix au moment de l'entrée (NULLABLE)
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_entries_product ON stock_entries(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_date ON stock_entries(created_at);

-- ============================================================
-- 4. TABLE : sales (Ventes — déduit automatiquement le stock)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(12, 2) NOT NULL, -- Prix de vente obligatoire
  total_price   NUMERIC(12, 2) NOT NULL, -- = quantity * unit_price
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);

-- ============================================================
-- 5. TABLE : trades (Troc / Échanges)
-- ============================================================
-- Enregistre chaque échange avec calcul du gain du gérant
CREATE TABLE IF NOT EXISTS trades (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Téléphone client récupéré (repris par la boutique)
  client_phone_brand    TEXT NOT NULL,
  client_phone_model    TEXT NOT NULL,
  client_phone_value    NUMERIC(12, 2),    -- Valeur marchande estimée (NULLABLE)
  client_phone_description TEXT,           -- Description téléphone client

  -- Téléphone boutique donné au client
  shop_product_id       UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  shop_phone_price      NUMERIC(12, 2) NOT NULL, -- Prix du téléphone boutique
  shop_phone_description TEXT,             -- Description téléphone boutique

  -- Complément financier
  client_complement     NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Montant versé par le client

  -- Gain du gérant calculé automatiquement
  -- Formule : client_complement + COALESCE(client_phone_value, 0) - shop_phone_price
  trade_gain            NUMERIC(12, 2) GENERATED ALWAYS AS (
    client_complement + COALESCE(client_phone_value, 0) - shop_phone_price
  ) STORED,

  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trades_product ON trades(shop_product_id);
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(created_at);

-- ============================================================
-- 6. TABLE : daily_receipts (Recettes journalières)
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_receipts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_date  DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  total_amount  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_receipts_date ON daily_receipts(receipt_date);

-- ============================================================
-- 7. TRIGGERS : Mise à jour automatique de updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur products
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger sur daily_receipts
CREATE TRIGGER trigger_daily_receipts_updated_at
  BEFORE UPDATE ON daily_receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. FUNCTION + TRIGGER : Déduction automatique du stock 
--    lors d'une vente
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET quantity = quantity - NEW.quantity
  WHERE id = NEW.product_id 
    AND quantity >= NEW.quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock insuffisant pour le produit %', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deduct_stock_on_sale
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION deduct_stock_on_sale();

-- ============================================================
-- 9. FUNCTION + TRIGGER : Déduction du stock lors d'un troc
--    (le téléphone boutique sort du stock)
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_stock_on_trade()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET quantity = quantity - 1
  WHERE id = NEW.shop_product_id 
    AND quantity >= 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock insuffisant pour le produit en troc %', NEW.shop_product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deduct_stock_on_trade
  AFTER INSERT ON trades
  FOR EACH ROW
  EXECUTE FUNCTION deduct_stock_on_trade();

-- ============================================================
-- 10. FUNCTION + TRIGGER : Ajout automatique au stock 
--     lors d'une entrée de stock
-- ============================================================
CREATE OR REPLACE FUNCTION add_stock_on_entry()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET quantity = quantity + NEW.quantity
  WHERE id = NEW.product_id;

  -- Mettre à jour le prix unitaire si renseigné
  IF NEW.unit_price IS NOT NULL THEN
    UPDATE products 
    SET unit_price = NEW.unit_price
    WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_add_stock_on_entry
  AFTER INSERT ON stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION add_stock_on_entry();

-- ============================================================
-- 11. VUES : Reporting et statistiques
-- ============================================================

-- Vue : résumé des ventes par jour
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
  DATE(created_at) AS sale_date,
  COUNT(*) AS total_transactions,
  SUM(total_price) AS total_revenue
FROM sales
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Vue : résumé des trocs par jour
CREATE OR REPLACE VIEW daily_trades_summary AS
SELECT 
  DATE(created_at) AS trade_date,
  COUNT(*) AS total_trades,
  SUM(client_complement) AS total_complements,
  SUM(trade_gain) AS total_gain
FROM trades
GROUP BY DATE(created_at)
ORDER BY trade_date DESC;

-- Vue : stock actuel avec nom de marque
CREATE OR REPLACE VIEW stock_overview AS
SELECT 
  p.id,
  b.name AS brand_name,
  p.model,
  p.unit_price,
  p.quantity,
  (p.unit_price * p.quantity) AS stock_value,
  p.created_at,
  p.updated_at
FROM products p
JOIN brands b ON p.brand_id = b.id
ORDER BY b.name, p.model;

-- ============================================================
-- 12. ROW LEVEL SECURITY (RLS) — Désactivé pour simplifier
-- ============================================================
-- Si vous souhaitez activer RLS, décommentez et adaptez :
-- ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_receipts ENABLE ROW LEVEL SECURITY;

-- Politique permissive (accès total pour les utilisateurs authentifiés)
-- CREATE POLICY "Allow all for authenticated users" ON brands
--   FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
