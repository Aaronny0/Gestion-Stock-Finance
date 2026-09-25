"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus, ArrowRight, ArrowDownLeft, ArrowUpRight, Repeat2, ShoppingBag } from "lucide-react";
import { useWorkspace } from "./provider";
import { canonical } from "./navigation";
import { salePosition } from "./operations";
import { ActionForm } from "./forms";
import {
  Alert,
  Badge,
  DataTable,
  DateRangePicker,
  Modal,
  Money,
  PageHeading,
} from "./ui";
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
  const button = (type: string, title: string) => (
    <button className="button primary" onClick={() => launch(type, title)}>
      <Plus />
      {title}
    </button>
  );
  let content: React.ReactNode;
  if (path.startsWith("/trade") || path.startsWith("/buyback")) {
    const trade = path.startsWith("/trade");
    content = (
      <>
        <PageHeading
          eyebrow={trade ? "TROC & REPRISE" : "RACHAT CLIENT"}
          title={
            trade
              ? "Un échange, de nouvelles possibilités."
              : "Donnez une seconde vie aux appareils."
          }
          description={
            trade
              ? "Un téléphone entre, un autre sort. Le complément reste clairement identifié."
              : "Un appareil rejoint votre stock et son règlement est suivi en trésorerie."
          }
          action={button(
            trade ? "trade.create" : "buyback.create",
            trade ? "Nouveau troc" : "Nouveau rachat",
          )}
        />
        <div className="trade-flow">
          <div>
            <span className="flow-icon green">
              <ArrowDownLeft />
            </span>
            <h3>Appareil du client</h3>
            <p>
              Marque, modèle, état et valeur de reprise.
              <br />
              IMEI facultatif.
            </p>
          </div>
          <ArrowRight />
          <div>
            <span className="flow-icon violet">
              {trade ? <Repeat2 /> : <ShoppingBag />}
            </span>
            <h3>{trade ? "Appareil de la boutique" : "Règlement au client"}</h3>
            <p>
              {trade
                ? "Sélection depuis le stock disponible."
                : "Espèces, Mobile Money ou virement."}
            </p>
          </div>
          <ArrowRight />
          <div>
            <span className="flow-icon blue">
              <ArrowUpRight />
            </span>
            <h3>{trade ? "Complément encaissé" : "Entrée en stock"}</h3>
            <p>
              {trade
                ? "Prix boutique moins valeur de reprise."
                : "Le rachat ne crée aucun chiffre d’affaires."}
            </p>
          </div>
        </div>
        <div className="overview-toolbar">
          <h2>{trade ? "Historique des trocs" : "Historique des rachats"}</h2>
          <DateRangePicker />
        </div>
        <DataTable
          name={trade ? "trocs" : "rachats"}
          rows={(trade ? db.trades : db.buybacks).filter(scope)}
          columns={[
            { key: "date", label: "Date" },
            { key: "label", label: "Appareil repris" },
            {
              key: "amount",
              label: "Valeur de reprise",
              render: (r) => <Money value={r.amount ?? 0} />,
            },
            ...(trade
              ? [
                  {
                    key: "complement",
                    label: "Complément",
                    render: (r: RecordRow) => (
                      <Money value={Number(r.complement ?? 0)} />
                    ),
                  },
                ]
              : []),
            {
              key: "status",
              label: "Statut",
              render: (r) => <Badge value={r.status} />,
            },
          ]}
          onRow={setSelected}
        />
      </>
    );
  } else {
    const key = path.split("/")[1];
    const config: Record<
      string,
      {
        title: string;
        description: string;
        collection:
          | "purchases"
          | "suppliers"
          | "clients";
        action?: string;
        actionLabel?: string;
      }
    > = {
      purchases: {
        title: "Vos achats, bien suivis.",
        description:
          "Réceptions de marchandises, factures et dettes fournisseurs.",
        collection: "purchases",
        action: "purchase.create",
        actionLabel: "Nouvel achat",
      },
      suppliers: {
        title: "Des partenaires de confiance.",
        description: "Coordonnées, achats et soldes de vos fournisseurs.",
        collection: "suppliers",
        action: "supplier.save",
        actionLabel: "Nouveau fournisseur",
      },
      clients: {
        title: "Vos clients, au cœur de l’activité.",
        description:
          "Retrouvez les coordonnées, les achats et les montants dus.",
        collection: "clients",
        action: "client.save",
        actionLabel: "Nouveau client",
      },
    };
    const c = config[key];
    if (c) {
      const rows = db[c.collection]
        .filter((r) => ["clients", "suppliers"].includes(key) || scope(r))
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
      content = (
        <>
          <PageHeading
            title={c.title}
            description={c.description}
            action={
              c.action &&
              (key !== "clients" || can("sales.create")) &&
              button(c.action, c.actionLabel!)
            }
          />
          {!["suppliers", "clients"].includes(key) && <DateRangePicker />}
          <DataTable
            name={key}
            rows={rows}
            columns={[
              {
                key: "label",
                label: "Nom / référence",
              },
              ...(["suppliers", "clients"].includes(key)
                ? [
                    { key: "phone", label: "Téléphone" },
                    { key: "email", label: "Email" },
                  ]
                : [{ key: "date", label: "Date" }]),
              {
                key: "amount",
                label: ["suppliers", "clients"].includes(key) ? "Solde dû" : "Montant",
                render: (r: RecordRow) => <Money value={r.amount ?? 0} />,
              },
              {
                key: "status",
                label: "Statut",
                render: (r: RecordRow) => <Badge value={r.status} />,
              },
            ]}
            onRow={setSelected}
          />
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
        <Modal title={selected.label} onClose={() => setSelected(null)}>
          <div className="modal-body">
            <dl className="review-list">
              {Object.entries(selected)
                .filter(
                  ([k]) =>
                    !["id", "storeId"].includes(k) &&
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
            {path.startsWith("/suppliers") && (
              <DataTable
                name="achats-fournisseur"
                rows={db.purchases.filter(
                  (p) =>
                    p.supplierId === selected.id &&
                    (storeId === "all" || p.storeId === storeId),
                )}
                columns={[
                  { key: "label", label: "Achat" },
                  {
                    key: "amount",
                    label: "Total",
                    render: (r) => <Money value={r.amount ?? 0} />,
                  },
                  {
                    key: "paid",
                    label: "Payé",
                    render: (r) => <Money value={r.paid ?? 0} />,
                  },
                ]}
                onRow={setSelected}
              />
            )}{" "}
            {path.startsWith("/clients") && (
              <DataTable
                name="achats-client"
                rows={db.sales.filter(
                  (s) =>
                    s.clientId === selected.id &&
                    (storeId === "all" || s.storeId === storeId),
                )}
                columns={[
                  { key: "reference", label: "Vente" },
                  {
                    key: "total",
                    label: "Montant",
                    render: (s) => <Money value={s.total} />,
                  },
                ]}
                onRow={(s) => {
                  setSelected(null);
                  router.push(href("/sales/" + s.id));
                }}
              />
            )}
          </div>
          <div className="modal-foot">
            {path.startsWith("/purchases") &&
              (selected.amount ?? 0) > (selected.paid ?? 0) &&
              can("finance.read") && (
                <button
                  className="button primary"
                  onClick={() => {
                    launch("payment.create", "Régler le fournisseur", {
                      sourceId: selected.id,
                      amount: (selected.amount ?? 0) - (selected.paid ?? 0),
                    });
                    setSelected(null);
                  }}
                >
                  Régler le solde
                </button>
              )}
            <button
              className="button secondary"
              onClick={() => setSelected(null)}
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
