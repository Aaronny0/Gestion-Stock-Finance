"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CircleDollarSign,
  Info,
  Plus,
  ShoppingBag,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { DashboardAttention } from "@/features/dashboard/dashboard-attention";
import { DashboardPaymentBreakdown } from "@/features/dashboard/dashboard-payment-breakdown";
import { DashboardPeriodFilter } from "@/features/dashboard/dashboard-period-filter";
import { DashboardRecentSales } from "@/features/dashboard/dashboard-recent-sales";
import { DashboardSetupChecklist } from "@/features/dashboard/dashboard-setup-checklist";
import { DashboardTopProducts } from "@/features/dashboard/dashboard-top-products";
import { MetricCard } from "@/components/data-display/metric-card";
import { Money } from "@/components/data-display/money";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { indicators } from "./accounting";
import { netLineValue, returnedQuantity } from "./operations";
import { useWorkspace } from "./provider";

const RevenueChart = dynamic(
  () => import("./charts").then((module) => module.RevenueChart),
  {
    ssr: false,
    loading: () => <div className="h-72 animate-pulse rounded-md bg-muted" />,
  },
);

export default function Dashboard() {
  const { snapshot, storeId, start, end, href, can, setDates } = useWorkspace();
  const router = useRouter();
  const db = snapshot!.data;
  const currency = snapshot!.session.organization.currency;
  const firstName = snapshot!.session.user.name.split(" ")[0];
  const activeStore =
    storeId === "all"
      ? "Toutes les boutiques"
      : snapshot!.session.stores.find((store) => store.id === storeId)?.name ?? "Boutique";

  if (db.sales.length > 2000 && !snapshot!.reporting) {
    return (
      <Card className="border-warning/30 bg-warning-background">
        <CardContent className="flex gap-3 p-5 text-warning">
          <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <strong className="block text-sm font-semibold">Période trop volumineuse</strong>
            <p className="mb-0 mt-1 text-sm text-inherit">
              Ce rapport couvre trop d’opérations. Réduisez la période pour le consulter.
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

  const sales = db.sales.filter(scope);
  const payments = db.payments.filter(scope);
  const entries = db.entries.filter(scope);
  const kpi = snapshot!.reporting?.kpis ?? indicators(sales, payments, entries);

  const products = db.products.filter(
    (product) => product.active && (storeId === "all" || product.storeId === storeId),
  );
  const lowStock = products.filter((product) => product.quantity <= product.threshold);
  const openCashCount = db.cash.filter(
    (cash) => cash.status === "open" && (storeId === "all" || cash.storeId === storeId),
  ).length;
  const pendingInvitations = db.team.filter(
    (member) => member.status === "Invitation en attente",
  ).length;

  const days: { date: string; revenue: number; margin: number }[] = [];
  const cursor = new Date(start + "T12:00:00Z");
  for (
    let index = 0;
    !snapshot!.reporting && cursor.toISOString().slice(0, 10) <= end && index < 366;
    index++, cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const date = cursor.toISOString().slice(0, 10);
    const daily = indicators(
      sales.filter((sale) => sale.date.slice(0, 10) === date),
      [],
      [],
    );
    days.push({ date, revenue: daily.revenue, margin: daily.margin });
  }

  const paymentBreakdown =
    snapshot!.reporting?.paymentBreakdown ??
    Object.entries(
      payments
        .filter((payment) => payment.direction === "in")
        .reduce<Record<string, number>>(
          (accumulator, payment) => ({
            ...accumulator,
            [payment.method]: (accumulator[payment.method] ?? 0) + payment.amount,
          }),
          {},
        ),
    );

  const topProducts =
    snapshot!.reporting?.topProducts ??
    Object.values(
      sales
        .filter((sale) => sale.status !== "refunded")
        .flatMap((sale) =>
          sale.lines.map((line, index) => ({
            ...line,
            quantity: line.quantity - returnedQuantity(sale, index),
            net: netLineValue(sale, index),
          })),
        )
        .reduce<Record<string, { label: string; quantity: number; amount: number }>>(
          (accumulator, line) => {
            accumulator[line.productId] ??= {
              label: line.label,
              quantity: 0,
              amount: 0,
            };
            accumulator[line.productId].quantity += line.quantity;
            accumulator[line.productId].amount += line.net;
            return accumulator;
          },
          {},
        ),
    )
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 4);

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

  const attentionItems = [
    ...(lowStock.length
      ? [
          {
            label: `${lowStock.length} référence${lowStock.length > 1 ? "s" : ""} à réapprovisionner`,
            description: "Le stock atteint ou approche le seuil d’alerte.",
            href: href("/stock") + "?low=1",
            tone: "warning" as const,
            icon: "stock" as const,
          },
        ]
      : []),
    ...(openCashCount
      ? [
          {
            label: `${openCashCount} caisse${openCashCount > 1 ? "s" : ""} ouverte${openCashCount > 1 ? "s" : ""}`,
            description: "Pensez à la clôture de fin de journée.",
            href: href("/cash"),
            tone: "info" as const,
            icon: "cash" as const,
          },
        ]
      : []),
    ...(can("team.manage") && pendingInvitations
      ? [
          {
            label: `${pendingInvitations} invitation${pendingInvitations > 1 ? "s" : ""} en attente`,
            description: "Des membres n’ont pas encore activé leur accès.",
            href: href("/team"),
            tone: "primary" as const,
            icon: "team" as const,
          },
        ]
      : []),
  ];

  const metrics = [
    {
      label: "Chiffre d’affaires",
      value: kpi.revenue,
      definition: "Ventes reconnues sur la période, distinctes des sommes encaissées.",
      icon: ShoppingBag,
      href: "/sales",
      comparison: `${kpi.count} ventes · ${kpi.units} unités`,
      sensitive: false,
    },
    {
      label: "Encaissements",
      value: kpi.incoming,
      definition: "Paiements effectivement reçus sur la période.",
      icon: CircleDollarSign,
      href: "/payments",
      comparison: "Tous modes de paiement",
      sensitive: false,
    },
    {
      label: "Marge brute",
      value: kpi.margin,
      definition: "Chiffre d’affaires moins coût des marchandises vendues.",
      icon: TrendingUp,
      href: "/analytics/margin",
      comparison: "Avant charges d’exploitation",
      sensitive: true,
    },
    {
      label: "Cashflow net",
      value: kpi.cashflow,
      definition: "Encaissements moins décaissements sur la période.",
      icon: WalletCards,
      href: "/cash",
      comparison: "Flux nets de trésorerie",
      sensitive: false,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vue d’ensemble"
        title={`Bonjour ${firstName},`}
        description="voici les indicateurs et points d’attention de votre activité."
        actions={
          can("sales.create") ? (
            <Button asChild>
              <Link href={href("/pos")}>
                <Plus className="size-4" aria-hidden="true" />
                Nouvelle vente
              </Link>
            </Button>
          ) : undefined
        }
      />

      {can("settings.manage") ? <DashboardSetupChecklist steps={setupSteps} href={href} /> : null}

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            Activité · {activeStore}
          </div>
          <p className="mb-0 mt-1 text-xs text-muted-foreground">
            Les données ci-dessous suivent la période sélectionnée.
          </p>
        </div>
        <DashboardPeriodFilter />
      </div>

      <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics
          .filter((metric) => !metric.sensitive || can("analytics.cost_margin_read"))
          .map((metric) => {
            const Icon = metric.icon;
            return (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={<Money value={metric.value} currency={currency} />}
                comparison={metric.comparison}
                definition={metric.definition}
                className="h-full"
                icon={<Icon className="size-4" aria-hidden="true" />}
                action={
                  <Button asChild variant="ghost" size="icon" className="size-11 min-h-11 sm:size-8 sm:min-h-8">
                    <Link
                      href={href(metric.href) + `?start=${start}&end=${end}`}
                      aria-label={`Ouvrir ${metric.label}`}
                    >
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                }
              />
            );
          })}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,0.8fr)]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Activité</CardTitle>
              <CardDescription>
                Chiffre d’affaires{can("analytics.cost_margin_read") ? " et marge brute" : ""} · {currency}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-muted p-1">
              {[7, 30].map((daysCount) => (
                <Button
                  key={daysCount}
                  variant="ghost"
                  size="sm"
                  className="bg-transparent"
                  onClick={() => {
                    const first = new Date();
                    first.setDate(first.getDate() - daysCount + 1);
                    setDates(
                      first.toISOString().slice(0, 10),
                      new Date().toISOString().slice(0, 10),
                    );
                  }}
                >
                  {daysCount} j
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
                Chiffre d’affaires
              </span>
              {can("analytics.cost_margin_read") ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-success" aria-hidden="true" />
                  Marge brute
                </span>
              ) : null}
            </div>
            <RevenueChart
              rows={snapshot!.reporting?.daily ?? days}
              currency={currency}
              margin={can("analytics.cost_margin_read")}
              onSelect={(date) => router.push(href("/sales") + `?start=${date}&end=${date}`)}
            />
          </CardContent>
        </Card>

        <DashboardAttention items={attentionItems} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardTopProducts rows={topProducts} currency={currency} href={href} />
        <DashboardPaymentBreakdown
          rows={paymentBreakdown}
          total={kpi.incoming}
          currency={currency}
          href={href}
        />
      </div>

      <DashboardRecentSales sales={sales.slice(0, 5)} currency={currency} href={href} />

      <Card>
        <CardContent className="grid gap-4 p-4 text-sm sm:grid-cols-3">
          <div className="flex items-center justify-between gap-3 sm:block">
            <span className="text-muted-foreground">Décaissements</span>
            <Money value={kpi.outgoing} currency={currency} className="font-semibold text-foreground sm:mt-1 sm:block" />
          </div>
          {can("accounting.read") ? (
            <div className="flex items-center justify-between gap-3 border-border sm:block sm:border-l sm:pl-4">
              <span className="text-muted-foreground">Résultat comptable</span>
              <Money value={kpi.result} currency={currency} className="font-semibold text-foreground sm:mt-1 sm:block" />
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 border-border sm:block sm:border-l sm:pl-4">
            <span className="text-muted-foreground">Troc / rachat</span>
            <strong className="font-semibold tabular-nums text-foreground sm:mt-1 sm:block">
              {db.trades.filter(scope).length} / {db.buybacks.filter(scope).length}
            </strong>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
