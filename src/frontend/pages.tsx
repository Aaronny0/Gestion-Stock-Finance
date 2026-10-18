"use client";
import {DocumentLink} from "@/components/data-display/document-link";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus, Repeat2, ShoppingBag } from "lucide-react";
import { useWorkspace } from "./provider";
import { canonical } from "./navigation";
import { salePosition } from "./operations";
import { ActionForm } from "./forms";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-display/data-table";
import { DateRangeFilter } from "@/components/data-display/date-range-filter";
import { EmptyState } from "@/components/data-display/empty-state";
import { ListCard } from "@/components/data-display/list-card";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { SummaryItem, SummaryStrip } from "@/components/data-display/summary-strip";
import { PageHeader } from "@/components/layout/page-header";
import { formatListDate } from "@/lib/format";
import { Alert, Modal } from "./ui";
import { type RecordRow } from "./types";
import Dashboard from "./dashboard";
import { CreditsPage } from "@/features/sales/credits-page";
import { CashPage } from "@/features/finance/cash-page";
import { ExpensesPage } from "@/features/finance/expenses-page";
import { PaymentsPage } from "@/features/finance/payments-page";
import AccountingPage from "@/features/accounting/accounting-page";
import { SalesPage } from "@/features/sales/sales-page";
import { ReplenishmentPage } from "@/features/stock/replenishment-page";
import { StockPage } from "@/features/stock/stock-page";
import { TeamPage } from "@/features/team/team-page";
import { AuditPage } from "@/features/audit/audit-page";
import SettingsPage from "@/features/settings/settings-page";
import POS from "./pos";
const Analytics = dynamic(() => import("./analytics"));
export default function WorkspacePage() {
  const path = canonical(usePathname());
  if (path === "/") return <Dashboard />;
  if (path === "/sales/credits") return <CreditsPage />;
  if (path === "/stock/replenishment") return <ReplenishmentPage />;
  if (path.startsWith("/sales")) return <SalesPage path={path} />;
  if (path.startsWith("/stock") || path.startsWith("/products/")) return <StockPage path={path} />;
  if (path === "/pos") return <POS />;
  if (path.startsWith("/cash")) return <CashPage />;
  if (path.startsWith("/expenses")) return <ExpensesPage />;
  if (path.startsWith("/payments")) return <PaymentsPage />;
  if (path.startsWith("/accounting")) return <AccountingPage path={path} />;
  if (path.startsWith("/analytics")) return <Analytics path={path} />;
  if (path.startsWith("/team")) return <TeamPage />;
  if (path.startsWith("/audit")) return <AuditPage />;
  if (path.startsWith("/settings")) return <SettingsPage path={path} />;
  return <BusinessPage path={path} />;
}
function BusinessPage({ path }: { path: string }) {
  const { snapshot, storeId, start, end, href, can } = useWorkspace(),
    router = useRouter();
  const db = snapshot!.data;
  const [balanceOnly, setBalanceOnly] = useState(false);
  const [action, setAction] = useState<{
      type: string;
      title: string;
      initial?: Record<string, unknown>;
    } | null>(null),
    [selected, setSelected] = useState<RecordRow | null>(null);
  useEffect(() => {
    const sourceId = path.split("/")[2];
    if (!sourceId) return;
    const collections: Record<string, RecordRow[]> = {
      purchases: db.purchases,
      suppliers: db.suppliers,
      trade: db.trades,
      buyback: db.buybacks,
      clients: db.clients,
    };
    const record = collections[path.split("/")[1]]?.find(
      (r) =>
        r.id === sourceId &&
        (!r.storeId || storeId === "all" || r.storeId === storeId),
    );
    if (record) setSelected(record);
  }, [path, storeId, db]);
  const scope = (v: { storeId?: string; date: string }) =>
    (!v.storeId || storeId === "all" || v.storeId === storeId) &&
    v.date.slice(0, 10) >= start &&
    v.date.slice(0, 10) <= end;
  const launch = (
    type: string,
    title: string,
    initial?: Record<string, unknown>,
  ) => setAction({ type, title, initial });
  const primary = (type: string, title: string) => (
    <Button onClick={() => launch(type, title)}>
      <Plus />
      {title}
    </Button>
  );
  const canExport = can("exports.create");
  const dateColumn: ColumnDef<RecordRow> = { accessorKey: "date", header: "Date", cell: ({ row }) => formatListDate(row.original.date) };
  const statusColumn: ColumnDef<RecordRow> = { accessorKey: "status", header: "Statut", cell: ({ row }) => <StatusBadge value={row.original.status} showIcon={false} /> };
  const moneyColumn = (key: "amount" | "complement", header: string): ColumnDef<RecordRow> => ({ id: key, header, meta: { align: "right" }, accessorFn: (row) => Number(row[key] ?? 0), cell: ({ row }) => <Money value={Number(row.original[key] ?? 0)} /> });
  const mobileRow = (row: RecordRow, secondary: string) => (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <strong className="truncate text-sm font-semibold">{row.label}</strong>
          <StatusBadge value={row.status} showIcon={false} />
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">{secondary}</span>
          <Money value={Number(row.amount ?? 0)} className="text-sm font-semibold text-foreground" />
        </div>
      </div>
    </div>
  );
  let content: React.ReactNode;
  if (path.startsWith("/trade") || path.startsWith("/buyback")) {
    const trade = path.startsWith("/trade");
    const all = trade ? db.trades : db.buybacks;
    const rows = all.filter(scope);
    const noun = trade ? "troc" : "rachat";
    content = (
      <>
        <PageHeader
          title={trade ? "Troc & reprise" : "Rachat client"}
          description={
            trade
              ? "Un téléphone entre, un autre sort. Le complément reste clairement identifié."
              : "Un appareil rejoint votre stock et son règlement est suivi en trésorerie."
          }
          primaryAction={primary(trade ? "trade.create" : "buyback.create", trade ? "Nouveau troc" : "Nouveau rachat")}
        />
        <ListCard aria-label={trade ? "Historique des trocs" : "Historique des rachats"}>
          <DataTable
            name={trade ? "trocs" : "rachats"}
            data={rows}
            getRowId={(row) => row.id}
            toolbarStart={<DateRangeFilter />}
            columns={[dateColumn, { accessorKey: "label", header: "Appareil repris" }, moneyColumn("amount", "Valeur de reprise"), ...(trade ? [moneyColumn("complement", "Complément")] : []), statusColumn]}
            onRow={setSelected}
            mobileRow={(row) => mobileRow(row, formatListDate(row.date))}
            canExport={canExport}
            exportRow={(row) => ({ Date: row.date, "Appareil repris": row.label, "Valeur de reprise": row.amount ?? 0, ...(trade ? { Complément: Number(row.complement ?? 0) } : {}), Statut: row.status })}
            searchPlaceholder="Appareil, statut…"
            emptyContent={
              all.length ? undefined : (
                <EmptyState
                  kind="first-use"
                  icon={trade ? Repeat2 : ShoppingBag}
                  title={`Aucun ${noun} enregistré`}
                  description={trade ? "Le troc échange l’appareil d’un client contre un appareil de la boutique." : "Le rachat fait entrer en stock l’appareil d’un client, sans chiffre d’affaires."}
                  steps={[
                    { title: "Appareil du client", description: "Marque, modèle, état et valeur de reprise. IMEI facultatif." },
                    trade ? { title: "Appareil de la boutique", description: "Sélection depuis le stock disponible." } : { title: "Règlement au client", description: "Espèces, Mobile Money ou virement." },
                    trade ? { title: "Complément encaissé", description: "Prix boutique moins valeur de reprise." } : { title: "Entrée en stock", description: "Le rachat ne crée aucun chiffre d’affaires." },
                  ]}
                />
              )
            }
            emptyTitle={`Aucun ${noun} sur cette période`}
            emptyDescription="Élargissez la période pour retrouver l’historique."
          />
        </ListCard>
      </>
    );
  } else {
    const key = path.split("/")[1];
    const config: Record<
      string,
      {
        title: string;
        description: string;
        collection: "purchases" | "suppliers" | "clients";
        action: string;
        actionLabel: string;
        empty: string;
        emptyDescription: string;
      }
    > = {
      purchases: {
        title: "Achats",
        description: "Réceptions de marchandises, factures et dettes fournisseurs.",
        collection: "purchases",
        action: "purchase.create",
        actionLabel: "Nouvel achat",
        empty: "Aucun achat enregistré",
        emptyDescription: "Un achat réceptionne la marchandise en stock et suit ce qui reste dû au fournisseur.",
      },
      suppliers: {
        title: "Fournisseurs",
        description: "Coordonnées, achats et soldes de vos fournisseurs.",
        collection: "suppliers",
        action: "supplier.save",
        actionLabel: "Nouveau fournisseur",
        empty: "Aucun fournisseur",
        emptyDescription: "Ajoutez vos fournisseurs pour rattacher les achats et suivre les soldes à régler.",
      },
      clients: {
        title: "Clients",
        description: "Retrouvez les coordonnées, les achats et les montants dus.",
        collection: "clients",
        action: "client.save",
        actionLabel: "Nouveau client",
        empty: "Aucun client",
        emptyDescription: "Les clients enregistrés en caisse ou ici apparaîtront dans le répertoire.",
      },
    };
    const c = config[key];
    if (c) {
      const directory = ["suppliers", "clients"].includes(key);
      const all = db[c.collection];
      const rows = all
        .filter((r) => directory || scope(r))
        .map((r) =>
          key === "suppliers"
            ? {
                ...r,
                amount: db.purchases
                  .filter(
                    (p) =>
                      p.supplierId === r.id &&
                      (storeId === "all" || p.storeId === storeId),
                  )
                  .reduce((s, p) => s + (p.amount ?? 0) - (p.paid ?? 0), 0),
              }
            : key === "clients"
              ? {
                  ...r,
                  amount: db.sales
                    .filter(
                      (s) =>
                        s.clientId === r.id &&
                        salePosition(s).due > 0 &&
                        (storeId === "all" || s.storeId === storeId),
                    )
                    .reduce((n, s) => n + salePosition(s).due, 0),
                }
              : r,
        );
      const canCreate = key !== "clients" || can("sales.create");
      const visible = balanceOnly && directory ? rows.filter((r) => (r.amount ?? 0) > 0) : rows;
      const amountLabel = directory ? "Solde dû" : "Montant";
      content = (
        <>
          <PageHeader title={c.title} description={c.description} primaryAction={canCreate ? primary(c.action, c.actionLabel) : undefined} />
          {directory ? (
            <SummaryStrip aria-label={`Synthèse ${key === "clients" ? "des clients" : "des fournisseurs"}`}>
              <SummaryItem label={key === "clients" ? "Clients" : "Fournisseurs"} value={rows.length} meta={key === "clients" ? "dans votre répertoire" : "partenaires enregistrés"} />
              <SummaryItem
                label={key === "clients" ? "Créances clients" : "Soldes fournisseurs"}
                tone="warning"
                money={rows.reduce((sum, r) => sum + (r.amount ?? 0), 0)}
                meta={balanceOnly ? "Afficher tout le répertoire" : "Voir uniquement les soldes à régler →"}
                pressed={balanceOnly}
                onPress={() => setBalanceOnly(!balanceOnly)}
              />
            </SummaryStrip>
          ) : null}
          <ListCard aria-label={c.title}>
            <DataTable
              name={key}
              data={visible}
              getRowId={(row) => row.id}
              toolbarStart={directory ? undefined : <DateRangeFilter />}
              columns={[
                { accessorKey: "label", header: directory ? "Nom" : "Référence", cell: ({ row }) => <span className="font-medium">{row.original.label}</span> },
                ...(directory
                  ? [
                      { accessorKey: "phone", header: "Téléphone", cell: ({ row }) => String(row.original.phone ?? "—") } as ColumnDef<RecordRow>,
                      { accessorKey: "email", header: "Email", cell: ({ row }) => String(row.original.email ?? "—") } as ColumnDef<RecordRow>,
                    ]
                  : [dateColumn]),
                moneyColumn("amount", amountLabel),
                statusColumn,
              ]}
              onRow={setSelected}
              mobileRow={(row) => mobileRow(row, directory ? String(row.phone ?? row.email ?? "—") : formatListDate(row.date))}
              canExport={canExport}
              exportRow={(row) => ({ [directory ? "Nom" : "Référence"]: row.label, ...(directory ? { Téléphone: String(row.phone ?? ""), Email: String(row.email ?? "") } : { Date: row.date }), [amountLabel]: row.amount ?? 0, Statut: row.status })}
              searchPlaceholder={directory ? "Nom, téléphone, email…" : "Référence, fournisseur, statut…"}
              emptyContent={
                all.length ? undefined : (
                  <EmptyState
                    kind="first-use"
                    title={c.empty}
                    description={c.emptyDescription}
                    actions={canCreate ? primary(c.action, c.actionLabel) : undefined}
                  />
                )
              }
              filtered={balanceOnly}
              onClearFilters={() => setBalanceOnly(false)}
              emptyTitle={directory ? c.empty : "Aucun achat sur cette période"}
              emptyDescription={directory ? undefined : "Élargissez la période pour retrouver l’historique."}
            />
          </ListCard>
        </>
      );
    } else content = <Alert error>Cette page n’existe pas.</Alert>;
  }
  return (
    <>
      {content}
      {action && (
        <ActionForm {...action} onClose={() => setAction(null)} />
      )}{" "}
      {selected && (
        <Modal title={selected.label} onClose={() => setSelected(null)} size="lg">
          <DialogBody>
            <dl className="review-list">
              {Object.entries(selected)
                .filter(
                  ([k]) =>
                    !["id", "storeId", "documentId"].includes(k) &&
                    (!["cost", "margin"].includes(k) || can("stock.cost.read")),
                )
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>
                      {{
                        label: "Libellé",
                        date: "Date",
                        status: "Statut",
                        amount: "Montant",
                        paid: "Payé",
                        quantity: "Quantité",
                        reason: "Motif",
                        phone: "Téléphone",
                        email: "Email",
                        actor: "Auteur",
                        sourceId: "Transaction source",
                        supplierId: "Fournisseur",
                        productId: "Produit",
                        clientId: "Client",
                        complement: "Complément",
                        difference: "Écart",
                        opening: "Ouverture",
                        counted: "Compté",
                        theoretical: "Théorique",
                      }[k] ?? k}
                    </dt>
                    <dd>
                      {[
                        "amount",
                        "paid",
                        "complement",
                        "difference",
                        "opening",
                        "counted",
                        "theoretical",
                      ].includes(k) ? (
                        <Money value={Number(v ?? 0)} />
                      ) : Array.isArray(v) ? (
                        v.join(", ")
                      ) : (
                        String(v ?? "—")
                      )}
                    </dd>
                  </div>
                ))}
            </dl>
            <DocumentLink documentId={selected.documentId} storeId={selected.storeId} />
            {path.startsWith("/suppliers") && (
              <DataTable
                name="achats-fournisseur"
                data={db.purchases.filter(
                  (p) =>
                    p.supplierId === selected.id &&
                    (storeId === "all" || p.storeId === storeId),
                )}
                getRowId={(row) => row.id}
                density="dense"
                enableColumnVisibility={false}
                columns={[
                  { accessorKey: "label", header: "Achat" },
                  moneyColumn("amount", "Total"),
                  { id: "paid", header: "Payé", meta: { align: "right" }, accessorFn: (row) => row.paid ?? 0, cell: ({ row }) => <Money value={row.original.paid ?? 0} /> },
                ]}
                onRow={setSelected}
                emptyKind="first-use"
                emptyTitle="Aucun achat chez ce fournisseur"
              />
            )}{" "}
            {path.startsWith("/clients") && (
              <DataTable
                name="achats-client"
                data={db.sales.filter(
                  (s) =>
                    s.clientId === selected.id &&
                    (storeId === "all" || s.storeId === storeId),
                )}
                getRowId={(row) => row.id}
                density="dense"
                enableColumnVisibility={false}
                columns={[
                  { accessorKey: "reference", header: "Vente" },
                  { id: "total", header: "Montant", meta: { align: "right" }, accessorFn: (row) => row.total, cell: ({ row }) => <Money value={row.original.total} /> },
                ]}
                onRow={(s) => {
                  setSelected(null);
                  router.push(href("/sales/" + s.id));
                }}
                emptyKind="first-use"
                emptyTitle="Aucun achat pour ce client"
              />
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Fermer
            </Button>
            {path.startsWith("/purchases") &&
              (selected.amount ?? 0) > (selected.paid ?? 0) &&
              can("finance.read") && (
                <Button
                  onClick={() => {
                    launch("payment.create", "Régler le fournisseur", {
                      sourceId: selected.id,
                      amount: (selected.amount ?? 0) - (selected.paid ?? 0),
                    });
                    setSelected(null);
                  }}
                >
                  Régler le solde
                </Button>
              )}
          </DialogFooter>
        </Modal>
      )}
    </>
  );
}
