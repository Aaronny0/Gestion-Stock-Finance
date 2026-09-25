"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Archive, ArrowRightLeft, PackagePlus, Pencil, Package } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Product, RecordRow } from "@/frontend/types";
import { stockStatus } from "@/features/stock/stock-table";

function ProductDetails({ product, history, canReadCost, canAdjust, canTransfer, onEdit, onEntry, onAdjust, onTransfer, onArchive }: { product: Product; history: RecordRow[]; canReadCost: boolean; canAdjust: boolean; canTransfer: boolean; onEdit: () => void; onEntry: () => void; onAdjust: () => void; onTransfer: () => void; onArchive: () => void }) {
  const columns: ColumnDef<RecordRow>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => new Date(row.original.date).toLocaleDateString("fr-FR") },
    { accessorKey: "label", header: "Opération" },
    { accessorKey: "quantity", header: "Quantité" },
    { accessorKey: "reason", header: "Motif", cell: ({ row }) => String(row.original.reason ?? "—") },
  ];
  return (
    <div className="space-y-5">
      <div data-qa="product-metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Stock</p><p className="mt-2 text-xl font-bold [font-variant-numeric:tabular-nums]">{product.quantity} unités</p><div className="mt-2"><StatusBadge value={stockStatus(product)} /></div></Card>
        <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Prix de vente</p><Money value={product.price} className="mt-2 block text-xl font-bold" /></Card>
        {canReadCost ? <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Coût unitaire</p><Money value={product.cost ?? 0} className="mt-2 block text-xl font-bold" /></Card> : null}
        <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">IMEI</p><p className="mt-2 truncate text-sm font-semibold">{product.imei || "Non renseigné"}</p><p className="mt-1 text-xs text-muted-foreground">{product.condition} · {product.variant}</p></Card>
      </div>
      <div className="flex flex-wrap gap-2">
        {canAdjust ? <Button onClick={onEdit}><Pencil /> Modifier le produit</Button> : null}
        {canAdjust ? <Button variant="outline" onClick={onEntry}><PackagePlus /> Nouvelle entrée</Button> : null}
        {canAdjust ? <Button variant="outline" onClick={onAdjust}><Package /> Ajuster</Button> : null}
        {canTransfer ? <Button variant="outline" onClick={onTransfer}><ArrowRightLeft /> Transférer</Button> : null}
        {canAdjust ? <Button variant="outline" onClick={onArchive}><Archive /> Archiver</Button> : null}
      </div>
      <DataTable name="historique-produit" data={history} columns={columns} getRowId={(row) => row.id} pageSize={10} searchPlaceholder="Opération, motif…" emptyTitle="Aucun mouvement pour ce produit" />
    </div>
  );
}

export { ProductDetails };
