"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Info, Plus, Package, Wallet, ReceiptText } from "lucide-react";
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

export default function Dashboard() {
  const { snapshot, storeId, start, end, href, can } = useWorkspace();
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

  const history = db.sales.filter(sale => storeId === "all" || sale.storeId === storeId);
  const sales = history.filter(scope);
  const payments = db.payments.filter(scope);
  const entries = db.entries.filter(scope);
  const kpi = snapshot!.reporting?.kpis ?? indicators(history, payments, entries, {start,end});

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
      history,
      [],
      [],
      {start:date,end:date},
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
    <div className="dashboard-workbench">
      <PageHeader eyebrow="Votre poste de pilotage" title={`Bonjour ${firstName},`} description={`${activeStore}. Gardez une longueur d’avance sur votre activité.`}
        actions={can("sales.create") ? <Button asChild><Link href={href("/pos")}><Plus /> Nouvelle vente</Link></Button> : undefined} />
      {can("settings.manage") ? <DashboardSetupChecklist steps={setupSteps} href={href} /> : null}
      <div className="dashboard-period"><div><h2>Vue d’ensemble</h2><span>Les chiffres de votre activité</span></div><DashboardPeriodFilter /></div>
      {lowStock.length > 0 && <Link className="mobile-priority" href={href("/stock")+"?low=1"}><Package size={17}/>{lowStock.length} références à réapprovisionner<ArrowUpRight size={15}/></Link>}
      <div className="dashboard-focus">
        <section className="revenue-workspace" aria-labelledby="revenue-title">
          <div className="revenue-summary">
            <div><h2 id="revenue-title">Chiffre d’affaires</h2><Money value={kpi.revenue} currency={currency} className="revenue-number" /><p>{kpi.count} ventes réalisées <span aria-hidden="true">/</span> {kpi.units} unités vendues</p></div>
            <Link className="subtle-link" href={href("/sales") + `?start=${start}&end=${end}`}>Voir les ventes <ArrowUpRight size={16}/></Link>
          </div>
          <div className="chart-key"><span><i /> Chiffre d’affaires</span>{can("analytics.cost_margin_read") && <span><i className="jade" /> Marge brute</span>}<span className="chart-unit">{currency}</span></div>
          <RevenueChart rows={snapshot!.reporting?.daily ?? days} currency={currency} margin={can("analytics.cost_margin_read")} onSelect={date => router.push(href("/sales") + `?start=${date}&end=${date}`)} />
          <div className="revenue-foot"><span>De la vente à la décision, une vision continue.</span><Link href={href("/analytics")}>Analyser la période <ArrowUpRight size={14}/></Link></div>
        </section>
        <DashboardAttention items={attentionItems} />
      </div>
      <section className="financial-strip" aria-label="Flux financiers de la période">
        <Link href={href("/payments")}><span><Wallet size={17}/> Encaissements</span><Money value={kpi.incoming} currency={currency}/><small>Règlements reçus sur la période</small></Link>
        <Link href={href("/cash")}><span><ReceiptText size={17}/> Flux net de trésorerie</span><Money value={kpi.cashflow} currency={currency}/><small>Encaissements moins décaissements</small></Link>
        {can("analytics.cost_margin_read") && <Link href={href("/analytics/margin")}><span><ArrowUpRight size={17}/> Marge brute</span><Money value={kpi.margin} currency={currency}/><small>Avant déduction des charges</small></Link>}
        <Link href={href("/stock")}><span><Package size={17}/> Stock disponible</span><strong>{products.reduce((sum, p) => sum + p.quantity, 0)} <small>unités</small></strong><small>{products.length} références actives</small></Link>
      </section>
      <DashboardRecentSales sales={[...sales].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5)} currency={currency} href={href} />
    </div>
  );
}
