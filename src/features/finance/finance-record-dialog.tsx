"use client";

import type { ReactNode } from "react";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RecordRow } from "@/frontend/types";

const labels: Record<string, string> = {
  label: "Libellé",
  date: "Date",
  status: "Statut",
  amount: "Montant",
  paid: "Payé",
  category: "Catégorie",
  account: "Compte",
  method: "Mode",
  direction: "Sens",
  sourceId: "Transaction source",
  difference: "Écart",
  opening: "Ouverture",
  counted: "Compté",
  theoretical: "Théorique",
  openedAt: "Ouverte le",
  closedAt: "Clôturée le",
};

const moneyKeys = new Set(["amount", "paid", "difference", "opening", "counted", "theoretical"]);

function FinanceRecordDialog({
  row,
  description = "Détail de l’opération financière sélectionnée.",
  onClose,
  actions,
}: {
  row: RecordRow;
  description?: string;
  onClose: () => void;
  actions?: ReactNode;
}) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 pr-8">
            <DialogTitle>{row.label}</DialogTitle>
            {row.status ? <StatusBadge value={row.status} /> : null}
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-3 sm:grid-cols-2">
          {Object.entries(row)
            .filter(([key]) => !["id", "storeId"].includes(key))
            .map(([key, value]) => (
              <div key={key} className="rounded-md border border-border bg-muted/50 p-3">
                <dt className="text-xs font-semibold text-muted-foreground">{labels[key] ?? key}</dt>
                <dd className="mt-1 break-words text-sm font-medium text-foreground">
                  {moneyKeys.has(key) && typeof value === "number" ? <Money value={value} /> : Array.isArray(value) ? value.join(", ") : String(value ?? "—")}
                </dd>
              </div>
            ))}
        </dl>
        <DialogFooter>
          {actions}
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { FinanceRecordDialog };
