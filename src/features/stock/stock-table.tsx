"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Package } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { Card } from "@/components/ui/card";
import type { Product } from "@/frontend/types";

function stockStatus(product: Product) {
  return product.quantity === 0 ? "Rupture" : product.quantity <= product.threshold ? "Stock faible" : "Disponible";
}

function StockTable({ products, canReadCost, canExport, onOpen, filters }: { products: Product[]; canReadCost: boolean; canExport: boolean; onOpen: (product: Product) => void; filters?: React.ReactNode }) {
  const columns: ColumnDef<Product>[] = [
    {
      id: "product",
      header: "Produit",
      accessorFn: (product) => `${product.brand} ${product.model} ${product.imei ?? ""}`,
      cell: ({ row }) => (
        <div className="flex min-w-48 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"><Package className="size-4" /></span>
          <span className="min-w-0"><strong className="block truncate text-sm">{row.original.brand} {row.original.model}</strong><small className="block truncate text-xs text-muted-foreground">{row.original.imei ? `IMEI ${row.original.imei}` : row.original.condition}</small></span>
        </div>
      ),
    },
    { accessorKey: "variant", header: "Variante" },
    { accessorKey: "quantity", header: "Quantité", cell: ({ row }) => <span className={row.original.quantity <= row.original.threshold ? "font-semibold text-warning" : undefined}>{row.original.quantity} unités</span> },
    { accessorKey: "price", header: "Prix de vente", cell: ({ row }) => <Money value={row.original.price} /> },
    ...(canReadCost ? [{ id: "value", header: "Valeur du stock", accessorFn: (product: Product) => (product.cost ?? 0) * product.quantity, cell: ({ row }: { row: { original: Product } }) => <Money value={(row.original.cost ?? 0) * row.original.quantity} /> } as ColumnDef<Product>] : []),
    { id: "status", header: "État du stock", accessorFn: stockStatus, cell: ({ row }) => <StatusBadge value={stockStatus(row.original)} /> },
  ];

  return (
    <DataTable
      name="stock"
      data={products}
      columns={columns}
      getRowId={(product) => product.id}
      onRow={onOpen}
      filters={filters}
      enableSelection={canExport}
      canExport={canExport}
      exportRow={(product) => ({ Marque: product.brand, Modèle: product.model, Variante: product.variant, État: product.condition, IMEI: product.imei ?? "", Quantité: product.quantity, Seuil: product.threshold, "Prix de vente": product.price, ...(canReadCost ? { "Coût unitaire": product.cost ?? 0, "Valeur stock": (product.cost ?? 0) * product.quantity } : {}), Statut: stockStatus(product) })}
      searchPlaceholder="Produit, variante, IMEI…"
      emptyTitle="Aucun produit ne correspond"
      emptyDescription="Modifiez les filtres ou ajoutez une nouvelle référence au catalogue."
      mobileRow={(product) => (
        <Card className="flex min-h-24 items-center gap-3 p-4 transition-colors hover:bg-muted/40">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"><Package className="size-5" /></span>
          <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><strong className="truncate text-sm">{product.brand} {product.model}</strong><StatusBadge value={stockStatus(product)} showIcon={false} /></div><p className="mt-1 truncate text-xs text-muted-foreground">{product.variant} · {product.condition}</p><div className="mt-2 flex items-center justify-between gap-2"><span className="text-xs font-medium">{product.quantity} unités</span><Money value={product.price} className="text-sm font-semibold" /></div></div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Card>
      )}
    />
  );
}

export { StockTable, stockStatus };
