"use client";
import { salePosition, netLineValue, returnedQuantity } from "./operations";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowUpRight,
  FiArrowRight,
  FiPlus,
  FiShoppingBag,
  FiDollarSign,
  FiTrendingUp,
  FiActivity,
  FiPackage,
  FiInfo,
} from "react-icons/fi";
import { useWorkspace } from "./provider";
import { indicators } from "./accounting";
import {
  Alert,
  Badge,
  DateRangePicker,
  Money,
  PageHeading,
  DataTable,
} from "./ui";
const RevenueChart = dynamic(
  () => import("./charts").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <div className="chart-area skeleton" /> },
);
export default function Dashboard() {
  const { snapshot, storeId, start, end, href, can, setDates } = useWorkspace(),
    router = useRouter();
  const db = snapshot!.data;
  if (db.sales.length > 2000 && !snapshot!.reporting)
    return (
      <Alert>
        Ce rapport couvre trop d’opérations. Réduisez la période pour le
        consulter.
      </Alert>
    );
  const scope = (v: { storeId?: string; date: string }) =>
    (storeId === "all" || v.storeId === storeId) &&
    v.date.slice(0, 10) >= start &&
    v.date.slice(0, 10) <= end;
  const sales = db.sales.filter(scope),
    payments = db.payments.filter(scope),
    entries = db.entries.filter(scope),
    kpi = snapshot!.reporting?.kpis ?? indicators(sales, payments, entries);
  const products = db.products.filter(
    (p) => p.active && (storeId === "all" || p.storeId === storeId),
  );
  const low = products.filter((p) => p.quantity <= p.threshold);
  const days = [];
  const d = new Date(start + "T12:00:00Z");
  for (
    let i = 0;
    !snapshot!.reporting && d.toISOString().slice(0, 10) <= end && i < 366;
    i++, d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const date = d.toISOString().slice(0, 10);
    const k = indicators(
      sales.filter((s) => s.date.slice(0, 10) === date),
      [],
      [],
    );
    days.push({ date, revenue: k.revenue, margin: k.margin });
  }
  const cards = [
    {
      label: "Chiffre d’affaires",
      value: kpi.revenue,
      definition:
        "Ventes reconnues sur la période, distinctes des sommes encaissées.",
      icon: FiShoppingBag,
      color: "violet",
      link: "/sales",
      sub: `${kpi.count} ventes · ${kpi.units} unités`,
    },
    {
      label: "Encaissements",
      value: kpi.incoming,
      definition: "Paiements effectivement reçus sur la période.",
      icon: FiDollarSign,
      color: "blue",
      link: "/payments",
      sub: "Tous modes de paiement",
    },
    {
      label: "Marge brute",
      value: kpi.margin,
      definition: "Chiffre d’affaires moins coût des marchandises vendues.",
      icon: FiTrendingUp,
      color: "green",
      link: "/analytics/margin",
      sub: "Avant les charges d’exploitation",
      sensitive: true,
    },
    {
      label: "Cashflow net",
      value: kpi.cashflow,
      definition: "Encaissements moins décaissements sur la période.",
      icon: FiActivity,
      color: "amber",
      link: "/cash",
      sub: "Flux nets de trésorerie",
    },
  ];
  const modes =
    snapshot!.reporting?.paymentBreakdown ??
    Object.entries(
      payments
        .filter((p) => p.direction === "in")
        .reduce<
          Record<string, number>
        >((a, p) => ({ ...a, [p.method]: (a[p.method] ?? 0) + p.amount }), {}),
    );
  const top =
    snapshot!.reporting?.topProducts ??
    Object.values(
      sales
        .filter((s) => s.status !== "refunded")
        .flatMap((s) =>
          s.lines.map((l, i) => ({
            ...l,
            quantity: l.quantity - returnedQuantity(s, i),
            net: netLineValue(s, i),
          })),
        )
        .reduce<
          Record<string, { label: string; quantity: number; amount: number }>
        >((a, l) => {
          a[l.productId] ??= { label: l.label, quantity: 0, amount: 0 };
          a[l.productId].quantity += l.quantity;
          a[l.productId].amount += l.net;
          return a;
        }, {}),
    )
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  return (
    <>
      <PageHeading
        eyebrow="VOTRE ACTIVITÉ EN UN COUP D’ŒIL"
        title="Gardez une longueur d’avance."
        description={`Bienvenue, ${snapshot!.session.user.name.split(" ")[0]}. Voici où en est votre activité.`}
        action={
          can("sales.create") && (
            <Link className="button primary" href={href("/pos")}>
              <FiPlus />
              Nouvelle vente
            </Link>
          )
        }
      />
      {can("settings.manage") && (
        <details className="panel">
          <summary>Vérifier la mise en route de la boutique</summary>
          <div className="checklist">
            {[
              {
                label: "Organisation et boutiques",
                path: "/settings",
                done:
                  !!snapshot!.session.organization.name &&
                  snapshot!.session.stores.some((s) => s.active),
              },
              {
                label: "Catalogue et stock",
                path: "/stock",
                done: db.products.some(
                  (p) =>
                    p.active &&
                    p.quantity > 0 &&
                    (storeId === "all" || p.storeId === storeId),
                ),
              },
              {
                label: "Équipe et accès",
                path: "/team",
                done: db.team.length > 1,
              },
              {
                label: "Ouvrir la caisse",
                path: "/cash",
                done: db.cash.some(
                  (c) =>
                    c.status === "open" &&
                    (storeId === "all" || c.storeId === storeId),
                ),
              },
            ].map((step) => (
              <Link key={step.path} href={href(step.path)}>
                <Badge value={step.done ? "Validée" : "À vérifier"} />{" "}
                {step.label}
              </Link>
            ))}
          </div>
        </details>
      )}
      <div className="overview-toolbar">
        <div className="section-title">
          <span className="status-dot" />
          Vue d’ensemble{" "}
          <span className="muted">
            {storeId === "all"
              ? "Toutes les boutiques"
              : snapshot!.session.stores.find((s) => s.id === storeId)?.name}
          </span>
        </div>
        <DateRangePicker />
      </div>
      <div className="kpi-grid">
        {cards
          .filter((c) => !c.sensitive || can("analytics.cost_margin_read"))
          .map((c) => (
            <Link
              className="kpi-card"
              key={c.label}
              href={href(c.link) + `?start=${start}&end=${end}`}
            >
              <div className="kpi-top">
                <span className={`kpi-icon ${c.color}`}>
                  <c.icon />
                </span>
                <span
                  title={c.definition}
                  aria-label={c.definition}
                  tabIndex={0}
                >
                  <FiInfo />
                </span>
              </div>
              <div className="kpi-label">{c.label}</div>
              <div className="kpi-value">
                <Money value={c.value} />
              </div>
              <div className="kpi-bottom">
                <span>{c.sub}</span>
                <FiArrowUpRight />
              </div>
            </Link>
          ))}
      </div>
      <div className="dashboard-middle">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Une activité qui se dessine</h2>
              <p>
                Chiffre d’affaires
                {can("analytics.cost_margin_read")
                  ? " & marge brute"
                  : ""} · {snapshot!.session.organization.currency}
              </p>
            </div>
            <div className="segmented">
              {[7, 30].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - n + 1);
                    setDates(
                      d.toISOString().slice(0, 10),
                      new Date().toISOString().slice(0, 10),
                    );
                  }}
                >
                  {n} jours
                </button>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <span>
              <i />
              Chiffre d’affaires
            </span>
            {can("analytics.cost_margin_read") && (
              <span>
                <i className="teal" />
                Marge brute
              </span>
            )}
          </div>
          <RevenueChart
            rows={snapshot!.reporting?.daily ?? days}
            currency={snapshot!.session.organization.currency}
            margin={can("analytics.cost_margin_read")}
            onSelect={(date) =>
              router.push(href("/sales") + `?start=${date}&end=${date}`)
            }
          />
        </section>
        <section className="panel attention-panel">
          <div className="panel-heading">
            <div>
              <h2>À garder à l’œil</h2>
              <p>Les points qui méritent votre attention</p>
            </div>
            <span className="alert-count">
              {low.length +
                (db.cash.some(
                  (c) =>
                    c.status === "open" &&
                    (storeId === "all" || c.storeId === storeId),
                )
                  ? 1
                  : 0)}
            </span>
          </div>
          <Link className="attention-item" href={href("/stock") + "?low=1"}>
            <span className="attention-icon amber">
              <FiPackage />
            </span>
            <div>
              <strong>{low.length} références à réapprovisionner</strong>
              <small>Le stock approche du seuil d’alerte.</small>
            </div>
            <FiArrowRight />
          </Link>
          <Link className="attention-item" href={href("/cash")}>
            <span className="attention-icon blue">
              <FiDollarSign />
            </span>
            <div>
              <strong>
                {
                  db.cash.filter(
                    (c) =>
                      c.status === "open" &&
                      (storeId === "all" || c.storeId === storeId),
                  ).length
                }{" "}
                caisse(s) ouverte(s)
              </strong>
              <small>Pensez à la clôture de fin de journée.</small>
            </div>
            <FiArrowRight />
          </Link>
          {can("team.manage") && (
            <Link className="attention-item" href={href("/team")}>
              <span className="attention-icon violet">
                <FiShoppingBag />
              </span>
              <div>
                <strong>
                  {
                    db.team.filter((m) => m.status === "Invitation en attente")
                      .length
                  }{" "}
                  invitation(s) en attente
                </strong>
                <small>Votre équipe se met en place.</small>
              </div>
              <FiArrowRight />
            </Link>
          )}
          <div className="insight-note">
            <FiInfo />
            <p>
              Le chiffre d’affaires n’est pas le bénéfice. Vos charges sont
              disponibles dans la comptabilité.
            </p>
          </div>
        </section>
      </div>
      <div className="dashboard-lower">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Vos meilleures ventes</h2>
              <p>Les produits qui font la différence</p>
            </div>
            <Link className="text-button" href={href("/analytics/sales")}>
              Tout voir <FiArrowUpRight />
            </Link>
          </div>
          <div className="top-products">
            {(snapshot!.reporting?.topProducts ?? top).map((p, i) => (
              <Link
                href={
                  href("/sales") + `?product=${encodeURIComponent(p.label)}`
                }
                key={p.label}
              >
                <span className="rank">0{i + 1}</span>
                <span className="mini-product">
                  <FiPackage />
                </span>
                <span>
                  <strong>{p.label}</strong>
                  <small>{p.quantity} unités vendues</small>
                </span>
                <Money value={p.amount} />
              </Link>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Comment vos clients paient</h2>
              <p>Répartition des encaissements</p>
            </div>
          </div>
          <div className="payment-total">
            <Money value={kpi.incoming} />
            <small>encaissés sur la période</small>
          </div>
          <div className="payment-bar">
            {(snapshot!.reporting?.paymentBreakdown ?? modes).map(
              ([method, value], i) => (
                <span
                  key={method}
                  style={{
                    width: `${kpi.incoming ? (value / kpi.incoming) * 100 : 0}%`,
                    background: ["#7968e6", "#42b6a1", "#86a5e7", "#e8b764"][
                      i % 4
                    ],
                  }}
                />
              ),
            )}
          </div>
          <div className="payment-modes">
            {(snapshot!.reporting?.paymentBreakdown ?? modes).map(
              ([method, value], i) => (
                <Link
                  href={
                    href("/payments") + `?method=${encodeURIComponent(method)}`
                  }
                  key={method}
                >
                  <i
                    style={{
                      background: ["#7968e6", "#42b6a1", "#86a5e7", "#e8b764"][
                        i % 4
                      ],
                    }}
                  />
                  <span>{method}</span>
                  <strong>
                    {kpi.incoming
                      ? Math.round((value / kpi.incoming) * 100)
                      : 0}{" "}
                    %
                  </strong>
                  <Money value={value} />
                </Link>
              ),
            )}
          </div>
        </section>
      </div>
      <div className="panel-heading recent-title">
        <div>
          <h2>Les dernières ventes</h2>
          <p>Chaque transaction, à portée de main</p>
        </div>
        <Link className="text-button" href={href("/sales")}>
          Voir l’historique <FiArrowRight />
        </Link>
      </div>
      <DataTable
        name="ventes-récentes"
        rows={sales.slice(0, 5)}
        columns={[
          {
            key: "reference",
            label: "Référence",
            render: (s) => <strong>{s.reference}</strong>,
          },
          {
            key: "date",
            label: "Date",
            render: (s) => new Date(s.date).toLocaleDateString("fr-FR"),
          },
          { key: "seller", label: "Vendeur" },
          {
            key: "total",
            label: "Montant",
            render: (s) => <Money value={salePosition(s).netTotal} />,
          },
          {
            key: "status",
            label: "Statut",
            render: (s) => <Badge value={s.status} />,
          },
        ]}
        onRow={(s) => router.push(href("/sales/" + s.id))}
      />
      <div className="compact-metrics">
        <span>
          Décaissements{" "}
          <strong>
            <Money value={kpi.outgoing} />
          </strong>
        </span>
        {can("accounting.read") && (
          <span>
            Résultat comptable de la période{" "}
            <strong>
              <Money value={kpi.result} />
            </strong>
          </span>
        )}
        <span>
          Troc / rachat{" "}
          <strong>
            {db.trades.filter(scope).length} /{" "}
            {db.buybacks.filter(scope).length}
          </strong>
        </span>
      </div>
    </>
  );
}
