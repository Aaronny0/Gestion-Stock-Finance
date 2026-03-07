-- Migration : Soft delete pour les produits
-- Ajoute une colonne "active" par défaut à true
-- Cela permet de masquer un produit ("isolé du stock") sans le supprimer physiquement pour préserver les historiques (ventes, trocs).

ALTER TABLE public.products 
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
