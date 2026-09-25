"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Money } from "@/components/data-display/money";
import type { SaleLine } from "@/frontend/types";
import { decimals } from "@/frontend/accounting";

interface CartItemProps {
  idPrefix: string;
  line: SaleLine;
  stockQuantity: number;
  currency: string;
  canChangePrice: boolean;
  imeiEnabled: boolean;
  onQuantityChange: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onPriceChange: (productId: string, value: string) => void;
  onImeiChange: (productId: string, value: string) => void;
}

export function CartItem({
  idPrefix,
  line,
  stockQuantity,
  currency,
  canChangePrice,
  imeiEnabled,
  onQuantityChange,
  onRemove,
  onPriceChange,
  onImeiChange,
}: CartItemProps) {
  const scale = 10 ** decimals(currency);
  return (
    <div data-qa="cart-item" className="space-y-3 border-b border-border py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{line.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Stock disponible : {stockQuantity}</p>
        </div>
        <Button type="button" size="icon" variant="ghost" className="size-9 min-h-9 shrink-0 text-muted-foreground hover:text-destructive" aria-label={`Retirer ${line.label}`} onClick={() => onRemove(line.productId)}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-md border border-border bg-card">
          <Button type="button" size="icon" variant="ghost" className="size-9 min-h-9 rounded-r-none" aria-label={`Réduire ${line.label}`} onClick={() => onQuantityChange(line.productId, -1)}>
            <Minus className="size-3.5" />
          </Button>
          <span className="min-w-9 text-center text-sm font-semibold [font-variant-numeric:tabular-nums]">{line.quantity}</span>
          <Button type="button" size="icon" variant="ghost" className="size-9 min-h-9 rounded-l-none" aria-label={`Augmenter ${line.label}`} onClick={() => onQuantityChange(line.productId, 1)} disabled={line.quantity >= stockQuantity}>
            <Plus className="size-3.5" />
          </Button>
        </div>
        {canChangePrice ? (
          <div className="w-32">
            <Label className="sr-only" htmlFor={`${idPrefix}-price-${line.productId}`}>Prix de {line.label}</Label>
            <Input
              id={`${idPrefix}-price-${line.productId}`}
              type="number"
              min="0"
              step={1 / scale}
              value={line.price / scale}
              className="h-9 text-right [font-variant-numeric:tabular-nums]"
              onChange={(event) => onPriceChange(line.productId, event.target.value)}
            />
          </div>
        ) : (
          <Money value={line.price * line.quantity} currency={currency} className="text-sm font-semibold" />
        )}
      </div>

      {canChangePrice ? (
        <div className="flex justify-end text-xs text-muted-foreground">
          Total ligne&nbsp;<Money value={line.price * line.quantity} currency={currency} className="font-semibold text-foreground" />
        </div>
      ) : null}

      {imeiEnabled ? (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-imei-${line.productId}`}>IMEI unique <span className="font-normal text-muted-foreground">· facultatif</span></Label>
          <Input id={`${idPrefix}-imei-${line.productId}`} value={line.imei ?? ""} onChange={(event) => onImeiChange(line.productId, event.target.value)} placeholder="Saisir l’IMEI" />
        </div>
      ) : null}
    </div>
  );
}
