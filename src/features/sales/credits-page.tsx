"use client";

import { useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, CreditCard } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionForm } from "@/frontend/forms";
import { dueState, salePosition } from "@/frontend/operations";
import { useWorkspace } from "@/frontend/provider";
import type { Sale } from "@/frontend/types";

type CreditRow = Sale & { due: number; client: string; deadline: string };

function CreditsPage() {
  const { snapshot, storeId, href, can } = useWorkspace();
  const db = snapshot!.data;
  const [filter, setFilter] = useState("Tous");
  const [payment, setPayment] = useState<{ sourceId: string; amount: number } | null>(null);
  const rows: CreditRow[] = db.sales.filter((sale) => (storeId === "all" || sale.storeId === storeId) && salePosition(sale).due > 0).map((sale) => ({ ...sale, due: salePosition(sale).due, client: db.clients.find((client) => client.id === sale.clientId)?.label ?? "Client non renseigné", deadline: dueState(sale, new Date().toISOString()).label })).filter((sale) => filter === "Tous" || sale.deadline === filter).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  const columns: ColumnDef<CreditRow>[] = [
    { accessorKey: "reference", header: "Vente", cell: ({ row }) => <Button variant="link" size="sm" asChild><Link href={href(`/sales/${row.original.id}`)}>{row.original.reference}</Link></Button> },
    { accessorKey: "client", header: "Client" },
    { accessorKey: "dueDate", header: "Échéance", cell: ({ row }) => row.original.dueDate ? new Date(`${row.original.dueDate}T12:00:00`).toLocaleDateString("fr-FR") : "À définir" },
    { accessorKey: "deadline", header: "Suivi", cell: ({ row }) => <StatusBadge value={row.original.deadline} /> },
    { accessorKey: "due", header: "Reste dû", cell: ({ row }) => <Money value={row.original.due} className="font-semibold" /> },
    { id: "action", header: "Action", enableSorting: false, cell: ({ row }) => can("finance.read") ? <Button variant="link" size="sm" disabled={storeId === "all"} onClick={() => setPayment({ sourceId: row.original.id, amount: row.original.due })}><CreditCard /> Encaisser</Button> : null },
  ];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="SUIVI CLIENT" title="Les crédits à suivre." description="Retrouvez les soldes impayés et leurs échéances, indépendamment du filtre de période." actions={<Button variant="outline" asChild><Link href={href("/sales")}><ArrowLeft /> Toutes les ventes</Link></Button>} />
      <Tabs value={filter} onValueChange={setFilter}><TabsList className="w-full overflow-x-auto">{["Tous", "En retard", "Échéance aujourd’hui", "À venir", "Échéance à définir"].map((value) => <TabsTrigger value={value} key={value}>{value}</TabsTrigger>)}</TabsList></Tabs>
      <div className="grid gap-3 sm:grid-cols-2"><Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Dossiers affichés</p><p className="mt-2 text-xl font-bold">{rows.length}</p></Card><Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Reste à encaisser</p><Money value={rows.reduce((sum, row) => sum + row.due, 0)} className="mt-2 block text-xl font-bold" /></Card></div>
      <DataTable name="credits-clients" data={rows} columns={columns} getRowId={(row) => row.id} searchPlaceholder="Vente, client, échéance…" canExport={can("exports.create")} enableSelection={can("exports.create")} exportRow={(row) => ({ Vente: row.reference, Client: row.client, Échéance: row.dueDate ?? "", Suivi: row.deadline, "Reste dû": row.due })} />
      {payment ? <ActionForm type="payment.create" title="Encaisser un règlement" initial={payment} onClose={() => setPayment(null)} /> : null}
    </div>
  );
}

export { CreditsPage };
