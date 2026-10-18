"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Smartphone } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import type { Product } from "@/frontend/types";
import { cn } from "@/lib/utils";
import styles from "@/features/stock/stock.module.css";

function stockStatus(product: Product) {
  return product.quantity === 0 ? "Rupture" : product.quantity <= product.threshold ? "Stock faible" : "Disponible";
}

function stockTone(product: Product) {
  return product.quantity === 0 ? "destructive" : product.quantity <= product.threshold ? "warning" : "success";
}

function quantityClass(product: Product) {
  return product.quantity === 0 ? styles.qtyOut : product.quantity <= product.threshold ? styles.qtyLow : undefined;
}

function StockTable({ products, canReadCost, canExport, onOpen, filters, search, onSearch, emptyContent }: { products: Product[]; canReadCost: boolean; canExport: boolean; onOpen: (product: Product) => void; filters?: React.ReactNode; search?: string; onSearch?: (value: string) => void; emptyContent?: React.ReactNode }) {
  const columns: ColumnDef<Product>[] = [
    {
      id: "product",
      header: "Produit",
      accessorFn: (product) => `${product.brand} ${product.model} ${product.imei ?? ""}`,
      cell: ({ row }) => (
        <div className="flex min-w-48 items-center gap-3">
          <span className={styles.thumb}><Smartphone className="size-[18px]" aria-hidden="true" /></span>
          <span className="min-w-0"><strong className="block truncate font-semibold">{row.original.brand} {row.original.model}</strong>{row.original.imei ? <span className={styles.reference}>IMEI {row.original.imei}</span> : null}</span>
        </div>
      ),
    },
    { accessorKey: "variant", header: "Variante" },
    { accessorKey: "condition", header: "État", cell: ({ row }) => <span className="text-muted-foreground">{row.original.condition}</span> },
    { accessorKey: "quantity", header: "Quantité", meta: { align: "right" }, cell: ({ row }) => <span><strong className={cn("font-semibold", quantityClass(row.original))}>{row.original.quantity}</strong><span className={styles.threshold}>/ seuil {row.original.threshold}</span></span> },
    { accessorKey: "price", header: "Prix de vente", meta: { align: "right" }, cell: ({ row }) => <Money value={row.original.price} currencyClassName={styles.currency} /> },
    ...(canReadCost ? [{ id: "value", header: "Valeur du stock", meta: { align: "right" }, accessorFn: (product: Product) => (product.cost ?? 0) * product.quantity, cell: ({ row }: { row: { original: Product } }) => <Money value={(row.original.cost ?? 0) * row.original.quantity} currencyClassName={styles.currency} /> } as ColumnDef<Product>] : []),
    { id: "status", header: "Statut", accessorFn: stockStatus, cell: ({ row }) => <StatusBadge value={stockStatus(row.original)} tone={stockTone(row.original)} showIcon={false} /> },
    { id: "open", header: "", enableSorting: false, enableHiding: false, cell: () => <ChevronRight className="size-[18px] text-muted-foreground" aria-hidden="true" /> },
  ];

  return (
    <DataTable
      name="stock"
      data={products}
      columns={columns}
      getRowId={(product) => product.id}
      onRow={onOpen}
      filters={filters}
      searchValue={search}
      onSearchChange={onSearch}
      enableSelection={canExport}
      canExport={canExport}
      exportRow={(product) => ({ Marque: product.brand, Modèle: product.model, Variante: product.variant, État: product.condition, IMEI: product.imei ?? "", Quantité: product.quantity, Seuil: product.threshold, "Prix de vente": product.price, ...(canReadCost ? { "Coût unitaire": product.cost ?? 0, "Valeur stock": (product.cost ?? 0) * product.quantity } : {}), Statut: stockStatus(product) })}
      searchPlaceholder="Produit, variante, IMEI…"
      emptyContent={emptyContent}
      mobileRow={(product) => (
        <div className={styles.mobileRow}>
          <span className={cn(styles.thumb, "size-10")}><Smartphone className="size-5" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2"><strong className="truncate text-sm font-semibold">{product.brand} {product.model}</strong>{product.quantity <= product.threshold ? <StatusBadge value={stockStatus(product)} showIcon={false} /> : null}</div>
            <p className="mt-1 truncate text-xs text-muted-foreground">{product.variant} · {product.condition}</p>
            <div className="mt-1.5 flex items-center justify-between gap-2 text-[13px]"><span><strong className={cn("font-semibold", quantityClass(product))}>{product.quantity}</strong><span className={styles.threshold}>/ seuil {product.threshold}</span></span><Money value={product.price} className="font-semibold tabular-nums" currencyClassName={styles.currency} /></div>
          </div>
          <ChevronRight className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
    />
  );
}

export { StockTable, stockStatus };
