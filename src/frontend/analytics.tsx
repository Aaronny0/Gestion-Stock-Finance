"use client";
import { ArrowUpRight } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-display/data-table";
import { DateRangeFilter } from "@/components/data-display/date-range-filter";
import { ListCard, ListTabs } from "@/components/data-display/list-card";
import { Money } from "@/components/data-display/money";
import { SummaryItem, SummaryStrip } from "@/components/data-display/summary-strip";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatListDate } from "@/lib/format";
import type { Payment, Product, RecordRow, Sale } from "./types";
import { salePosition, saleActivity, netLineValue } from "./operations";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useWorkspace } from "./provider";
import { indicators } from "./accounting";
import { Alert } from "./ui";
const RankingChart = dynamic(
  () => import("./charts").then((m) => m.RankingChart),
  { ssr: false, loading: () => <div className="chart-area skeleton" /> },
);
export default function Analytics({ path }: { path: string }) {
  const { snapshot, start, end, storeId, href, can } = useWorkspace(),
    router = useRouter();
  const db = snapshot!.data,
    tab = path.split("/")[2] || "executive";
  const [brand, setBrand] = useState(
      () => new URLSearchParams(location.search).get("brand") || "",
    ),
    [seller, setSeller] = useState(
      () => new URLSearchParams(location.search).get("seller") || "",
    ),
    [method, setMethod] = useState(
      () => new URLSearchParams(location.search).get("method") || "",
    );
  const updateFilter = (key: string, value: string) => {
    const q = new URLSearchParams(location.search);
    if (value) q.set(key, value);
    else q.delete(key);
    router.replace(`${location.pathname}?${q}`, { scroll: false });
  };
  if (db.sales.length > 2000 && !snapshot!.reporting)
    return (
      <Alert>
        Ce rapport couvre trop d’opérations. Réduisez la période pour le
        consulter.
      </Alert>
    );
  const scoped = (v: { storeId?: string; date: string }) =>
    (storeId === "all" || v.storeId === storeId) &&
    v.date.slice(0, 10) >= start &&
    v.date.slice(0, 10) <= end;
  const sales = db.sales.filter(
    (s) =>
      (storeId === "all" || s.storeId === storeId) && (scoped(s) || s.returns?.some(r => scoped({...r,storeId:s.storeId}))) &&
      (!brand || s.lines.some((l) => l.brand === brand)) &&
      (!seller || s.seller === seller) &&
      (!method ||
        db.payments.some((p) => p.sourceId === s.id && p.method === method)),
  );
  const kpi = !brand && !seller && !method && snapshot!.reporting ? snapshot!.reporting.kpis : indicators(
    sales,
    db.payments.filter(scoped),
    db.entries.filter(scoped),
    {start,end},
  );
  const rank = Object.entries(
    sales
      .reduce<Record<string, number>>((a, s) => {
        for (const [index, l] of s.lines.entries()) {
          const key = tab === "team" ? s.seller : l.brand;
          a[key] = (a[key] ?? 0) + netLineValue(s, index, {start,end});
        }
        return a;
      }, {}),
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const tabs = [
    ["executive", "Vue exécutive"],
    ["sales", "Ventes"],
    ["stock", "Stock"],
    ["margin", "Marge"],
    ["team", "Équipe"],
    ["clients", "Clients"],
    ["cash", "Trésorerie"],
    ["accounting", "Comptabilité"],
    ["trade", "Troc / rachat"],
  ].filter(
    ([key]) =>
      !["margin", "accounting"].includes(key) ||
      can("analytics.cost_margin_read"),
  );
  const canMargin = can("analytics.cost_margin_read");
  const margin = (sale: Sale) => saleActivity(sale, start, end).netIncome - saleActivity(sale, start, end).netCost;
  const filter = (label: string, value: string, options: string[], all: string, onChange: (value: string) => void) => (
    <Select value={value || "all"} onValueChange={(next) => onChange(next === "all" ? "" : next)}>
      <SelectTrigger className="w-full sm:w-44" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{all}</SelectItem>
        {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
      </SelectContent>
    </Select>
  );
  const saleColumns: ColumnDef<Sale>[] = [
    { accessorKey: "reference", header: "Référence" },
    { accessorKey: "date", header: "Date", cell: ({ row }) => formatListDate(row.original.date, { time: true }) },
    { accessorKey: "seller", header: "Vendeur" },
    { id: "total", header: "CA", meta: { align: "right" }, accessorFn: (sale) => salePosition(sale).netTotal, cell: ({ row }) => <Money value={salePosition(row.original).netTotal} /> },
    ...(canMargin ? [{ id: "margin", header: "Marge", meta: { align: "right" }, accessorFn: margin, cell: ({ row }: { row: { original: Sale } }) => <Money value={margin(row.original)} /> } as ColumnDef<Sale>] : []),
  ];
  const days = Math.max(1, (new Date(end).getTime() - new Date(start).getTime()) / 86400000 + 1);
  type StockRow = Product & { sold: number; coverage: number | null; dormant: boolean };
  const stockRows: StockRow[] = db.products
    .filter((p) => (storeId === "all" || p.storeId === storeId) && (!brand || p.brand === brand))
    .map((p) => {
      const sold = sales.flatMap((s) => s.lines).filter((l) => l.productId === p.id).reduce((n, l) => n + l.quantity, 0);
      return { ...p, sold, coverage: sold ? Math.round(p.quantity / (sold / days)) : null, dormant: !sold };
    });
  const stockColumns: ColumnDef<StockRow>[] = [
    { accessorKey: "model", header: "Produit", cell: ({ row }) => <span className="font-medium">{row.original.brand} {row.original.model}</span> },
    { accessorKey: "quantity", header: "Stock", meta: { align: "right" } },
    { accessorKey: "sold", header: "Unités vendues", meta: { align: "right" } },
    { id: "coverage", header: "Couverture (jours)", meta: { align: "right" }, accessorFn: (p) => p.coverage ?? -1, cell: ({ row }) => row.original.coverage ?? "Aucune vente" },
    { id: "dormant", header: "Dormant sur la période", accessorFn: (p) => (p.dormant ? "Oui" : "Non") },
    ...(canMargin ? [{ id: "value", header: "Valeur immobilisée", meta: { align: "right" }, accessorFn: (p: StockRow) => p.quantity * (p.cost ?? 0), cell: ({ row }: { row: { original: StockRow } }) => <Money value={row.original.quantity * (row.original.cost ?? 0)} /> } as ColumnDef<StockRow>] : []),
  ];
  type ClientRow = RecordRow & { count: number; total: number; due: number };
  const clientRows: ClientRow[] = db.clients.map((c) => ({
    ...c,
    count: sales.filter((s) => s.clientId === c.id).length,
    total: sales.filter((s) => s.clientId === c.id).reduce((n, s) => n + salePosition(s).netTotal, 0),
    due: db.sales.filter((s) => s.clientId === c.id && salePosition(s).due > 0 && (storeId === "all" || s.storeId === storeId)).reduce((n, s) => n + salePosition(s).due, 0),
  }));
  const clientColumns: ColumnDef<ClientRow>[] = [
    { accessorKey: "label", header: "Client" },
    { accessorKey: "count", header: "Achats sur la période", meta: { align: "right" } },
    { accessorKey: "total", header: "Chiffre d’affaires", meta: { align: "right" }, cell: ({ row }) => <Money value={row.original.total} /> },
    { accessorKey: "due", header: "Reste dû", meta: { align: "right" }, cell: ({ row }) => <Money value={row.original.due} /> },
  ];
  const paymentColumns: ColumnDef<Payment>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => formatListDate(row.original.date, { time: true }) },
    { accessorKey: "label", header: "Source" },
    { accessorKey: "method", header: "Mode" },
    { id: "direction", header: "Sens", accessorFn: (p) => (p.direction === "in" ? "Entrée" : "Sortie") },
    { accessorKey: "amount", header: "Montant", meta: { align: "right" }, cell: ({ row }) => <Money value={row.original.amount} /> },
  ];
  type TradeRow = RecordRow & { type: string; complement: number };
  const tradeRows: TradeRow[] = [
    ...db.trades.filter(scoped).map((r) => ({ ...r, type: "Troc", complement: Number(r.complement ?? 0) })),
    ...db.buybacks.filter(scoped).map((r) => ({ ...r, type: "Rachat", complement: 0 })),
  ];
  const tradeColumns: ColumnDef<TradeRow>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => formatListDate(row.original.date) },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "label", header: "Appareil" },
    { accessorKey: "amount", header: "Valeur de reprise", meta: { align: "right" }, cell: ({ row }) => <Money value={row.original.amount ?? 0} /> },
    { accessorKey: "complement", header: "Complément", meta: { align: "right" }, cell: ({ row }) => <Money value={row.original.complement} /> },
  ];
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Analyses & rapports" description="Explorez les tendances et retrouvez les opérations derrière chaque indicateur." />
      <SummaryStrip aria-label="Indicateurs de la période">
        <SummaryItem label="Chiffre d’affaires" money={kpi.revenue} />
        {canMargin ? <SummaryItem label="Marge brute" money={kpi.margin} /> : null}
        <SummaryItem label="Panier moyen" money={kpi.average} />
        <SummaryItem label="Ventes" value={kpi.count} />
      </SummaryStrip>
      <ListCard aria-label="Analyses" tabs={<ListTabs aria-label="Rapports" items={tabs.map(([key, label]) => ({ href: href("/analytics/" + key), label, active: tab === key }))} />}>
        <div data-list-toolbar="" className="flex flex-wrap items-center gap-2 border-b border-[#dde3e4] px-4 py-3">
          <DateRangeFilter />
          {filter("Filtre BI marque", brand, [...new Set(db.products.map((p) => p.brand))], "Toutes les marques", (value) => { setBrand(value); updateFilter("brand", value); })}
          {filter("Filtre BI vendeur", seller, [...new Set(db.sales.map((p) => p.seller))], "Tous les vendeurs", (value) => { setSeller(value); updateFilter("seller", value); })}
          {filter("Filtre BI paiement", method, [...new Set(db.payments.map((p) => p.method))], "Tous les paiements", (value) => { setMethod(value); updateFilter("method", value); })}
        </div>
        {["executive", "sales", "margin", "team"].includes(tab) ? (
          <>
            <section className="border-b border-[#dde3e4] p-4" aria-label={tab === "team" ? "Ventes nettes TTC par vendeur" : "Ventes nettes TTC par marque"}>
              <h2 className="text-base font-semibold">{tab === "team" ? "Ventes nettes TTC par vendeur" : "Ventes nettes TTC par marque"}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatListDate(start)} → {formatListDate(end)} · {snapshot!.session.organization.currency} · {brand || "Toutes marques"} · {seller || "Tous vendeurs"}
              </p>
              <RankingChart
                rows={rank}
                currency={snapshot!.session.organization.currency}
                onSelect={(label) => router.push(href("/sales") + `?${tab === "team" ? "seller" : "brand"}=${encodeURIComponent(label)}&start=${start}&end=${end}`)}
              />
            </section>
            <DataTable name="ventes-analyse" data={sales} columns={saleColumns} getRowId={(row) => row.id} canExport={can("exports.create")} exportRow={(s) => ({ Référence: s.reference, Date: s.date, Vendeur: s.seller, CA: salePosition(s).netTotal, ...(canMargin ? { Marge: margin(s) } : {}) })} onRow={(s) => router.push(href("/sales/" + s.id))} searchPlaceholder="Référence, vendeur…" emptyTitle="Aucune vente sur cette période" emptyDescription="Élargissez la période ou retirez un filtre d’analyse." />
          </>
        ) : null}
        {tab === "stock" ? <DataTable name="stock-analyse" data={stockRows} columns={stockColumns} getRowId={(row) => row.id} canExport={can("exports.create")} exportRow={(p) => ({ Produit: `${p.brand} ${p.model}`, Stock: p.quantity, "Unités vendues": p.sold, "Couverture (jours)": p.coverage ?? "", Dormant: p.dormant ? "Oui" : "Non", ...(canMargin ? { "Valeur immobilisée": p.quantity * (p.cost ?? 0) } : {}) })} onRow={(p) => router.push(href("/products/" + p.id))} searchPlaceholder="Produit…" emptyTitle="Aucun produit dans cette sélection" /> : null}
        {tab === "clients" ? <DataTable name="clients-analyse" data={clientRows} columns={clientColumns} getRowId={(row) => row.id} canExport={can("exports.create")} exportRow={(c) => ({ Client: c.label, "Achats sur la période": c.count, "Chiffre d’affaires": c.total, "Reste dû": c.due })} onRow={(c) => router.push(href("/clients/" + c.id))} searchPlaceholder="Client…" emptyTitle="Aucun client" /> : null}
        {tab === "cash" ? <DataTable name="flux-trésorerie" data={db.payments.filter(scoped)} columns={paymentColumns} getRowId={(row) => row.id} canExport={can("exports.create")} exportRow={(p) => ({ Date: p.date, Source: p.label, Mode: p.method, Sens: p.direction === "in" ? "Entrée" : "Sortie", Montant: p.amount })} searchPlaceholder="Source, mode…" emptyTitle="Aucun flux sur cette période" /> : null}
        {tab === "accounting" ? (
          <div className="space-y-4 p-4">
            <SummaryStrip aria-label="Résultat et trésorerie">
              <SummaryItem label="Résultat" money={kpi.result} />
              <SummaryItem label="Cashflow" money={kpi.cashflow} />
            </SummaryStrip>
            <Button variant="outline" asChild>
              <Link href={href("/accounting/statements")}>
                Ouvrir les états financiers <ArrowUpRight />
              </Link>
            </Button>
          </div>
        ) : null}
        {tab === "trade" ? <DataTable name="analyse-reprises" data={tradeRows} columns={tradeColumns} getRowId={(row) => row.id} canExport={can("exports.create")} exportRow={(r) => ({ Date: r.date, Type: r.type, Appareil: r.label, "Valeur de reprise": r.amount ?? 0, Complément: r.complement })} searchPlaceholder="Appareil, type…" emptyTitle="Aucune reprise sur cette période" /> : null}
      </ListCard>
      <p className="text-xs text-muted-foreground">
        Source : opérations autorisées de la boutique et de la période sélectionnées. Les comparaisons nécessitent les données des périodes précédentes.
      </p>
    </div>
  );
}
