"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { DateRangeFilter } from "@/components/data-display/date-range-filter";
import { MetricCard } from "@/components/data-display/metric-card";
import { Money } from "@/components/data-display/money";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/frontend/forms";
import { useWorkspace } from "@/frontend/provider";
import type { Payment, RecordRow } from "@/frontend/types";
import { FinanceRecordDialog } from "@/features/finance/finance-record-dialog";

function PaymentsPage() {
  const { snapshot, storeId, start, end, href, can } = useWorkspace();
  const router = useRouter();
  const db = snapshot!.data;
  const [create, setCreate] = useState(false);
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const query = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();
  const rows = db.payments.filter((payment) => (storeId === "all" || payment.storeId === storeId) && payment.date.slice(0, 10) >= start && payment.date.slice(0, 10) <= end && (!query.get("method") || payment.method === query.get("method")));
  const incoming = rows.filter((row) => row.direction === "in").reduce((sum, row) => sum + row.amount, 0);
  const outgoing = rows.filter((row) => row.direction === "out").reduce((sum, row) => sum + row.amount, 0);
  const columns: ColumnDef<Payment>[] = [
    { accessorKey: "date", header: "Date" },
    { accessorKey: "label", header: "Référence" },
    { accessorKey: "method", header: "Mode" },
    { accessorKey: "direction", header: "Sens", cell: ({ row }) => <span className={row.original.direction === "in" ? "font-medium text-success" : "font-medium text-destructive"}>{row.original.direction === "in" ? "Encaissement" : "Décaissement"}</span> },
    { accessorKey: "amount", header: "Montant", cell: ({ row }) => <Money value={row.original.amount} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="PAIEMENTS" title="Des règlements sans zone d’ombre." description="Encaissements clients et paiements fournisseurs." actions={can("finance.read") ? <Button onClick={() => setCreate(true)}><Plus /> Enregistrer un règlement</Button> : undefined} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Encaissements" value={<Money value={incoming} />} icon={<ArrowDownRight className="size-4" />} comparison="sur la période sélectionnée" />
        <MetricCard label="Décaissements" value={<Money value={outgoing} />} icon={<ArrowUpRight className="size-4" />} comparison="sur la période sélectionnée" />
        <MetricCard label="Flux net" value={<Money value={incoming - outgoing} />} comparison={`${rows.length} règlement${rows.length > 1 ? "s" : ""}`} />
      </div>
      <DateRangeFilter />
      <DataTable name="paiements" data={rows} columns={columns} getRowId={(row) => row.id} onRow={(payment) => { const sale = db.sales.find((item) => item.id === payment.sourceId); if (sale) router.push(href(`/sales/${sale.id}`)); else setSelected({ id: payment.id, label: payment.label, date: payment.date, status: "Validé", amount: payment.amount, sourceId: payment.sourceId, method: payment.method, direction: payment.direction }); }} canExport={can("exports.create")} enableSelection={can("exports.create")} exportRow={(row) => ({ Date: row.date, Référence: row.label, Mode: row.method, Sens: row.direction === "in" ? "Encaissement" : "Décaissement", Montant: row.amount })} searchPlaceholder="Référence, mode, sens…" mobileRow={(row) => <div className="rounded-lg border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{row.label}</p><p className="mt-1 text-xs text-muted-foreground">{row.date} · {row.method}</p></div><span className={row.direction === "in" ? "text-xs font-semibold text-success" : "text-xs font-semibold text-destructive"}>{row.direction === "in" ? "Encaissement" : "Décaissement"}</span></div><Money value={row.amount} className="mt-3 block text-base font-bold" /></div>} />
      {create ? <ActionForm type="payment.create" title="Enregistrer un règlement" onClose={() => setCreate(false)} /> : null}
      {selected ? <FinanceRecordDialog row={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

export { PaymentsPage };
