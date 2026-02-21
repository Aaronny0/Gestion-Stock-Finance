-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT brands_pkey PRIMARY KEY (id)
);
CREATE TABLE public.buybacks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_name text,
  brand_name text NOT NULL,
  model text NOT NULL,
  description text,
  purchase_price numeric NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT buybacks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.daily_receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  receipt_date date NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT daily_receipts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  model text NOT NULL,
  unit_price numeric,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);
CREATE TABLE public.sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sales_pkey PRIMARY KEY (id),
  CONSTRAINT sales_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.stock_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stock_entries_pkey PRIMARY KEY (id),
  CONSTRAINT stock_entries_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.trades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_phone_brand text NOT NULL,
  client_phone_model text NOT NULL,
  client_phone_value numeric,
  client_phone_description text,
  shop_product_id uuid NOT NULL,
  shop_phone_price numeric NOT NULL,
  shop_phone_description text,
  client_complement numeric NOT NULL DEFAULT 0,
  trade_gain numeric DEFAULT ((client_complement + COALESCE(client_phone_value, (0)::numeric)) - shop_phone_price),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trades_pkey PRIMARY KEY (id),
  CONSTRAINT trades_shop_product_id_fkey FOREIGN KEY (shop_product_id) REFERENCES public.products(id)
);