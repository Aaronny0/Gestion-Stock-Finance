-- Script SQL pour vider (nettoyer) toutes les données de la base.
-- L'instruction TRUNCATE avec CASCADE permet de supprimer toutes les lignes
-- des tables spécifiées et de toutes les tables qui y sont liées par des clés étrangères.

DO $$ 
BEGIN
  -- Cette commande efface toutes les données de toutes les tables en respectant les foreign keys
  TRUNCATE TABLE 
    public.trades,
    public.buybacks,
    public.sales,
    public.stock_entries,
    public.daily_receipts,
    public.products,
    public.brands 
  RESTART IDENTITY CASCADE;
END $$;
