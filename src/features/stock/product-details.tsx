"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-display/data-table";
import { ListCard } from "@/components/data-display/list-card";
import { StatusBadge } from "@/components/data-display/status-badge";
import { SummaryItem, SummaryStrip } from "@/components/data-display/summary-strip";
import type { Product, RecordRow } from "@/frontend/types";
import { formatListDate, plural } from "@/lib/format";
import { stockStatus } from "@/features/stock/stock-table";

/** Fiche produit : synthèse et historique. Les actions sont dans l'en-tête de page (D30). */
function ProductDetails({ product, history, canReadCost }: { product: Product; history: RecordRow[]; canReadCost: boolean }) {
  const columns: ColumnDef<RecordRow>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => formatListDate(row.original.date) },
    { accessorKey: "label", header: "Opération" },
    { accessorKey: "quantity", header: "Quantité", meta: { align: "right" } },
    { accessorKey: "reason", header: "Motif", cell: ({ row }) => String(row.original.reason ?? "—") },
  ];
  return (
    <div className="space-y-5">
      <SummaryStrip aria-label="Synthèse du produit" data-qa="product-metrics">
        <SummaryItem label="Stock" value={plural(product.quantity, "unité")} meta={<StatusBadge value={stockStatus(product)} showIcon={false} />} />
        <SummaryItem label="Prix de vente" money={product.price} />
        {canReadCost ? <SummaryItem label="Coût unitaire" money={product.cost ?? 0} /> : null}
        <SummaryItem label="IMEI" value={<span className="text-sm">{product.availableImeis?.join(", ") || product.imei || "Non renseigné"}</span>} meta={`${product.condition} · ${product.variant}`} />
      </SummaryStrip>
      <ListCard aria-label="Historique du produit">
        <DataTable name="historique-produit" data={history} columns={columns} getRowId={(row) => row.id} pageSize={10} searchPlaceholder="Opération, motif…" emptyKind="first-use" emptyTitle="Aucun mouvement pour ce produit" emptyDescription="Les entrées, ajustements et transferts de ce produit apparaîtront ici." />
      </ListCard>
    </div>
  );
}

export { ProductDetails };
