"use client";

import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Money } from "@/components/data-display/money";
import { useWorkspace } from "@/frontend/provider";
import { salePosition } from "@/frontend/operations";
import type { Sale } from "@/frontend/types";

export function Receipt({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const { snapshot, demo } = useWorkspace();
  const currency = snapshot!.session.organization.currency;
  const storeName = snapshot!.session.stores.find((store) => store.id === sale.storeId)?.name;
  const position = salePosition(sale);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent data-receipt-dialog className="max-h-[90dvh] max-w-xl overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle>Reçu {sale.reference}</DialogTitle>
          <DialogDescription>Reçu de vente VORTEX.</DialogDescription>
        </DialogHeader>

        <div data-receipt className="mx-auto w-full max-w-md text-sm text-foreground">
          <div className="mb-6 text-center">
            <p className="text-xl font-bold tracking-tight">VORTEX</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Stock &amp; Finance</p>
            <h2 className="mt-4 text-base font-semibold">{snapshot!.session.organization.name}</h2>
            <p className="text-xs text-muted-foreground">{storeName}</p>
            {demo ? <div className="mt-3"><Badge variant="warning">Démonstration · sans valeur fiscale</Badge></div> : null}
          </div>

          <div className="flex justify-between gap-4 border-y border-dashed border-border py-3 text-xs text-muted-foreground">
            <span>{sale.reference}</span>
            <span>{new Date(sale.date).toLocaleDateString("fr-FR")}</span>
          </div>

          <div className="divide-y divide-border">
            {sale.lines.map((line, index) => (
              <div className="flex justify-between gap-4 py-3" key={`${line.productId}-${index}`}>
                <span className="min-w-0">
                  <span className="block font-medium">{line.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {line.quantity} × <Money value={line.price} currency={currency} />{line.imei ? ` · IMEI ${line.imei}` : ""}
                  </span>
                </span>
                <Money value={line.price * line.quantity} currency={currency} className="font-semibold" />
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-dashed border-border pt-4">
            <div className="flex justify-between gap-4 text-muted-foreground"><span>Remise</span><Money value={sale.discount} currency={currency} /></div>
            <div className="flex items-baseline justify-between gap-4 py-2 text-lg font-bold"><span>Total</span><Money value={sale.total} currency={currency} /></div>
            <div className="flex justify-between gap-4 text-muted-foreground"><span>Payé{sale.tradeValue ? " (dont valeur de reprise)" : ""}</span><Money value={sale.paid} currency={currency} /></div>
            <div className="flex justify-between gap-4 text-muted-foreground"><span>Reste dû</span><Money value={position.due} currency={currency} /></div>
            {sale.cashTendered ? (
              <div className="flex justify-between gap-4 text-muted-foreground">
                <span>Espèces / monnaie</span>
                <span><Money value={sale.cashTendered} currency={currency} /> / <Money value={sale.cashChange ?? 0} currency={currency} /></span>
              </div>
            ) : null}
            {sale.returns?.length ? (
              <div className="flex justify-between gap-4 text-muted-foreground">
                <span>Retours / net</span>
                <span><Money value={position.refunded} currency={currency} /> / <Money value={position.netTotal} currency={currency} /></span>
              </div>
            ) : null}
          </div>

          <p className="mt-7 text-center text-xs text-muted-foreground">Merci de votre confiance.</p>
          {snapshot!.session.organization.fiscalEnabled ? (
            <div className="mt-4 rounded-md border border-info/20 bg-info-background p-3 text-center text-xs text-info">Statut fiscal : en attente de normalisation.</div>
          ) : null}
        </div>

        <DialogFooter className="print:hidden">
          <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
          <Button type="button" onClick={() => window.print()}><Printer /> Imprimer / PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
