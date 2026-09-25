"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowUpRight, Info, Plus } from "lucide-react";
import { DashboardAttention } from "@/features/dashboard/dashboard-attention";
import { DashboardPeriodFilter } from "@/features/dashboard/dashboard-period-filter";
import { DashboardRecentSales } from "@/features/dashboard/dashboard-recent-sales";
import { DashboardSetupChecklist } from "@/features/dashboard/dashboard-setup-checklist";
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
import { useWorkspace } from "./provider";

const RevenueChart = dynamic(
  () => import("./charts").then((module) => module.RevenueChart),
  {
    ssr: false,
    loading: () => <div className="h-72 animate-pulse rounded-xl bg-muted" />,
  },
);

function StatRow({ label, value, href }: { label: string; value: ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
        {value}
        <ArrowUpRight
          className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

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

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Bonjour ${firstName},`}
        description="Voici l’essentiel de votre activité sur la période sélectionnée."
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

      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              {activeStore} · {currency}
            </CardDescription>
          </div>
          <DashboardPeriodFilter />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Chiffre d’affaires
              </p>
              <Money
                value={kpi.revenue}
                currency={currency}
                className="block text-3xl font-bold tracking-tight text-foreground [font-variant-numeric:tabular-nums]"
              />
              <p className="mb-0 mt-1 text-xs text-muted-foreground">
                {kpi.count} ventes · {kpi.units} unités
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={href("/sales") + `?start=${start}&end=${end}`}>
                Détail des ventes
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-1 border-t border-border pt-4 sm:grid-cols-3">
            <StatRow
              label="Encaissements"
              value={<Money value={kpi.incoming} currency={currency} />}
              href={href("/payments")}
            />
            <StatRow
              label="Cashflow net"
              value={<Money value={kpi.cashflow} currency={currency} />}
              href={href("/cash")}
            />
            {can("analytics.cost_margin_read") ? (
              <StatRow
                label="Marge brute"
                value={<Money value={kpi.margin} currency={currency} />}
                href={href("/analytics/margin")}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

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

      <DashboardRecentSales sales={sales.slice(0, 5)} currency={currency} href={href} />
    </div>
  );
}
