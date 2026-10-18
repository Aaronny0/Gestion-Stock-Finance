"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { CreditCard, ReceiptText } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { ListCard, ListTabs } from "@/components/data-display/list-card";
import { Money } from "@/components/data-display/money";
import { SummaryItem, SummaryStrip } from "@/components/data-display/summary-strip";
import { formatListDate } from "@/lib/format";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/frontend/forms";
import { dueState, salePosition } from "@/frontend/operations";
import { useWorkspace } from "@/frontend/provider";
import type { Sale } from "@/frontend/types";

type CreditRow = Sale & { due: number; client: string; deadline: string };

function CreditsPage() {
  const { snapshot, storeId, href, can } = useWorkspace();
  const router = useRouter();
  const db = snapshot!.data;
  const [filter, setFilter] = useState("Tous");
  const [payment, setPayment] = useState<{ sourceId: string; amount: number } | null>(null);
  const credits: CreditRow[] = db.sales.filter((sale) => (storeId === "all" || sale.storeId === storeId) && salePosition(sale).due > 0).map((sale) => ({ ...sale, due: salePosition(sale).due, client: db.clients.find((client) => client.id === sale.clientId)?.label ?? "Client non renseigné", deadline: dueState(sale, new Date().toISOString()).label }));
  const rows = credits.filter((sale) => filter === "Tous" || sale.deadline === filter).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  const views = ["Tous", "En retard", "Échéance aujourd’hui", "À venir", "Échéance à définir"];
  const columns: ColumnDef<CreditRow>[] = [
    { accessorKey: "reference", header: "Vente", cell: ({ row }) => <Button variant="link" size="sm" asChild><Link href={href(`/sales/${row.original.id}`)}>{row.original.reference}</Link></Button> },
    { accessorKey: "client", header: "Client" },
    { accessorKey: "dueDate", header: "Échéance", cell: ({ row }) => row.original.dueDate ? formatListDate(row.original.dueDate) : "À définir" },
    { accessorKey: "deadline", header: "Suivi", cell: ({ row }) => <StatusBadge value={row.original.deadline} /> },
    { accessorKey: "due", header: "Reste dû", meta: { align: "right" }, cell: ({ row }) => <Money value={row.original.due} className="font-semibold" /> },
    { id: "action", header: "Action", enableSorting: false, cell: ({ row }) => can("finance.read") ? <Button variant="link" size="sm" disabled={storeId === "all"} onClick={() => setPayment({ sourceId: row.original.id, amount: row.original.due })}><CreditCard /> Encaisser</Button> : null },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Crédits et échéances" description="Retrouvez les soldes impayés et leurs échéances, indépendamment du filtre de période." secondaryActions={[{ label: "Toutes les ventes", icon: ReceiptText, href: href("/sales") }]} />
      <SummaryStrip aria-label="Synthèse des crédits affichés">
        <SummaryItem label="Dossiers affichés" value={rows.length} />
        <SummaryItem label="Reste à encaisser" tone="warning" money={rows.reduce((sum, row) => sum + row.due, 0)} />
      </SummaryStrip>
      <ListCard
        aria-label="Crédits clients"
        tabs={<ListTabs aria-label="Suivi des échéances" value={filter} onValueChange={setFilter} items={views.map((value) => ({ value, label: value, count: credits.filter((row) => value === "Tous" || row.deadline === value).length, tone: value === "En retard" ? ("warning" as const) : undefined }))} />}
      >
        <DataTable name="credits-clients" data={rows} columns={columns} getRowId={(row) => row.id} searchPlaceholder="Vente, client, échéance…" canExport={can("exports.create")} enableSelection={can("exports.create")} exportRow={(row) => ({ Vente: row.reference, Client: row.client, Échéance: row.dueDate ?? "", Suivi: row.deadline, "Reste dû": row.due })} emptyTitle={credits.length ? "Aucun crédit dans cette catégorie" : "Aucun crédit en cours"} emptyDescription={credits.length ? "Choisissez un autre suivi d’échéance." : "Les ventes à crédit ou partiellement payées apparaîtront ici."} mobileRow={(row) => <div className="flex items-center gap-3 px-4 py-3"><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><strong className="truncate text-sm font-semibold">{row.reference}</strong><StatusBadge value={row.deadline} showIcon={false} /></div><div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span className="truncate">{row.client} · {row.dueDate ? formatListDate(row.dueDate) : "À définir"}</span><Money value={row.due} className="text-sm font-semibold text-foreground" /></div></div></div>} onRow={(row) => router.push(href(`/sales/${row.id}`))} />
      </ListCard>
      {payment ? <ActionForm type="payment.create" title="Encaisser un règlement" initial={payment} onClose={() => setPayment(null)} /> : null}
    </div>
  );
}

export { CreditsPage };
