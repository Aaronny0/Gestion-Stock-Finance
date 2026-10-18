"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Archive, ArrowRightLeft, Package, PackagePlus, Pencil, Plus, TriangleAlert, Upload } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { DateRangeFilter } from "@/components/data-display/date-range-filter";
import { EmptyState } from "@/components/data-display/empty-state";
import { ListCard, ListTabs } from "@/components/data-display/list-card";
import { SummaryItem, SummaryStrip } from "@/components/data-display/summary-strip";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActionForm } from "@/frontend/forms";
import { useViewState, useWorkspace } from "@/frontend/provider";
import type { Product, RecordRow } from "@/frontend/types";
import { ProductDetails } from "@/features/stock/product-details";
import { StockFilters } from "@/features/stock/stock-filters";
import { StockImportDialog } from "@/features/stock/stock-import-dialog";
import { formatListDate } from "@/lib/format";
import styles from "@/features/stock/stock.module.css";
import { StockTable } from "@/features/stock/stock-table";

function RecordDetailsDialog({ row, canReadCost, onClose }: { row: RecordRow; canReadCost: boolean; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent size="sm">
        <DialogHeader><DialogTitle>{row.label}</DialogTitle><DialogDescription>Détail de l’opération de stock sélectionnée.</DialogDescription></DialogHeader>
        <DialogBody>
        <dl className="grid gap-3 sm:grid-cols-2">
          {Object.entries(row).filter(([key]) => !["id", "storeId"].includes(key) && (canReadCost || !["cost", "margin"].includes(key))).map(([key, value]) => <div className="rounded-md bg-muted p-3" key={key}><dt className="text-xs font-medium text-muted-foreground">{key}</dt><dd className="mt-1 break-words text-sm font-semibold">{typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}</dd></div>)}
        </dl>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

const stockViews = [
  { id: "catalog", label: "Catalogue", path: "/stock" },
  { id: "entries", label: "Entrées & ajustements", path: "/stock/entries" },
  { id: "transfers", label: "Transferts", path: "/stock/transfers" },
  { id: "replenishment", label: "Réapprovisionnement", path: "/stock/replenishment" },
];

/** Onglets de Stock & catalogue (ListTabs, D28), partagés avec l'écran de réapprovisionnement. */
function StockViews({ current, catalogCount, lowCount }: { current: string; catalogCount?: number; lowCount?: number }) {
  const { href } = useWorkspace();
  return (
    <ListTabs
      aria-label="Vues du stock"
      items={stockViews.map((view) => ({
        href: href(view.path),
        label: view.label,
        active: current === view.id,
        count: view.id === "catalog" ? catalogCount || undefined : view.id === "replenishment" ? lowCount || undefined : undefined,
        tone: view.id === "replenishment" ? ("warning" as const) : undefined,
      }))}
    />
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
  const [search, setSearch] = useViewState("stock:search", "");
  const scopedProducts = db.products.filter((product) => storeId === "all" || product.storeId === storeId);
  const launch = (type: string, title: string, initial?: Record<string, unknown>) => setAction({ type, title, initial });
  const scope = (row: { storeId?: string; date: string }) => (!row.storeId || storeId === "all" || row.storeId === storeId) && row.date.slice(0, 10) >= start && row.date.slice(0, 10) <= end;

  if (path.startsWith("/products/")) {
    const product = scopedProducts.find((item) => item.id === path.split("/")[2]);
    return (
      <div className="space-y-6">
        <PageHeader
          title={product ? `${product.brand} ${product.model}` : "Produit introuvable"}
          description={product ? `${product.variant} · ${product.condition}` : "Ce produit n’est pas disponible dans la boutique active."}
          primaryAction={product && can("stock.adjust") ? <Button onClick={() => launch("stock.entry", "Nouvelle entrée", { productId: product.id })}><PackagePlus /> Nouvelle entrée</Button> : undefined}
          secondaryActions={product ? [
            ...(can("stock.adjust") ? [{ label: "Modifier", icon: Pencil, onSelect: () => launch("product.save", "Modifier le produit", product as unknown as Record<string, unknown>) }, { label: "Ajuster", icon: Package, onSelect: () => launch("stock.adjust", "Ajuster le stock", { productId: product.id, quantity: product.quantity }) }] : []),
            ...(can("stock.transfer") ? [{ label: "Transférer", icon: ArrowRightLeft, onSelect: () => launch("stock.transfer", "Transférer", { productId: product.id }) }] : []),
            ...(can("stock.adjust") ? [{ label: "Archiver", icon: Archive, onSelect: () => launch("product.archive", "Archiver le produit", { productId: product.id }) }] : []),
          ] : []}
        />
        {product ? <ProductDetails product={product} history={db.stockEntries.filter((row) => row.productId === product.id)} canReadCost={can("stock.cost.read")} /> : <div className="rounded-lg border border-destructive/20 bg-destructive-background p-4 text-sm text-destructive">Produit introuvable dans la boutique active.</div>}
        {action ? <ActionForm {...action} onClose={() => setAction(null)} /> : null}
      </div>
    );
  }

  const tab = path.split("/")[2] || "catalog";
  const activeProducts = scopedProducts.filter((product) => product.active);
  const lowProducts = activeProducts.filter((product) => product.quantity <= product.threshold);
  const outCount = lowProducts.filter((product) => product.quantity === 0).length;
  const products = scopedProducts.filter((product) => product.active !== archived && (!brand || product.brand === brand) && (!condition || product.condition === condition) && (!low || product.quantity <= product.threshold));
  const brands = [...new Set(scopedProducts.map((product) => product.brand))];
  const filtered = Boolean(brand || condition || low || archived || search);
  const resetFilters = () => { setBrand(""); setCondition(""); setLow(false); setArchived(false); setSearch(""); };
  const canAdjust = can("stock.adjust");
  const canTransfer = can("stock.transfer");
  const activityRows = (tab === "transfers" ? db.transfers : db.stockEntries).filter(scope);
  const activityColumns: ColumnDef<RecordRow>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => formatListDate(row.original.date) },
    { accessorKey: "label", header: "Produit", cell: ({ row }) => <span className="font-medium">{row.original.label}</span> },
    { accessorKey: "quantity", header: "Quantité", meta: { align: "right" } },
    { accessorKey: "reason", header: "Motif", cell: ({ row }) => String(row.original.reason ?? "—") },
    { accessorKey: "status", header: "Statut", cell: ({ row }) => <StatusBadge value={row.original.status} showIcon={false} /> },
    ...(tab === "transfers" ? [{ id: "destination", header: "Destination", accessorFn: (row: RecordRow) => snapshot!.session.stores.find((store) => store.id === row.destination)?.name ?? "—" } as ColumnDef<RecordRow>] : []),
  ];

  const secondaryActions = [
    ...(canAdjust ? [{ label: "Importer", icon: Upload, onSelect: () => setImporting(true) }] : []),
    ...(canTransfer ? [{ label: "Transférer", icon: ArrowRightLeft, onSelect: () => launch("stock.transfer", "Transférer du stock") }] : []),
    ...(canAdjust ? [{ label: "Nouveau produit", icon: Plus, onSelect: () => launch("product.save", "Créer un produit") }] : []),
  ];
  const entryButton = canAdjust ? <Button onClick={() => launch("stock.entry", "Nouvelle entrée")}><PackagePlus /> Nouvelle entrée</Button> : null;

  const catalogEmpty = !activeProducts.length && !filtered ? (
    <EmptyState
      kind="first-use"
      icon={Package}
      title="Votre catalogue est vide"
      description="Ajoutez vos premières références pour suivre les quantités, les seuils d’alerte et la valeur de votre stock."
      actions={canAdjust ? <><Button variant="outline" onClick={() => setImporting(true)}><Upload /> Importer un fichier</Button><Button onClick={() => launch("product.save", "Créer un produit")}><Plus /> Créer un produit</Button></> : undefined}
      steps={[
        { title: "Créer la référence", description: "Marque, modèle, variante, prix de vente et seuil d’alerte." },
        { title: "Enregistrer l’arrivage", description: "Une entrée de stock fixe la quantité et le coût d’achat." },
        { title: "Vendre", description: "Chaque vente décompte le stock et alerte sous le seuil." },
      ]}
    />
  ) : (
    <EmptyState kind="no-results" title="Aucun produit ne correspond" description="Aucune référence ne correspond à la recherche ou aux filtres actifs." onClearFilters={filtered ? resetFilters : undefined} />
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title="Stock & catalogue"
        description="Retrouvez vos produits, anticipez les ruptures et gérez vos arrivages."
        secondaryActions={secondaryActions}
        primaryAction={entryButton}
      />

      <SummaryStrip aria-label="Synthèse du stock">
        <SummaryItem label={`Références ${archived ? "archivées" : "actives"}`} value={products.length} meta={`${brands.length} marque${brands.length > 1 ? "s" : ""} au catalogue`} />
        <SummaryItem label="Unités en stock" value={products.reduce((sum, product) => sum + product.quantity, 0)} meta="dans la sélection affichée" />
        <SummaryItem label="À réapprovisionner" icon={TriangleAlert} tone="warning" value={lowProducts.length} note={outCount ? `dont ${outCount} en rupture` : undefined} meta={low ? "Afficher tout le catalogue" : "Filtrer ces références →"} pressed={low} onPress={() => setLow(!low)} />
        {can("stock.cost.read") ? <SummaryItem label="Valeur d’achat du stock" money={products.reduce((sum, product) => sum + (product.cost ?? 0) * product.quantity, 0)} meta="au coût unitaire, sélection affichée" /> : null}
      </SummaryStrip>

      <ListCard aria-label="Stock" tabs={<StockViews current={tab} catalogCount={activeProducts.length} lowCount={lowProducts.length} />}>
        {tab === "catalog" ? (
          <StockTable products={products} canReadCost={can("stock.cost.read")} canExport={can("exports.create")} search={search} onSearch={setSearch} emptyContent={catalogEmpty} onOpen={(product: Product) => router.push(href(`/products/${product.id}`))} filters={<StockFilters brands={brands} brand={brand} condition={condition} low={low} archived={archived} onBrand={setBrand} onCondition={setCondition} onLow={setLow} onArchived={setArchived} onReset={resetFilters} />} />
        ) : (
          <DataTable name={tab} data={activityRows} columns={activityColumns} getRowId={(row) => row.id} onRow={setSelected} toolbarStart={<DateRangeFilter />} enableSelection={can("exports.create")} canExport={can("exports.create")} exportRow={(row) => ({ Date: row.date, Produit: row.label, Quantité: row.quantity ?? "", Motif: row.reason ?? "", Statut: row.status, ...(tab === "transfers" ? { Destination: snapshot!.session.stores.find((store) => store.id === row.destination)?.name ?? "" } : {}) })} searchPlaceholder="Produit, motif, statut…" emptyKind="first-use" emptyTitle={tab === "transfers" ? "Aucun transfert sur la période" : "Aucune entrée sur la période"} emptyDescription="Élargissez la période ou enregistrez une nouvelle opération." />
        )}
      </ListCard>

      {action ? <ActionForm {...action} onClose={() => setAction(null)} /> : null}
      {importing ? <StockImportDialog onClose={() => setImporting(false)} /> : null}
      {selected ? <RecordDetailsDialog row={selected} canReadCost={can("stock.cost.read")} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

export { StockPage, StockViews };
