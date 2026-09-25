"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { BookOpenText, CreditCard, Printer, RotateCcw } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dueState, salePosition } from "@/frontend/operations";
import type { Sale, SaleLine } from "@/frontend/types";

function SaleDetails({
  sale,
  href,
  canFinance,
  canRefund,
  canAccounting,
  onReceipt,
  onPayment,
  onRefund,
}: {
  sale: Sale;
  href: (path: string) => string;
  canFinance: boolean;
  canRefund: boolean;
  canAccounting: boolean;
  onReceipt: () => void;
  onPayment: () => void;
  onRefund: () => void;
}) {
  const position = salePosition(sale);
  const lineRows = sale.lines.map((line, index) => ({ ...line, id: String(index) }));
  const columns: ColumnDef<SaleLine & { id: string }>[] = [
    { accessorKey: "label", header: "Article", cell: ({ row }) => <span className="font-medium">{row.original.label}</span> },
    { accessorKey: "quantity", header: "Quantité" },
    { accessorKey: "price", header: "Prix unitaire", cell: ({ row }) => <Money value={row.original.price} /> },
    { accessorKey: "imei", header: "IMEI", cell: ({ row }) => row.original.imei || "—" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Montant net</p><Money value={position.netTotal} className="mt-2 block text-xl font-bold" /></Card>
        <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Payé</p><Money value={position.netPaid} className="mt-2 block text-xl font-bold" /></Card>
        <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Reste dû</p><Money value={position.due} className="mt-2 block text-xl font-bold" /></Card>
        <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Statut</p><div className="mt-2 flex flex-wrap gap-2"><StatusBadge value={sale.status} />{position.due > 0 ? <StatusBadge value={dueState(sale, new Date().toISOString()).label} /> : null}</div></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Articles vendus</CardTitle></CardHeader>
        <CardContent><DataTable name="articles-vendus" data={lineRows} columns={columns} getRowId={(line) => line.id} enableColumnVisibility={false} pageSize={20} /></CardContent>
      </Card>

      {sale.returns?.length ? (
        <Card data-qa="return-history">
          <CardHeader><CardTitle>Historique des retours</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {sale.returns.map((entry) => (
              <div key={entry.id} className="rounded-md border border-border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <strong className="text-sm">Retour du {new Date(entry.date).toLocaleDateString("fr-FR")}</strong>
                  <Money value={entry.amount} className="font-semibold" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{entry.reason} · Remboursé : <Money value={entry.cashRefund} /></p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{entry.lines.map((line) => `${line.quantity} × ${sale.lines[line.lineIndex].label} (${line.restock ? "remis en stock" : "défectueux"})`).join(" · ")}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onReceipt}><Printer /> Voir le reçu / Imprimer</Button>
        {position.due > 0 && canFinance ? <Button variant="outline" onClick={onPayment}><CreditCard /> Enregistrer un paiement</Button> : null}
        {canRefund && sale.status !== "refunded" && !sale.tradeValue ? <Button variant="outline" onClick={onRefund}><RotateCcw /> Retourner / rembourser</Button> : null}
        {canAccounting ? <Button variant="outline" asChild><Link href={href("/accounting")}><BookOpenText /> Écritures comptables</Link></Button> : null}
      </div>
    </div>
  );
}

export { SaleDetails };
