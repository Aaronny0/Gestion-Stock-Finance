"use client";
import { salePosition, netLineValue } from "./operations";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FiArrowUpRight } from "react-icons/fi";
import { useWorkspace } from "./provider";
import { indicators } from "./accounting";
import { DataTable, DateRangePicker, Money, PageHeading, Alert } from "./ui";
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
  if (db.sales.length > 2000)
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
      scoped(s) &&
      (!brand || s.lines.some((l) => l.brand === brand)) &&
      (!seller || s.seller === seller) &&
      (!method ||
        db.payments.some((p) => p.sourceId === s.id && p.method === method)),
  );
  const kpi = indicators(
    sales,
    db.payments.filter(scoped),
    db.entries.filter(scoped),
  );
  const rank = Object.entries(
    sales
      .filter((s) => s.status !== "refunded")
      .reduce<Record<string, number>>((a, s) => {
        for (const [index, l] of s.lines.entries()) {
          const key = tab === "team" ? s.seller : l.brand;
          a[key] = (a[key] ?? 0) + netLineValue(s, index);
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
  return (
    <>
      <PageHeading
        eyebrow="ANALYSES & RAPPORTS"
        title="Transformez vos chiffres en décisions."
        description="Explorez les tendances et retrouvez les opérations derrière chaque indicateur."
      />
      <div className="tabs page-tabs">
        {tabs.map(([key, label]) => (
          <Link
            href={href("/analytics/" + key)}
            key={key}
            className={tab === key ? "active" : ""}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="overview-toolbar">
        <div className="table-filters">
          <select
            aria-label="Filtre BI marque"
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              updateFilter("brand", e.target.value);
            }}
          >
            <option value="">Toutes les marques</option>
            {[...new Set(db.products.map((p) => p.brand))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            aria-label="Filtre BI vendeur"
            value={seller}
            onChange={(e) => {
              setSeller(e.target.value);
              updateFilter("seller", e.target.value);
            }}
          >
            <option value="">Tous les vendeurs</option>
            {[...new Set(db.sales.map((p) => p.seller))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            aria-label="Filtre BI paiement"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              updateFilter("method", e.target.value);
            }}
          >
            <option value="">Tous les paiements</option>
            {[...new Set(db.payments.map((p) => p.method))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        <DateRangePicker />
      </div>
      <div className="compact-metrics">
        <span>
          CA{" "}
          <strong>
            <Money value={kpi.revenue} />
          </strong>
        </span>
        {can("analytics.cost_margin_read") && (
          <span>
            Marge brute{" "}
            <strong>
              <Money value={kpi.margin} />
            </strong>
          </span>
        )}
        <span>
          Panier moyen{" "}
          <strong>
            <Money value={kpi.average} />
          </strong>
        </span>
        <span>
          Ventes <strong>{kpi.count}</strong>
        </span>
      </div>
      {["executive", "sales", "margin", "team"].includes(tab) && (
        <>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>
                  {tab === "team"
                    ? "Chiffre d’affaires par vendeur"
                    : "Chiffre d’affaires par marque"}
                </h2>
                <p>
                  {start} → {end} · {snapshot!.session.organization.currency} ·{" "}
                  {brand || "Toutes marques"} · {seller || "Tous vendeurs"}
                </p>
              </div>
            </div>
            <RankingChart
              rows={rank}
              currency={snapshot!.session.organization.currency}
              onSelect={(label) =>
                router.push(
                  href("/sales") +
                    `?${tab === "team" ? "seller" : "brand"}=${encodeURIComponent(label)}&start=${start}&end=${end}`,
                )
              }
            />
          </section>
          <DataTable
            name="ventes-analyse"
            rows={sales}
            columns={[
              { key: "reference", label: "Référence" },
              { key: "date", label: "Date" },
              { key: "seller", label: "Vendeur" },
              {
                key: "total",
                label: "CA",
                render: (s) => <Money value={salePosition(s).netTotal} />,
              },
              ...(can("analytics.cost_margin_read")
                ? [
                    {
                      key: "margin",
                      label: "Marge",
                      value: (s: (typeof sales)[number]) =>
                        salePosition(s).netTotal - salePosition(s).netCost,
                      render: (s: (typeof sales)[number]) => (
                        <Money
                          value={
                            salePosition(s).netTotal - salePosition(s).netCost
                          }
                        />
                      ),
                    },
                  ]
                : []),
            ]}
            onRow={(s) => router.push(href("/sales/" + s.id))}
          />
        </>
      )}
      {tab === "stock" && (
        <DataTable
          name="stock-analyse"
          rows={db.products
            .filter(
              (p) =>
                (storeId === "all" || p.storeId === storeId) &&
                (!brand || p.brand === brand),
            )
            .map((p) => {
              const sold = sales
                .flatMap((s) => s.lines)
                .filter((l) => l.productId === p.id)
                .reduce((s, l) => s + l.quantity, 0);
              const days = Math.max(
                1,
                (new Date(end).getTime() - new Date(start).getTime()) /
                  86400000 +
                  1,
              );
              return {
                ...p,
                sold,
                coverage: sold ? Math.round(p.quantity / (sold / days)) : null,
                dormant: !sold,
              };
            })}
          columns={[
            { key: "model", label: "Produit" },
            { key: "quantity", label: "Stock" },
            { key: "sold", label: "Unités vendues" },
            {
              key: "coverage",
              label: "Couverture (jours)",
              render: (p) => p.coverage ?? "Aucune vente",
            },
            {
              key: "dormant",
              label: "Dormant sur la période",
              render: (p) => (p.dormant ? "Oui" : "Non"),
            },
            ...(can("analytics.cost_margin_read")
              ? [
                  {
                    key: "value",
                    label: "Valeur immobilisée",
                    render: (p: (typeof db.products)[number]) => (
                      <Money value={p.quantity * (p.cost ?? 0)} />
                    ),
                  },
                ]
              : []),
          ]}
          onRow={(p) => router.push(href("/products/" + p.id))}
        />
      )}
      {tab === "clients" && (
        <DataTable
          name="clients-analyse"
          rows={db.clients.map((c) => ({
            ...c,
            count: sales.filter((s) => s.clientId === c.id).length,
            total: sales
              .filter((s) => s.clientId === c.id)
              .reduce((n, s) => n + salePosition(s).netTotal, 0),
            due: db.sales
              .filter(
                (s) =>
                  s.clientId === c.id &&
                  salePosition(s).due > 0 &&
                  (storeId === "all" || s.storeId === storeId),
              )
              .reduce((n, s) => n + salePosition(s).due, 0),
          }))}
          columns={[
            { key: "label", label: "Client" },
            { key: "count", label: "Achats sur la période" },
            {
              key: "total",
              label: "Chiffre d’affaires",
              render: (c) => <Money value={c.total} />,
            },
            {
              key: "due",
              label: "Reste dû",
              render: (c) => <Money value={c.due} />,
            },
          ]}
          onRow={(c) => router.push(href("/clients/" + c.id))}
        />
      )}
      {tab === "cash" && (
        <DataTable
          name="flux-trésorerie"
          rows={db.payments.filter(scoped)}
          columns={[
            { key: "date", label: "Date" },
            { key: "label", label: "Source" },
            { key: "method", label: "Mode" },
            {
              key: "direction",
              label: "Sens",
              render: (p) => (p.direction === "in" ? "Entrée" : "Sortie"),
            },
            {
              key: "amount",
              label: "Montant",
              render: (p) => <Money value={p.amount} />,
            },
          ]}
        />
      )}
      {tab === "accounting" && (
        <>
          <div className="compact-metrics">
            <span>
              Résultat{" "}
              <strong>
                <Money value={kpi.result} />
              </strong>
            </span>
            <span>
              Cashflow{" "}
              <strong>
                <Money value={kpi.cashflow} />
              </strong>
            </span>
          </div>
          <Link
            className="button primary"
            href={href("/accounting/statements")}
          >
            Ouvrir les états financiers <FiArrowUpRight />
          </Link>
        </>
      )}
      {tab === "trade" && (
        <DataTable
          name="analyse-reprises"
          rows={[
            ...db.trades.filter(scoped).map((r) => ({
              ...r,
              type: "Troc",
              complement: Number(r.complement ?? 0),
            })),
            ...db.buybacks
              .filter(scoped)
              .map((r) => ({ ...r, type: "Rachat", complement: 0 })),
          ]}
          columns={[
            { key: "date", label: "Date" },
            { key: "type", label: "Type" },
            { key: "label", label: "Appareil" },
            {
              key: "amount",
              label: "Valeur de reprise",
              render: (r) => <Money value={r.amount ?? 0} />,
            },
            {
              key: "complement",
              label: "Complément",
              render: (r) => <Money value={Number(r.complement ?? 0)} />,
            },
          ]}
        />
      )}
      <p className="report-footnote">
        Source : opérations autorisées de la boutique et de la période
        sélectionnées. Les comparaisons nécessitent les données des périodes
        précédentes.
      </p>
    </>
  );
}
