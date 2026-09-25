"use client";

import { useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/frontend/forms";
import { replenishment } from "@/frontend/operations";
import { useWorkspace } from "@/frontend/provider";
import type { Product } from "@/frontend/types";

type ReplenishmentRow = Product & { label: string; supplier: string; target: number; suggested: number };

function ReplenishmentPage() {
  const { snapshot, storeId, can, href } = useWorkspace();
  const db = snapshot!.data;
  const [purchase, setPurchase] = useState<Record<string, unknown> | null>(null);
  const rows: ReplenishmentRow[] = db.products.filter((product) => product.active && (storeId === "all" || product.storeId === storeId) && product.quantity <= product.threshold).map((product) => ({ ...product, label: `${product.brand} ${product.model} ${product.variant}`, supplier: db.suppliers.find((supplier) => supplier.id === product.supplierId)?.label ?? "À choisir", ...replenishment(product) }));
  const columns: ColumnDef<ReplenishmentRow>[] = [
    { accessorKey: "label", header: "Produit", cell: ({ row }) => <span className="font-medium">{row.original.label}</span> },
    { accessorKey: "quantity", header: "Disponible", cell: ({ row }) => <StatusBadge value={row.original.quantity === 0 ? "Rupture" : `${row.original.quantity} · Stock faible`} /> },
    { accessorKey: "threshold", header: "Seuil" },
    { accessorKey: "target", header: "Cible" },
    { accessorKey: "suggested", header: "À prévoir" },
    { accessorKey: "supplier", header: "Fournisseur" },
    { id: "action", header: "Action", enableSorting: false, cell: ({ row }) => can("purchases.manage") ? <Button variant="link" size="sm" disabled={storeId === "all" || !row.original.suggested} onClick={() => setPurchase({ productId: row.original.id, quantity: row.original.suggested, cost: row.original.cost ?? 0, supplierId: row.original.supplierId ?? "" })}><ShoppingCart /> Préparer</Button> : null },
  ];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="PRÉPARATION DES ACHATS" title="Anticipez les ruptures." description="Une proposition par produit sous son seuil d’alerte. Ajustez la quantité et le fournisseur avant de confirmer un achat." actions={<Button variant="outline" asChild><Link href={href("/stock")}><ArrowLeft /> Retour au stock</Link></Button>} />
      <div className="rounded-md border border-info/20 bg-info-background p-4 text-sm text-info">La cible est configurable dans la fiche produit. À défaut, elle correspond au double du seuil, avec un minimum d’une unité. Aucune commande fournisseur n’est envoyée automatiquement.</div>
      <DataTable name="reapprovisionnement" data={rows} columns={columns} getRowId={(row) => row.id} searchPlaceholder="Produit, fournisseur…" emptyTitle="Aucun réapprovisionnement nécessaire" emptyDescription="Les produits actifs de cette boutique sont actuellement au-dessus de leur seuil d’alerte." />
      {purchase ? <ActionForm type="purchase.create" title="Préparer le réapprovisionnement" initial={purchase} onClose={() => setPurchase(null)} /> : null}
    </div>
  );
}

export { ReplenishmentPage };
