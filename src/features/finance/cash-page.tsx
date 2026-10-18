"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { LockKeyhole, Plus, WalletCards } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { DateRangeFilter } from "@/components/data-display/date-range-filter";
import { ListCard } from "@/components/data-display/list-card";
import { SummaryItem, SummaryStrip } from "@/components/data-display/summary-strip";
import { formatListDate } from "@/lib/format";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/frontend/forms";
import { useWorkspace } from "@/frontend/provider";
import type { Payment, RecordRow } from "@/frontend/types";
import { FinanceRecordDialog } from "@/features/finance/finance-record-dialog";

function CashPage() {
  const { snapshot, storeId, start, end, can } = useWorkspace();
  const db = snapshot!.data;
  const [action, setAction] = useState<{ type: string; title: string } | null>(null);
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const scope = (row: { storeId?: string; date: string }) => (!row.storeId || storeId === "all" || row.storeId === storeId) && row.date.slice(0, 10) >= start && row.date.slice(0, 10) <= end;
  const sessions = db.cash.filter((row) => !row.storeId || row.storeId === storeId);
  const current = sessions.find((row) => row.status === "open");
  const payments = db.payments.filter(scope);
  const incoming = payments.filter((payment) => payment.direction === "in").reduce((sum, payment) => sum + payment.amount, 0);
  const outgoing = payments.filter((payment) => payment.direction === "out").reduce((sum, payment) => sum + payment.amount, 0);
  const cashBalance = Number(current?.opening ?? 0) + db.payments
    .filter((payment) => payment.storeId === storeId && payment.method === "Espèces" && payment.date >= String(current?.openedAt ?? "9999"))
    .reduce((sum, payment) => sum + (payment.direction === "in" ? payment.amount : -payment.amount), 0);

  const sessionColumns: ColumnDef<RecordRow>[] = [
    { accessorKey: "date", header: "Ouverture", cell: ({ row }) => formatListDate(row.original.date, { time: true }) },
    { accessorKey: "label", header: "Caisse" },
    { accessorKey: "status", header: "Statut", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    { accessorKey: "opening", header: "Solde initial", meta: { align: "right" }, cell: ({ row }) => <Money value={Number(row.original.opening ?? 0)} /> },
    { accessorKey: "counted", header: "Montant compté", meta: { align: "right" }, cell: ({ row }) => row.original.counted !== undefined ? <Money value={Number(row.original.counted)} /> : "—" },
    { accessorKey: "difference", header: "Écart", meta: { align: "right" }, cell: ({ row }) => row.original.difference !== undefined ? <Money value={Number(row.original.difference)} /> : "—" },
  ];
  const paymentColumns: ColumnDef<Payment>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => formatListDate(row.original.date, { time: true }) },
    { accessorKey: "label", header: "Opération" },
    { accessorKey: "method", header: "Mode" },
    { accessorKey: "direction", header: "Sens", cell: ({ row }) => row.original.direction === "in" ? "Entrée" : "Sortie" },
    { accessorKey: "amount", header: "Montant", meta: { align: "right" }, cell: ({ row }) => <Money value={row.original.amount} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trésorerie & caisse"
        description="Vos encaissements et décaissements, distincts de votre chiffre d’affaires."
        secondaryActions={can("cash.manual_movement") ? [{ label: "Mouvement manuel", icon: Plus, onSelect: () => setAction({ type: "cash.movement", title: "Mouvement manuel" }) }] : []}
        primaryAction={can("cash.open_close") ? <Button onClick={() => setAction({ type: current ? "cash.close" : "cash.open", title: current ? "Clôturer la caisse" : "Ouvrir la caisse" })}>{current ? <LockKeyhole /> : <WalletCards />}{current ? "Clôturer la caisse" : "Ouvrir la caisse"}</Button> : undefined}
      />

      <SummaryStrip aria-label="Synthèse de la trésorerie">
        <SummaryItem label={current ? "Caisse ouverte" : "Caisse fermée"} money={cashBalance} meta={current ? String(current.label ?? "Session active") : "Aucune session active"} />
        <SummaryItem label="Encaissements" money={incoming} meta="sur la période sélectionnée" />
        <SummaryItem label="Décaissements" money={outgoing} meta="sur la période sélectionnée" />
      </SummaryStrip>

      <div className="space-y-3">
        <div><h2 className="text-lg font-semibold">Sessions de caisse</h2><p className="text-sm text-muted-foreground">Ouvertures, clôtures et écarts constatés.</p></div>
        <ListCard aria-label="Sessions de caisse"><DataTable name="sessions-caisse" data={sessions} columns={sessionColumns} getRowId={(row) => row.id} onRow={setSelected} canExport={can("exports.create")} exportRow={(row) => ({ Ouverture: row.date, Caisse: row.label, Statut: row.status, "Solde initial": row.opening ?? 0, "Montant compté": row.counted ?? "", Écart: row.difference ?? "" })} mobileRow={(row) => <div className="rounded-lg border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{row.label}</p><p className="mt-1 text-xs text-muted-foreground">{formatListDate(row.date, { time: true })}</p></div><StatusBadge value={row.status} /></div><div className="mt-3 flex items-center justify-between text-sm"><span className="text-muted-foreground">Ouverture</span><Money value={Number(row.opening ?? 0)} className="font-semibold" /></div></div>} emptyKind="first-use" emptyTitle="Aucune session de caisse" emptyDescription="Ouvrez la caisse pour commencer à encaisser." /></ListCard>
      </div>

      {can("finance.read") ? <div className="space-y-3"><div><h2 className="text-lg font-semibold">Mouvements de trésorerie</h2><p className="text-sm text-muted-foreground">Entrées et sorties enregistrées sur la période.</p></div><ListCard aria-label="Mouvements de trésorerie"><DataTable name="mouvements-caisse" data={payments} columns={paymentColumns} getRowId={(row) => row.id} toolbarStart={<DateRangeFilter />} emptyTitle="Aucun mouvement sur la période" emptyDescription="Élargissez la période pour retrouver les entrées et sorties." canExport={can("exports.create")} exportRow={(row) => ({ Date: row.date, Opération: row.label, Mode: row.method, Sens: row.direction === "in" ? "Entrée" : "Sortie", Montant: row.amount })} mobileRow={(row) => <div className="rounded-lg border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{row.label}</p><p className="mt-1 text-xs text-muted-foreground">{formatListDate(row.date, { time: true })} · {row.method}</p></div><span className={row.direction === "in" ? "text-success" : "text-destructive"}>{row.direction === "in" ? "Entrée" : "Sortie"}</span></div><Money value={row.amount} className="mt-3 block text-base font-bold" /></div>} /></ListCard></div> : null}

      {action ? <ActionForm {...action} onClose={() => setAction(null)} /> : null}
      {selected ? <FinanceRecordDialog row={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

export { CashPage };
