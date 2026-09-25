"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, ReceiptText, Undo2 } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { DateRangeFilter } from "@/components/data-display/date-range-filter";
import { MetricCard } from "@/components/data-display/metric-card";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/frontend/forms";
import { useWorkspace } from "@/frontend/provider";
import type { RecordRow } from "@/frontend/types";
import { FinanceRecordDialog } from "@/features/finance/finance-record-dialog";

function ExpensesPage() {
  const { snapshot, storeId, start, end, can } = useWorkspace();
  const db = snapshot!.data;
  const [action, setAction] = useState<{ type: string; title: string; initial?: Record<string, unknown> } | null>(null);
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const rows = db.expenses.filter((row) => (!row.storeId || storeId === "all" || row.storeId === storeId) && row.date.slice(0, 10) >= start && row.date.slice(0, 10) <= end);
  const activeRows = rows.filter((row) => row.status !== "Annulé");
  const total = activeRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const categories = new Set(activeRows.map((row) => String(row.category ?? "Autres"))).size;
  const columns: ColumnDef<RecordRow>[] = [
    { accessorKey: "date", header: "Date" },
    { accessorKey: "label", header: "Libellé" },
    { accessorKey: "category", header: "Catégorie", cell: ({ row }) => String(row.original.category ?? "—") },
    { accessorKey: "method", header: "Mode", cell: ({ row }) => String(row.original.method ?? "—") },
    { accessorKey: "amount", header: "Montant", cell: ({ row }) => <Money value={Number(row.original.amount ?? 0)} /> },
    { accessorKey: "status", header: "Statut", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="DÉPENSES" title="Chaque dépense à sa place." description="Suivez vos charges et leurs justificatifs, sans effacer l’historique." actions={can("finance.read") ? <Button onClick={() => setAction({ type: "expense.create", title: "Nouvelle dépense" })}><Plus /> Nouvelle dépense</Button> : undefined} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Dépenses de la période" value={<Money value={total} />} icon={<ReceiptText className="size-4" />} comparison={`${activeRows.length} opération${activeRows.length > 1 ? "s" : ""}`} />
        <MetricCard label="Catégories utilisées" value={categories} comparison="sur la période sélectionnée" />
        <MetricCard label="Montant moyen" value={<Money value={activeRows.length ? Math.round(total / activeRows.length) : 0} />} comparison="par dépense active" />
      </div>
      <DateRangeFilter />
      <DataTable name="dépenses" data={rows} columns={columns} getRowId={(row) => row.id} onRow={setSelected} canExport={can("exports.create")} enableSelection={can("exports.create")} exportRow={(row) => ({ Date: row.date, Libellé: row.label, Catégorie: row.category ?? "", Mode: row.method ?? "", Montant: row.amount ?? 0, Statut: row.status })} searchPlaceholder="Libellé, catégorie, mode…" mobileRow={(row) => <div className="rounded-lg border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{row.label}</p><p className="mt-1 text-xs text-muted-foreground">{row.date} · {String(row.category ?? "Sans catégorie")}</p></div><StatusBadge value={row.status} /></div><Money value={Number(row.amount ?? 0)} className="mt-3 block text-base font-bold" /></div>} />
      {action ? <ActionForm {...action} onClose={() => setAction(null)} /> : null}
      {selected ? <FinanceRecordDialog row={selected} onClose={() => setSelected(null)} actions={can("finance.read") && selected.status !== "Annulé" ? <Button variant="outline" onClick={() => { setAction({ type: "expense.reverse", title: "Annuler la dépense", initial: { id: selected.id } }); setSelected(null); }}><Undo2 /> Annuler par extourne</Button> : undefined} /> : null}
    </div>
  );
}

export { ExpensesPage };
