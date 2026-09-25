"use client";

import { useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Money } from "@/components/data-display/money";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUnsavedChanges, useWorkspace } from "@/frontend/provider";
import { quoteReturn, returnedQuantity, type ReturnSelection } from "@/frontend/operations";
import { paymentMethods, type Sale } from "@/frontend/types";

function RefundDialog({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const { command } = useWorkspace();
  const [lines, setLines] = useState<ReturnSelection[]>(sale.lines.map((_, lineIndex) => ({ lineIndex, quantity: 0, restock: true })));
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState("Espèces");
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const discard = useUnsavedChanges(!!reason || lines.some((line) => line.quantity > 0), "Retour client");
  const selected = lines.filter((line) => line.quantity > 0);
  let quote: ReturnType<typeof quoteReturn> | undefined;
  try { quote = quoteReturn(sale, selected); } catch {}

  const close = () => { if (!busy && discard()) onClose(); };
  const submit = async () => {
    setError("");
    if (busy) return;
    try {
      quoteReturn(sale, selected);
      if (!reason.trim()) throw new Error("Motif obligatoire.");
      if (!review) { setReview(true); return; }
      setBusy(true);
      await command("sale.return", { id: sale.id, lines: selected, reason, method });
      onClose();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Retour · {sale.reference}</DialogTitle>
          <DialogDescription>Sélectionnez les articles retournés et leur état. La créance est réduite avant tout remboursement.</DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-info/20 bg-info-background p-3 text-sm text-info">
          Les articles revendables retournent en stock. Les articles défectueux restent exclus du stock disponible.
        </div>

        <div className="space-y-3">
          {lines.map((line, index) => {
            const original = sale.lines[index];
            const remaining = original.quantity - returnedQuantity(sale, index);
            if (remaining <= 0) return null;
            return (
              <div className="rounded-lg border border-border p-4" key={index}>
                <div className="mb-3"><strong className="text-sm">{original.label}</strong><p className="text-xs text-muted-foreground">{remaining} unité(s) encore retournable(s)</p></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label htmlFor={`return-quantity-${index}`}>Quantité à retourner</Label><Input id={`return-quantity-${index}`} type="number" min="0" max={remaining} step="1" disabled={review || busy} value={line.quantity} onChange={(event) => setLines((old) => old.map((item, i) => i === index ? { ...item, quantity: Number(event.target.value) } : item))} /></div>
                  <div className="space-y-1.5"><Label>État de l’article</Label><Select disabled={review || busy} value={line.restock ? "yes" : "no"} onValueChange={(value) => setLines((old) => old.map((item, i) => i === index ? { ...item, restock: value === "yes" } : item))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Revendable · remettre en stock</SelectItem><SelectItem value="no">Défectueux · ne pas remettre en stock</SelectItem></SelectContent></Select></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-1.5"><Label htmlFor="return-reason">Motif du retour</Label><Textarea id="return-reason" required disabled={review || busy} value={reason} onChange={(event) => setReason(event.target.value)} /></div>
        {quote?.cashRefund ? <div className="space-y-1.5"><Label>Mode du remboursement</Label><Select value={method} disabled={review || busy} onValueChange={setMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{paymentMethods.map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select></div> : null}

        {quote ? <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Valeur retournée</p><Money value={quote.amount} className="mt-1 block font-semibold" /></div><div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Créance réduite</p><Money value={quote.creditReduction} className="mt-1 block font-semibold" /></div><div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">À rembourser</p><Money value={quote.cashRefund} className="mt-1 block font-semibold" /></div></div> : null}
        {review ? <div className="flex gap-2 rounded-md border border-warning/20 bg-warning-background p-3 text-sm text-warning"><AlertTriangle className="mt-0.5 size-4 shrink-0" />Vérifiez les quantités, l’état et les montants avant confirmation. Le retour sera conservé dans l’historique.</div> : null}
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={() => review ? setReview(false) : close()}>{review ? "Modifier" : "Annuler"}</Button>
          <Button type="button" disabled={busy || !quote} onClick={() => void submit()}><RotateCcw />{busy ? "Enregistrement…" : review ? "Confirmer le retour" : "Vérifier le retour"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { RefundDialog };
