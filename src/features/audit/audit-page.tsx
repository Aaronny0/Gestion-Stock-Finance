"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { History, ShieldCheck } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { DateRangeFilter } from "@/components/data-display/date-range-filter";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkspace } from "@/frontend/provider";
import type { RecordRow } from "@/frontend/types";

const labelMap: Record<string, string> = {
  label: "Événement", date: "Date", status: "Action", actor: "Auteur", reason: "Motif", sourceId: "Transaction source", sourceType: "Type de source",
};

export function AuditPage() {
  const { snapshot, storeId, start, end, can } = useWorkspace();
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const rows = useMemo(() => snapshot!.data.audit.filter((row) =>
    (!row.storeId || storeId === "all" || row.storeId === storeId) && row.date.slice(0, 10) >= start && row.date.slice(0, 10) <= end,
  ), [snapshot, storeId, start, end]);

  const columns = useMemo<ColumnDef<RecordRow>[]>(() => [
    { accessorKey: "date", header: "Date", cell: ({ row }) => <span className="whitespace-nowrap text-xs tabular-nums">{new Date(row.original.date).toLocaleString("fr-FR")}</span> },
    { accessorKey: "label", header: "Événement", cell: ({ row }) => <div><strong className="block text-sm font-semibold">{row.original.label}</strong>{row.original.sourceId ? <span className="text-xs text-muted-foreground">Source · {String(row.original.sourceId)}</span> : null}</div> },
    { accessorKey: "actor", header: "Auteur", cell: ({ row }) => String(row.original.actor ?? "—") },
    { accessorKey: "reason", header: "Motif", cell: ({ row }) => <span className="line-clamp-2 max-w-md text-sm text-muted-foreground">{String(row.original.reason ?? "—")}</span> },
    { accessorKey: "status", header: "Action", cell: ({ row }) => <StatusBadge value={String(row.original.status)} showIcon={false} /> },
  ], []);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="HISTORIQUE & AUDIT" title="Une trace lisible de chaque action." description="Consultez les événements, acteurs, motifs et transactions sources. Le journal reste en lecture seule." actions={<DateRangeFilter />} />
      <Card className="border-info/20 bg-info-background shadow-none"><CardContent className="flex items-start gap-3 p-4 text-sm text-info"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><div><strong className="block font-semibold">Journal en lecture seule</strong><span>Cette interface n’altère aucune entrée d’audit. Les filtres ne modifient que l’affichage.</span></div></CardContent></Card>
      <DataTable
        name="audit"
        data={rows}
        columns={columns}
        density="dense"
        pageSize={15}
        getRowId={(row) => row.id}
        searchPlaceholder="Rechercher un événement, auteur ou motif…"
        canExport={can("exports.create")}
        exportRow={(row) => ({ Date: row.date, Evenement: row.label, Auteur: String(row.actor ?? ""), Motif: String(row.reason ?? ""), Action: row.status, Source: String(row.sourceId ?? "") })}
        onRow={setSelected}
        mobileRow={(row) => <Card className="shadow-none"><CardContent className="space-y-2 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{row.label}</p><p className="text-xs text-muted-foreground">{new Date(row.date).toLocaleString("fr-FR")} · {String(row.actor ?? "Auteur inconnu")}</p></div><StatusBadge value={String(row.status)} showIcon={false} /></div>{row.reason ? <p className="line-clamp-2 text-xs text-muted-foreground">{String(row.reason)}</p> : null}</CardContent></Card>}
      />

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="size-5 text-primary" />{selected?.label}</DialogTitle><DialogDescription>Détail de l’événement d’audit sélectionné.</DialogDescription></DialogHeader>
          {selected ? <dl className="divide-y divide-border rounded-lg border border-border">{Object.entries(selected).filter(([key]) => !["id", "storeId"].includes(key)).map(([key, value]) => <div key={key} className="grid gap-1 px-4 py-3 sm:grid-cols-[150px_1fr]"><dt className="text-xs font-semibold text-muted-foreground">{labelMap[key] ?? key}</dt><dd className="break-words text-sm">{Array.isArray(value) ? value.join(", ") : String(value ?? "—")}</dd></div>)}</dl> : null}
          <DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
