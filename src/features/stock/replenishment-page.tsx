"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ShoppingCart } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/frontend/forms";
import { replenishment } from "@/frontend/operations";
import { useWorkspace } from "@/frontend/provider";
import type { Product } from "@/frontend/types";
import { ListCard } from "@/components/data-display/list-card";
import { StockViews } from "@/features/stock/stock-page";
import styles from "@/features/stock/stock.module.css";

type ReplenishmentRow = Product & { label: string; supplier: string; target: number; suggested: number };

function ReplenishmentPage() {
  const { snapshot, storeId, can } = useWorkspace();
  const db = snapshot!.data;
  const [purchase, setPurchase] = useState<Record<string, unknown> | null>(null);
  const rows: ReplenishmentRow[] = db.products.filter((product) => product.active && (storeId === "all" || product.storeId === storeId) && product.quantity <= product.threshold).map((product) => ({ ...product, label: `${product.brand} ${product.model} ${product.variant}`, supplier: db.suppliers.find((supplier) => supplier.id === product.supplierId)?.label ?? "À choisir", ...replenishment(product) }));
  const catalogCount = db.products.filter((product) => product.active && (storeId === "all" || product.storeId === storeId)).length;
  const columns: ColumnDef<ReplenishmentRow>[] = [
    { accessorKey: "label", header: "Produit", cell: ({ row }) => <span className="font-medium">{row.original.label}</span> },
    { accessorKey: "quantity", header: "Disponible", cell: ({ row }) => <StatusBadge value={row.original.quantity === 0 ? "Rupture" : `${row.original.quantity} · Stock faible`} showIcon={false} /> },
    { accessorKey: "threshold", header: "Seuil", meta: { align: "right" } },
    { accessorKey: "target", header: "Cible", meta: { align: "right" } },
    { accessorKey: "suggested", header: "À prévoir", meta: { align: "right" } },
    { accessorKey: "supplier", header: "Fournisseur" },
    { id: "action", header: "Action", enableSorting: false, cell: ({ row }) => can("purchases.manage") ? <Button variant="link" size="sm" disabled={storeId === "all" || !row.original.suggested} onClick={() => setPurchase({ productId: row.original.id, quantity: row.original.suggested, cost: row.original.cost ?? 0, supplierId: row.original.supplierId ?? "" })}><ShoppingCart /> Préparer</Button> : null },
  ];
  return (
    <div className={styles.page}>
      <PageHeader title="Stock & catalogue" description="Retrouvez vos produits, anticipez les ruptures et gérez vos arrivages." />
      <div className="rounded-md border border-info/20 bg-info-background p-4 text-sm text-info">Une proposition par produit sous son seuil d’alerte : ajustez la quantité et le fournisseur avant de confirmer un achat. La cible est configurable dans la fiche produit. À défaut, elle correspond au double du seuil, avec un minimum d’une unité. Aucune commande fournisseur n’est envoyée automatiquement.</div>
      <ListCard aria-label="Stock" tabs={<StockViews current="replenishment" catalogCount={catalogCount} lowCount={rows.length} />}>
        <DataTable name="reapprovisionnement" data={rows} columns={columns} getRowId={(row) => row.id} searchPlaceholder="Produit, fournisseur…" emptyKind="first-use" emptyTitle="Aucun réapprovisionnement nécessaire" emptyDescription="Les produits actifs de cette boutique sont actuellement au-dessus de leur seuil d’alerte." />
      </ListCard>
      {purchase ? <ActionForm type="purchase.create" title="Préparer le réapprovisionnement" initial={purchase} onClose={() => setPurchase(null)} /> : null}
    </div>
  );
}

export { ReplenishmentPage };
