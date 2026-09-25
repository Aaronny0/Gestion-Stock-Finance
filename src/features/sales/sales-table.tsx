"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { Card } from "@/components/ui/card";
import { salePosition } from "@/frontend/operations";
import type { Sale } from "@/frontend/types";

function SalesTable({ sales, onOpen, canExport }: { sales: Sale[]; onOpen: (sale: Sale) => void; canExport: boolean }) {
  const columns: ColumnDef<Sale>[] = [
    {
      accessorKey: "reference",
      header: "Référence",
      accessorFn: (sale) => `${sale.reference} ${sale.lines.map((line) => line.imei ?? "").join(" ")}`,
      cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.reference}</span>,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => new Date(row.original.date).toLocaleDateString("fr-FR"),
    },
    { accessorKey: "seller", header: "Vendeur" },
    {
      id: "total",
      header: "Montant net",
      accessorFn: (sale) => salePosition(sale).netTotal,
      cell: ({ row }) => <Money value={salePosition(row.original).netTotal} className="font-semibold" />,
    },
    {
      id: "paid",
      header: "Paiement net",
      accessorFn: (sale) => salePosition(sale).netPaid,
      cell: ({ row }) => <Money value={salePosition(row.original).netPaid} />,
    },
    {
      id: "due",
      header: "Reste dû",
      accessorFn: (sale) => salePosition(sale).due,
      cell: ({ row }) => <Money value={salePosition(row.original).due} className={salePosition(row.original).due > 0 ? "font-semibold text-warning" : undefined} />,
    },
    { id: "status", header: "Statut", accessorFn: (sale) => sale.status, cell: ({ row }) => <StatusBadge value={row.original.status} /> },
  ];

  return (
    <DataTable
      name="ventes"
      data={sales}
      columns={columns}
      onRow={onOpen}
      getRowId={(sale) => sale.id}
      enableSelection={canExport}
      canExport={canExport}
      exportRow={(sale) => ({
        Référence: sale.reference,
        Date: new Date(sale.date).toLocaleString("fr-FR"),
        Vendeur: sale.seller,
        "Montant net": salePosition(sale).netTotal,
        "Paiement net": salePosition(sale).netPaid,
        "Reste dû": salePosition(sale).due,
        Statut: sale.status,
      })}
      emptyTitle="Aucune vente sur cette période"
      emptyDescription="Modifiez la période ou enregistrez une nouvelle vente depuis la caisse."
      searchPlaceholder="Référence, vendeur, IMEI…"
      mobileRow={(sale) => (
        <Card className="flex min-h-20 items-center gap-3 p-4 transition-colors hover:bg-muted/40">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <strong className="truncate text-sm">{sale.reference}</strong>
              <StatusBadge value={sale.status} showIcon={false} />
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">{new Date(sale.date).toLocaleDateString("fr-FR")} · {sale.seller}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <Money value={salePosition(sale).netTotal} className="text-sm font-semibold" />
              {salePosition(sale).due > 0 ? <span className="text-xs font-medium text-warning">Reste <Money value={salePosition(sale).due} /></span> : null}
            </div>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Card>
      )}
    />
  );
}

export { SalesTable };
