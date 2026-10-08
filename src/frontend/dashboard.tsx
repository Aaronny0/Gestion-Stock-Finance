"use client";

import Link from "next/link";
import { useState } from "react";
import { ActionForm } from "./forms";
import {
  ArrowUpRight,
  Info,
  Plus,
  PackagePlus,
  PackageSearch,
} from "lucide-react";
import {
  DashboardAttention,
  type AttentionItem,
} from "@/features/dashboard/dashboard-attention";
import { DashboardPeriodFilter } from "@/features/dashboard/dashboard-period-filter";
import { DashboardRecentSales } from "@/features/dashboard/dashboard-recent-sales";
import { DashboardSetupChecklist } from "@/features/dashboard/dashboard-setup-checklist";
import { DashboardChart } from "@/features/dashboard/dashboard-chart";
import { DashboardCash } from "@/features/dashboard/dashboard-cash";
import { Money } from "@/components/data-display/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { indicators } from "./accounting";
import { salePosition } from "./operations";
import { useWorkspace } from "./provider";
import styles from "@/features/dashboard/dashboard.module.css";

export default function Dashboard() {
  const [stockEntry, setStockEntry] = useState(false);
  const { snapshot, storeId, start, end, href, can } = useWorkspace();
  const db = snapshot!.data;
  const currency = snapshot!.session.organization.currency;
  const firstName = snapshot!.session.user.name.split(" ")[0];
  const activeStore =
    storeId === "all"
      ? "Toutes les boutiques"
      : (snapshot!.session.stores.find((store) => store.id === storeId)?.name ??
        "Boutique");

  if (db.sales.length > 2000 && !snapshot!.reporting) {
    return (
      <Card className="border-warning/30 bg-warning-background">
        <CardContent className="flex gap-3 p-5 text-warning">
          <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <strong className="block text-sm font-semibold">
              Période trop volumineuse
            </strong>
            <p className="mb-0 mt-1 text-sm text-inherit">
              Ce rapport couvre trop d’opérations. Réduisez la période pour le
              consulter.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scope = (value: { storeId?: string; date: string }) =>
    (storeId === "all" || value.storeId === storeId) &&
    value.date.slice(0, 10) >= start &&
    value.date.slice(0, 10) <= end;

  const history = db.sales.filter(
    (sale) => storeId === "all" || sale.storeId === storeId,
  );
  const sales = history.filter(scope);
  const payments = db.payments.filter(scope);
  const entries = db.entries.filter(scope);
  const kpi =
    snapshot!.reporting?.kpis ??
    indicators(history, payments, entries, { start, end });

  const products = db.products.filter(
    (product) =>
      product.active && (storeId === "all" || product.storeId === storeId),
  );
  const lowStock = products.filter(
    (product) => product.quantity <= product.threshold,
  );
  const openCashCount = db.cash.filter(
    (cash) =>
      cash.status === "open" && (storeId === "all" || cash.storeId === storeId),
  ).length;
  const pendingInvitations = db.team.filter(
    (member) => member.status === "Invitation en attente",
  ).length;

  const days: { date: string; revenue: number; margin: number }[] = [];
  const cursor = new Date(start + "T12:00:00Z");
  for (
    let index = 0;
    !snapshot!.reporting &&
    cursor.toISOString().slice(0, 10) <= end &&
    index < 366;
    index++, cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const date = cursor.toISOString().slice(0, 10);
    const daily = indicators(history, [], [], { start: date, end: date });
    days.push({ date, revenue: daily.revenue, margin: daily.margin });
  }

  const setupSteps = [
    {
      label: "Organisation et boutiques",
      path: "/settings",
      done:
        !!snapshot!.session.organization.name &&
        snapshot!.session.stores.some((store) => store.active),
    },
    {
      label: "Catalogue et stock",
      path: "/stock",
      done: db.products.some(
        (product) =>
          product.active &&
          product.quantity > 0 &&
          (storeId === "all" || product.storeId === storeId),
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
      done: openCashCount > 0,
    },
  ];

  const periodHref = (path: string, from = start, to = end) =>
    `${href(path)}?${new URLSearchParams({ start: from, end: to })}`;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: snapshot!.session.organization.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const overdue = history.filter(
    (sale) =>
      sale.dueDate &&
      sale.dueDate.slice(0, 10) < today &&
      salePosition(sale).due > 0,
  );
  const attentionItems: AttentionItem[] = [
    ...(can("stock.read") && lowStock.length
      ? [
          {
            count: lowStock.length,
            label: "Références sous le seuil",
            description: "Le stock atteint ou approche le seuil d’alerte.",
            action: "Réapprovisionner",
            href: href("/stock") + "?low=1",
            tone: "warning" as const,
            icon: "stock" as const,
          },
        ]
      : []),
    ...(can("sales.read") && overdue.length
      ? [
          {
            count: overdue.length,
            label: "Crédits clients échus",
            description: "Des règlements attendus restent à encaisser.",
            action: "Consulter les crédits",
            href:
              periodHref(
                "/sales",
                overdue.map((sale) => sale.date.slice(0, 10)).sort()[0] ??
                  start,
                today,
              ) + "&status=credit",
            tone: "destructive" as const,
            icon: "credit" as const,
          },
        ]
      : []),
    ...((can("cash.open_close") || can("finance.read")) && openCashCount
      ? [
          {
            count: openCashCount,
            label:
              openCashCount > 1
                ? "Caisses encore ouvertes"
                : "Caisse encore ouverte",
            description: "À clôturer en fin de journée.",
            action: "Voir la caisse",
            href: periodHref("/cash"),
            tone: "info" as const,
            icon: "cash" as const,
          },
        ]
      : []),
    ...(can("team.manage") && pendingInvitations
      ? [
          {
            count: pendingInvitations,
            label: "Invitations en attente",
            description: "Des membres n’ont pas encore activé leur accès.",
            action: "Gérer les invitations",
            href: href("/team"),
            tone: "primary" as const,
            icon: "team" as const,
          },
        ]
      : []),
  ];
  const length =
    Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  const previousEnd = new Date(Date.parse(start) - 86400000)
    .toISOString()
    .slice(0, 10);
  const previousStart = new Date(Date.parse(start) - length * 86400000)
    .toISOString()
    .slice(0, 10);
  const previous = snapshot!.reporting
    ? null
    : indicators(history, [], [], { start: previousStart, end: previousEnd })
        .revenue;
  const variation =
    previous && previous > 0
      ? ((kpi.revenue - previous) / previous) * 100
      : null;
  const completed = setupSteps.filter((step) => step.done).length;
  const setup = can("settings.manage") ? (
    <DashboardSetupChecklist steps={setupSteps} href={href} />
  ) : null;
  const financial = [
    ...(can("finance.read")
      ? [
          {
            label: "Encaissements",
            value: kpi.incoming,
            sub: "Règlements reçus sur la période",
            path: "/payments",
          },
        ]
      : []),
    ...(can("cash.open_close") || can("finance.read")
      ? [
          {
            label: "Cashflow net",
            value: kpi.cashflow,
            sub: "Encaissements moins décaissements",
            path: "/cash",
          },
        ]
      : []),
    ...(can("analytics.cost_margin_read")
      ? [
          {
            label: "Marge brute",
            value: kpi.margin,
            sub: "Avant déduction des charges",
            path: "/analytics/margin",
          },
        ]
      : []),
  ];

  return (
    <div className={styles.dashboard} data-qa="dashboard">
      <header className={styles.header}>
        <div>
          <h1>Bonjour {firstName}</h1>
          <div className={styles.context}>
            <span>
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: snapshot!.session.organization.timezone,
              })}
            </span>
            <span aria-hidden="true">·</span>
            <span>{activeStore}</span>
            <DashboardPeriodFilter />
          </div>
        </div>
        <div className={styles.headerActions}>
          {can("stock.adjust") && (
            <Button variant="outline" onClick={() => setStockEntry(true)}>
              <PackagePlus size={16} />
              Entrée de stock
            </Button>
          )}
          {can("sales.create") && (
            <Button asChild>
              <Link href={href("/pos")}>
                <Plus size={16} />
                Nouvelle vente
              </Link>
            </Button>
          )}
        </div>
      </header>
      {completed < 2 && setup}
      <DashboardAttention items={attentionItems} />
      <section
        className={styles.performance}
        aria-label="Performance de la période"
      >
        <div className={styles.hero}>
          <div className={styles.heroLabel}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button">
                  Chiffre d’affaires <Info size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Le chiffre d’affaires n’est pas le bénéfice.
              </TooltipContent>
            </Tooltip>
            {can("sales.read") && (
              <Link
                href={periodHref("/sales")}
                aria-label="Consulter les ventes de la période"
              >
                <ArrowUpRight size={17} />
              </Link>
            )}
          </div>
          <Money
            value={kpi.revenue}
            currency={currency}
            className={styles.heroAmount}
            currencyClassName={styles.currency}
          />
          <div className={styles.heroMeta}>
            {variation !== null && (
              <span className={styles.variation} data-negative={variation < 0}>
                {variation >= 0 ? "+" : ""}
                {variation.toLocaleString("fr-FR", {
                  maximumFractionDigits: 1,
                })}{" "}
                %
              </span>
            )}
            <span>
              {variation !== null ? "vs période précédente · " : ""}
              {kpi.count} ventes · {kpi.units} unités
            </span>
          </div>
        </div>
        <div className={styles.metrics}>
          {financial.map((item) => (
            <Link key={item.path} href={periodHref(item.path)}>
              <span>
                {item.label}
                <ArrowUpRight size={14} />
              </span>
              <Money
                value={item.value}
                currency={currency}
                currencyClassName={styles.metricCurrency}
              />
              <small>{item.sub}</small>
            </Link>
          ))}
        </div>
      </section>
      <div className={styles.split}>
        <DashboardChart
          rows={snapshot!.reporting?.daily ?? days}
          currency={currency}
          showMargin={can("analytics.cost_margin_read")}
          salesHref={(date) => periodHref("/sales", date, date)}
          analyticsHref={
            can("analytics.read") ? periodHref("/analytics") : undefined
          }
        />
        {(can("cash.open_close") || can("finance.read")) && (
          <DashboardCash cashHref={periodHref("/cash")} />
        )}
      </div>
      <div className={styles.split}>
        {can("sales.read") && (
          <DashboardRecentSales
            sales={[...sales]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)}
            currency={currency}
            href={href}
            historyHref={periodHref("/sales")}
          />
        )}
        {can("stock.read") && (
          <section
            className={styles.card}
            aria-labelledby="critical-stock-title"
          >
            <div className={styles.cardHeading}>
              <h2 id="critical-stock-title">Stock critique</h2>
              <Link href={href("/stock") + "?low=1"}>Réapprovisionner</Link>
            </div>
            <div className={styles.stockList}>
              {lowStock
                .sort(
                  (a, b) =>
                    a.quantity / Math.max(1, a.threshold) -
                    b.quantity / Math.max(1, b.threshold),
                )
                .slice(0, 3)
                .map((product) => (
                  <Link
                    key={product.id}
                    href={href(`/products/${product.id}`)}
                    className={styles.stockItem}
                  >
                    <span>
                      <strong>
                        {product.brand} {product.model}
                      </strong>
                      <small>{product.variant}</small>
                    </span>
                    <span
                      data-critical={product.quantity <= product.threshold / 2}
                    >
                      <strong>{product.quantity}</strong> / seuil{" "}
                      {product.threshold}
                    </span>
                    <span className={styles.stockTrack}>
                      <i
                        data-critical={
                          product.quantity <= product.threshold / 2
                        }
                        style={{
                          width: `${Math.min(100, (product.quantity / Math.max(1, product.threshold * 2)) * 100)}%`,
                        }}
                      />
                    </span>
                  </Link>
                ))}
              {!lowStock.length && (
                <p className={styles.empty}>
                  <PackageSearch size={20} />
                  Aucune référence sous le seuil.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
      {completed >= 2 && setup}
      {stockEntry && (
        <ActionForm
          type="stock.entry"
          title="Nouvelle entrée"
          onClose={() => setStockEntry(false)}
        />
      )}
    </div>
  );
}
