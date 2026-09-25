"use client";

import { Plus, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/data-display/money";
import type { Product } from "@/frontend/types";

interface ProductCardProps {
  product: Product;
  currency: string;
  cartQuantity?: number;
  onAdd: (productId: string) => void;
}

export function ProductCard({ product, currency, cartQuantity = 0, onAdd }: ProductCardProps) {
  const lowStock = product.quantity <= Math.max(1, product.threshold);
  return (
    <article data-qa="product-card" className="group flex min-h-56 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
      <button
        type="button"
        className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        onClick={() => onAdd(product.id)}
        aria-label={`Ajouter ${product.brand} ${product.model} au panier`}
      >
        <div className="relative flex h-28 w-full items-center justify-center border-b border-border bg-muted/55">
          <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-sm">
            <Smartphone className="size-8" aria-hidden="true" />
          </div>
          <Badge variant={lowStock ? "warning" : "secondary"} className="absolute left-3 top-3">
            {product.quantity} en stock
          </Badge>
          {cartQuantity > 0 ? (
            <Badge className="absolute right-3 top-3">{cartQuantity} au panier</Badge>
          ) : null}
        </div>
        <div className="flex w-full flex-1 flex-col gap-1 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{product.brand}</p>
          <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{product.model}</h3>
          <p className="line-clamp-1 text-xs text-muted-foreground">{product.variant || product.condition}</p>
          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <Money value={product.price} currency={currency} className="text-sm font-bold text-foreground" />
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <Plus className="size-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
