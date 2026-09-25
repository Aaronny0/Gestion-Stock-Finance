"use client";

import { useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Money } from "@/components/data-display/money";

interface CheckoutConfirmationProps {
  open: boolean;
  currency: string;
  total: number;
  paid: number;
  cashDue: number;
  tendered: number;
  method: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function CheckoutConfirmation({ open, currency, total, paid, cashDue, tendered, method, onOpenChange, onConfirm }: CheckoutConfirmationProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);

  const handleOpenChange = (next: boolean) => {
    if (busy) return;
    if (!next) setError("");
    onOpenChange(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer l’encaissement</AlertDialogTitle>
          <AlertDialogDescription>Vérifiez le règlement avant d’enregistrer définitivement la vente.</AlertDialogDescription>
        </AlertDialogHeader>
        {cashDue > 0 ? <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">Espèces remises : <Money value={tendered} currency={currency} className="font-semibold text-foreground" /> · Monnaie à rendre : <Money value={tendered - cashDue} currency={currency} className="font-semibold text-foreground" /></div> : null}
        <div className="grid gap-2 rounded-md border border-border p-3 text-sm">
          <div className="flex justify-between gap-4"><span className="text-muted-foreground">Total</span><Money value={total} currency={currency} className="font-semibold" /></div>
          <div className="flex justify-between gap-4"><span className="text-muted-foreground">Payé · {method}</span><Money value={paid} currency={currency} className="font-semibold" /></div>
          <div className="flex justify-between gap-4"><span className="text-muted-foreground">Reste dû</span><Money value={Math.max(0, total - paid)} currency={currency} className="font-semibold" /></div>
        </div>
        {error ? <div role="alert" className="rounded-md border border-destructive/25 bg-destructive-background px-3 py-2 text-sm text-destructive">{error}</div> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Retour</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={async (event) => {
              event.preventDefault();
              if (lock.current) return;
              lock.current = true;
              setBusy(true);
              setError("");
              try {
                await onConfirm();
                onOpenChange(false);
              } catch (confirmationError) {
                setError((confirmationError as Error).message);
              } finally {
                lock.current = false;
                setBusy(false);
              }
            }}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Check />}
            {busy ? "Enregistrement…" : "Confirmer la vente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
