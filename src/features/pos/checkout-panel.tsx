"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/data-display/money";

interface CheckoutPanelProps {
  currency: string;
  total: number;
  paidAmount: number;
  credit: boolean;
  split: boolean;
  method: string;
  secondMethod: string;
  secondAmount: number;
  error?: string;
  disabled: boolean;
  quoting: boolean;
  buttonId?: string;
  onCheckout: () => void;
}

export function CheckoutPanel({ currency, total, paidAmount, credit, split, method, secondMethod, secondAmount, error, disabled, quoting, buttonId, onCheckout }: CheckoutPanelProps) {
  return (
    <div className="space-y-3 border-t border-border bg-card pt-4">
      <div className="flex items-end justify-between gap-4">
        <span className="text-sm text-muted-foreground">Total à payer</span>
        <Money value={total} currency={currency} className="text-xl font-bold text-foreground" />
      </div>
      {split ? (
        <p className="text-xs leading-5 text-muted-foreground">
          {method} : <Money value={paidAmount - secondAmount} currency={currency} /> · {secondMethod} : <Money value={secondAmount} currency={currency} />
        </p>
      ) : null}
      {credit ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Reste dû</span>
          <Money value={Math.max(0, total - paidAmount)} currency={currency} className="font-semibold text-warning" />
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="rounded-md border border-destructive/25 bg-destructive-background px-3 py-2 text-sm text-destructive">{error}</div>
      ) : null}
      <Button id={buttonId} type="button" className="w-full" size="lg" disabled={disabled || quoting} onClick={onCheckout}>
        {quoting ? <Loader2 className="animate-spin" /> : <ArrowRight />}
        {quoting ? "Vérification…" : "Encaisser"}
        <kbd className="ml-auto rounded-sm bg-primary-foreground/15 px-1.5 py-0.5 text-[10px]">F8</kbd>
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">Confirmation avant enregistrement.</p>
    </div>
  );
}
