"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRightLeft, MoreHorizontal, Package, PackagePlus, Plus, TriangleAlert, Upload } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { DateRangeFilter } from "@/components/data-display/date-range-filter";
import { EmptyState } from "@/components/data-display/empty-state";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ActionForm } from "@/frontend/forms";
import { useViewState, useWorkspace } from "@/frontend/provider";
import type { Product, RecordRow } from "@/frontend/types";
import { ProductDetails } from "@/features/stock/product-details";
import { StockFilters } from "@/features/stock/stock-filters";
import { StockImportDialog } from "@/features/stock/stock-import-dialog";
import { StockTabs } from "@/features/stock/stock-tabs";
import { cn } from "@/lib/utils";
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
        <PageHeader eyebrow="FICHE PRODUIT" title={product ? `${product.brand} ${product.model}` : "Produit introuvable"} description={product ? `${product.variant} · ${product.condition}` : "Ce produit n’est pas disponible dans la boutique active."} />
        {product ? <ProductDetails product={product} history={db.stockEntries.filter((row) => row.productId === product.id)} canReadCost={can("stock.cost.read")} canAdjust={can("stock.adjust")} canTransfer={can("stock.transfer")} onEdit={() => launch("product.save", "Modifier le produit", product as unknown as Record<string, unknown>)} onEntry={() => launch("stock.entry", "Nouvelle entrée")} onAdjust={() => launch("stock.adjust", "Ajuster le stock", { productId: product.id, quantity: product.quantity })} onTransfer={() => launch("stock.transfer", "Transférer", { productId: product.id })} onArchive={() => launch("product.archive", "Archiver le produit", { productId: product.id })} /> : <div className="rounded-lg border border-destructive/20 bg-destructive-background p-4 text-sm text-destructive">Produit introuvable dans la boutique active.</div>}
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
    { accessorKey: "date", header: "Date", cell: ({ row }) => new Date(row.original.date).toLocaleDateString("fr-FR") },
    { accessorKey: "label", header: "Produit", cell: ({ row }) => <span className="font-medium">{row.original.label}</span> },
    { accessorKey: "quantity", header: "Quantité", meta: { align: "right" } },
    { accessorKey: "reason", header: "Motif", cell: ({ row }) => String(row.original.reason ?? "—") },
    { accessorKey: "status", header: "Statut", cell: ({ row }) => <StatusBadge value={row.original.status} showIcon={false} /> },
    ...(tab === "transfers" ? [{ id: "destination", header: "Destination", accessorFn: (row: RecordRow) => snapshot!.session.stores.find((store) => store.id === row.destination)?.name ?? "—" } as ColumnDef<RecordRow>] : []),
  ];

  const secondaryActions = [
    canAdjust ? { key: "import", label: "Importer", icon: <Upload />, run: () => setImporting(true) } : null,
    canTransfer ? { key: "transfer", label: "Transférer", icon: <ArrowRightLeft />, run: () => launch("stock.transfer", "Transférer du stock") } : null,
    canAdjust ? { key: "product", label: "Nouveau produit", icon: <Plus />, run: () => launch("product.save", "Créer un produit") } : null,
  ].filter((item) => item !== null);
  const entryButton = canAdjust ? <Button onClick={() => launch("stock.entry", "Nouvelle entrée")}><PackagePlus /> Nouvelle entrée</Button> : null;

  const catalogEmpty = !activeProducts.length && !filtered ? (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}><Package className="size-6" aria-hidden="true" /></span>
      <div>
        <h2>Votre catalogue est vide</h2>
        <p>Ajoutez vos premières références pour suivre les quantités, les seuils d’alerte et la valeur de votre stock.</p>
      </div>
      {canAdjust ? <div className="flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={() => setImporting(true)}><Upload /> Importer un fichier</Button><Button onClick={() => launch("product.save", "Créer un produit")}><Plus /> Créer un produit</Button></div> : null}
      <ol className={styles.steps}>
        <li><span>1</span><span><strong>Créer la référence</strong><small>Marque, modèle, variante, prix de vente et seuil d’alerte.</small></span></li>
        <li><span>2</span><span><strong>Enregistrer l’arrivage</strong><small>Une entrée de stock fixe la quantité et le coût d’achat.</small></span></li>
        <li><span>3</span><span><strong>Vendre</strong><small>Chaque vente décompte le stock et alerte sous le seuil.</small></span></li>
      </ol>
    </div>
  ) : (
    <EmptyState kind="no-results" title="Aucun produit ne correspond" description="Aucune référence ne correspond à la recherche ou aux filtres actifs." onClearFilters={filtered ? resetFilters : undefined} />
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title="Stock & catalogue"
        description="Retrouvez vos produits, anticipez les ruptures et gérez vos arrivages."
        actions={
          <>
            <div className={cn("flex flex-wrap items-center gap-2", styles.desktopActions)}>
              {secondaryActions.map((item) => <Button key={item.key} variant="outline" onClick={item.run}>{item.icon} {item.label}</Button>)}
              {entryButton}
            </div>
            {secondaryActions.length || entryButton ? (
              <div className={styles.mobileActions}>
                {secondaryActions.length ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Autres actions de stock"><MoreHorizontal /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="start">{secondaryActions.map((item) => <DropdownMenuItem key={item.key} onClick={item.run}>{item.icon} {item.label}</DropdownMenuItem>)}</DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
                {entryButton}
              </div>
            ) : null}
          </>
        }
      />

      <section className={styles.summary} aria-label="Synthèse du stock">
        <div><span className={styles.label}>Références {archived ? "archivées" : "actives"}</span><strong className={styles.value}>{products.length}</strong><span className={styles.meta}>{brands.length} marque{brands.length > 1 ? "s" : ""} au catalogue</span></div>
        <div><span className={styles.label}>Unités en stock</span><strong className={styles.value}>{products.reduce((sum, product) => sum + product.quantity, 0)}</strong><span className={styles.meta}>dans la sélection affichée</span></div>
        <button type="button" className={styles.alert} aria-pressed={low} onClick={() => setLow(!low)}>
          <span className={styles.label}><TriangleAlert aria-hidden="true" /> À réapprovisionner</span>
          <strong className={styles.value}>{lowProducts.length}{outCount ? <span className={styles.currency}> dont {outCount} en rupture</span> : null}</strong>
          <span className={styles.meta}>{low ? "Afficher tout le catalogue" : "Filtrer ces références →"}</span>
        </button>
        {can("stock.cost.read") ? <div><span className={styles.label}>Valeur d’achat du stock</span><strong className={styles.value}><Money value={products.reduce((sum, product) => sum + (product.cost ?? 0) * product.quantity, 0)} currencyClassName={styles.currency} /></strong><span className={styles.meta}>au coût unitaire, sélection affichée</span></div> : null}
      </section>

      <section className={styles.ledger} aria-label="Stock">
        <StockTabs current={tab} catalogCount={activeProducts.length} lowCount={lowProducts.length} />
        {tab === "catalog" ? (
          <StockTable products={products} canReadCost={can("stock.cost.read")} canExport={can("exports.create")} search={search} onSearch={setSearch} emptyContent={catalogEmpty} onOpen={(product: Product) => router.push(href(`/products/${product.id}`))} filters={<StockFilters brands={brands} brand={brand} condition={condition} low={low} archived={archived} onBrand={setBrand} onCondition={setCondition} onLow={setLow} onArchived={setArchived} onReset={resetFilters} />} />
        ) : (
          <DataTable name={tab} data={activityRows} columns={activityColumns} getRowId={(row) => row.id} onRow={setSelected} filters={<DateRangeFilter />} enableSelection={can("exports.create")} canExport={can("exports.create")} exportRow={(row) => ({ Date: row.date, Produit: row.label, Quantité: row.quantity ?? "", Motif: row.reason ?? "", Statut: row.status, ...(tab === "transfers" ? { Destination: snapshot!.session.stores.find((store) => store.id === row.destination)?.name ?? "" } : {}) })} searchPlaceholder="Produit, motif, statut…" emptyTitle={tab === "transfers" ? "Aucun transfert sur la période" : "Aucune entrée sur la période"} emptyDescription="Élargissez la période ou enregistrez une nouvelle opération." />
        )}
      </section>

      {action ? <ActionForm {...action} onClose={() => setAction(null)} /> : null}
      {importing ? <StockImportDialog onClose={() => setImporting(false)} /> : null}
      {selected ? <RecordDetailsDialog row={selected} canReadCost={can("stock.cost.read")} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

export { StockPage };
