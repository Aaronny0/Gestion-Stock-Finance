"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRightLeft, PackagePlus, Plus, Upload } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { DateRangeFilter } from "@/components/data-display/date-range-filter";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionForm } from "@/frontend/forms";
import { useViewState, useWorkspace } from "@/frontend/provider";
import type { Product, RecordRow } from "@/frontend/types";
import { ProductDetails } from "@/features/stock/product-details";
import { StockFilters } from "@/features/stock/stock-filters";
import { StockImportDialog } from "@/features/stock/stock-import-dialog";
import { StockTable } from "@/features/stock/stock-table";

function RecordDetailsDialog({ row, canReadCost, onClose }: { row: RecordRow; canReadCost: boolean; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{row.label}</DialogTitle><DialogDescription>Détail de l’opération de stock sélectionnée.</DialogDescription></DialogHeader>
        <dl className="grid gap-3 sm:grid-cols-2">
          {Object.entries(row).filter(([key]) => !["id", "storeId"].includes(key) && (canReadCost || !["cost", "margin"].includes(key))).map(([key, value]) => <div className="rounded-md bg-muted p-3" key={key}><dt className="text-xs font-medium text-muted-foreground">{key}</dt><dd className="mt-1 break-words text-sm font-semibold">{typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}</dd></div>)}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function StockPage({ path }: { path: string }) {
  const { snapshot, storeId, start, end, href, can } = useWorkspace();
  const router = useRouter();
  const db = snapshot!.data;
  const [action, setAction] = useState<{ type: string; title: string; initial?: Record<string, unknown> } | null>(null);
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const [importing, setImporting] = useState(false);
  const [brand, setBrand] = useViewState("stock:brand", "");
  const [condition, setCondition] = useViewState("stock:condition", "");
  const [archived, setArchived] = useViewState("stock:archived", false);
  const [low, setLow] = useViewState("stock:low", typeof location !== "undefined" && new URLSearchParams(location.search).get("low") === "1");
  const scopedProducts = db.products.filter((product) => storeId === "all" || product.storeId === storeId);
  const launch = (type: string, title: string, initial?: Record<string, unknown>) => setAction({ type, title, initial });
  const scope = (row: { storeId?: string; date: string }) => (!row.storeId || storeId === "all" || row.storeId === storeId) && row.date.slice(0, 10) >= start && row.date.slice(0, 10) <= end;

  if (path.startsWith("/products/")) {
    const product = scopedProducts.find((item) => item.id === path.split("/")[2]);
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="FICHE PRODUIT" title={product ? `${product.brand} ${product.model}` : "Produit introuvable"} description={product ? `${product.variant} · ${product.condition}` : "Ce produit n’est pas disponible dans la boutique active."} />
        {product ? <ProductDetails product={product} history={db.stockEntries.filter((row) => row.productId === product.id)} canReadCost={can("stock.cost.read")} canAdjust={can("stock.adjust")} canTransfer={can("stock.transfer")} onEdit={() => launch("product.save", "Modifier le produit", product as unknown as Record<string, unknown>)} onEntry={() => launch("stock.entry", "Nouvelle entrée")} onAdjust={() => launch("stock.adjust", "Ajuster le stock", { productId: product.id, quantity: product.quantity })} onTransfer={() => launch("stock.transfer", "Transférer", { productId: product.id })} onArchive={() => launch("product.archive", "Archiver le produit", { productId: product.id })} /> : <div className="rounded-lg border border-destructive/20 bg-destructive-background p-4 text-sm text-destructive">Produit introuvable dans la boutique active.</div>}
        {action ? <ActionForm {...action} onClose={() => setAction(null)} /> : null}
      </div>
    );
  }

  const tab = path.split("/")[2] || "catalog";
  const products = scopedProducts.filter((product) => product.active !== archived && (!brand || product.brand === brand) && (!condition || product.condition === condition) && (!low || product.quantity <= product.threshold));
  const activityRows = (tab === "transfers" ? db.transfers : db.stockEntries).filter(scope);
  const activityColumns: ColumnDef<RecordRow>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => new Date(row.original.date).toLocaleDateString("fr-FR") },
    { accessorKey: "label", header: "Produit" },
    { accessorKey: "quantity", header: "Quantité" },
    { accessorKey: "reason", header: "Motif", cell: ({ row }) => String(row.original.reason ?? "—") },
    { accessorKey: "status", header: "Statut", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    ...(tab === "transfers" ? [{ id: "destination", header: "Destination", accessorFn: (row: RecordRow) => snapshot!.session.stores.find((store) => store.id === row.destination)?.name ?? "—" } as ColumnDef<RecordRow>] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="STOCK & CATALOGUE" title="Le bon stock, au bon endroit." description="Retrouvez vos produits, anticipez les ruptures et gérez vos arrivages." actions={can("stock.adjust") ? <Button onClick={() => launch("stock.entry", "Nouvelle entrée")}><PackagePlus /> Nouvelle entrée</Button> : undefined} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Références</p><p className="mt-2 text-xl font-bold [font-variant-numeric:tabular-nums]">{products.length}</p></Card>
        <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Unités disponibles</p><p className="mt-2 text-xl font-bold [font-variant-numeric:tabular-nums]">{products.reduce((sum, product) => sum + product.quantity, 0)}</p></Card>
        <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Sous le seuil</p><p className="mt-2 text-xl font-bold [font-variant-numeric:tabular-nums]">{products.filter((product) => product.quantity <= product.threshold).length}</p></Card>
        {can("stock.cost.read") ? <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Valeur du stock</p><Money value={products.reduce((sum, product) => sum + (product.cost ?? 0) * product.quantity, 0)} className="mt-2 block text-xl font-bold" /></Card> : null}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={(value) => router.push(href(value === "catalog" ? "/stock" : `/stock/${value}`))}>
          <TabsList className="w-full overflow-x-auto lg:w-auto"><TabsTrigger value="catalog">Catalogue</TabsTrigger><TabsTrigger value="entries">Entrées & ajustements</TabsTrigger><TabsTrigger value="transfers">Transferts</TabsTrigger></TabsList>
        </Tabs>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link href={href("/stock/replenishment")}>Réapprovisionnement</Link></Button>
          {can("stock.adjust") ? <Button variant="outline" onClick={() => setImporting(true)}><Upload /> Importer</Button> : null}
          {can("stock.adjust") ? <Button variant="outline" onClick={() => launch("product.save", "Créer un produit")}><Plus /> Produit</Button> : null}
          {can("stock.transfer") ? <Button variant="outline" onClick={() => launch("stock.transfer", "Transférer du stock")}><ArrowRightLeft /> Transférer</Button> : null}
        </div>
      </div>

      {tab === "catalog" ? <StockTable products={products} canReadCost={can("stock.cost.read")} canExport={can("exports.create")} onOpen={(product: Product) => router.push(href(`/products/${product.id}`))} filters={<StockFilters brands={[...new Set(scopedProducts.map((product) => product.brand))]} brand={brand} condition={condition} low={low} archived={archived} onBrand={setBrand} onCondition={setCondition} onLow={setLow} onArchived={setArchived} />} /> : <div className="space-y-4"><DateRangeFilter /><DataTable name={tab} data={activityRows} columns={activityColumns} getRowId={(row) => row.id} onRow={setSelected} enableSelection={can("exports.create")} canExport={can("exports.create")} exportRow={(row) => ({ Date: row.date, Produit: row.label, Quantité: row.quantity ?? "", Motif: row.reason ?? "", Statut: row.status, ...(tab === "transfers" ? { Destination: snapshot!.session.stores.find((store) => store.id === row.destination)?.name ?? "" } : {}) })} searchPlaceholder="Produit, motif, statut…" /></div>}

      {action ? <ActionForm {...action} onClose={() => setAction(null)} /> : null}
      {importing ? <StockImportDialog onClose={() => setImporting(false)} /> : null}
      {selected ? <RecordDetailsDialog row={selected} canReadCost={can("stock.cost.read")} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

export { StockPage };
