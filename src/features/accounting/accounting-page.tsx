"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { LockKeyhole, Plus } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { DateRangeFilter } from "@/components/data-display/date-range-filter";
import { ListCard, ListTabs } from "@/components/data-display/list-card";
import { SummaryItem, SummaryStrip } from "@/components/data-display/summary-strip";
import { formatListDate } from "@/lib/format";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { balance, ledger, trialBalance } from "@/frontend/accounting";
import { ActionForm } from "@/frontend/forms";
import { salePosition } from "@/frontend/operations";
import { useViewState, useWorkspace } from "@/frontend/provider";
import type { Account, AccountingEntry, Period } from "@/frontend/types";
import { EntryDetail } from "@/features/accounting/entry-detail";
import { EntryEditor } from "@/features/accounting/entry-editor";

const tabs = [
  ["journals", "Journaux"],
  ["accounts", "Plan comptable"],
  ["ledger", "Grand livre"],
  ["trial-balance", "Balance"],
  ["statements", "États financiers"],
  ["periods", "Exercices & clôtures"],
] as const;
const journals = ["Ventes", "Achats", "Caisse", "Banque", "Opérations diverses"];
const accountTypeLabels: Record<Account["type"], string> = { asset: "Actif", liability: "Passif", equity: "Capitaux propres", income: "Produit", expense: "Charge" };

function AccountingPage({ path }: { path: string }) {
  const { snapshot, storeId, start, end, href, can, command } = useWorkspace();
  const db = snapshot!.data;
  const rawTab = path.split("/")[2] || "journals";
  const tab = tabs.some(([key]) => key === rawTab) ? rawTab : "journals";
  const [account, setAccount] = useViewState("account", "");
  const [journal, setJournal] = useViewState("journal", "");
  const [editor, setEditor] = useState(false);
  const [selected, setSelected] = useState<AccountingEntry | null>(null);
  const [accountForm, setAccountForm] = useState(false);
  const [confirm, setConfirm] = useState<{ type: "period.lock" | "account.toggle"; id: string } | null>(null);
  const [confirmError, setConfirmError] = useState("");
  const [confirmBusy, setConfirmBusy] = useState(false);
  const entries = db.entries.filter((entry) => (storeId === "all" || entry.storeId === storeId) && (!journal || entry.journal === journal));
  const inPeriod = entries.filter((entry) => entry.date.slice(0, 10) >= start && entry.date.slice(0, 10) <= end);
  const trial = trialBalance(entries, db.accounts, start, end);
  const ledgerRows = ledger(entries, account, start, end);
  const totals = trial.reduce((value, row) => ({ debit: value.debit + row.debit, credit: value.credit + row.credit }), { debit: 0, credit: 0 });
  const statements = trial.reduce((value, row) => { value[row.type] = (value[row.type] ?? 0) + (["liability", "equity", "income"].includes(row.type) ? -row.closing : row.closing); return value; }, {} as Record<string, number>);
  const profit = trial.filter((row) => row.type === "income" || row.type === "expense").reduce((sum, row) => sum + row.credit - row.debit, 0);
  const postedCount = inPeriod.filter((entry) => entry.status === "posted").length;
  const draftCount = inPeriod.filter((entry) => entry.status === "draft").length;
  const income = db.payments.filter((payment) => (storeId === "all" || payment.storeId === storeId) && payment.date.slice(0, 10) >= start && payment.date.slice(0, 10) <= end && payment.direction === "in").reduce((sum, payment) => sum + payment.amount, 0);
  const outgoing = db.payments.filter((payment) => (storeId === "all" || payment.storeId === storeId) && payment.date.slice(0, 10) >= start && payment.date.slice(0, 10) <= end && payment.direction === "out").reduce((sum, payment) => sum + payment.amount, 0);

  const entryColumns: ColumnDef<AccountingEntry>[] = [
    { accessorKey: "reference", header: "Référence" }, { accessorKey: "date", header: "Date", cell: ({ row }) => formatListDate(row.original.date) }, { accessorKey: "journal", header: "Journal" }, { accessorKey: "label", header: "Libellé" },
    { id: "debit", header: "Débit", meta: { align: "right" }, accessorFn: (entry) => balance(entry.lines).debit, cell: ({ row }) => <Money value={balance(row.original.lines).debit} /> },
    { id: "credit", header: "Crédit", meta: { align: "right" }, accessorFn: (entry) => balance(entry.lines).credit, cell: ({ row }) => <Money value={balance(row.original.lines).credit} /> },
    { accessorKey: "status", header: "Statut", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
  ];
  const accountColumns: ColumnDef<Account>[] = [
    { accessorKey: "number", header: "Numéro" }, { accessorKey: "name", header: "Compte" }, { accessorKey: "type", header: "Type", cell: ({ row }) => accountTypeLabels[row.original.type] },
    { accessorKey: "normal", header: "Sens normal", cell: ({ row }) => row.original.normal === "debit" ? "Débit" : "Crédit" },
    { accessorKey: "active", header: "Statut", cell: ({ row }) => <StatusBadge value={row.original.active ? "Actif" : "Inactif"} /> },
    ...(can("accounting.post") ? [{ id: "actions", header: "Action", enableSorting: false, cell: ({ row }: { row: { original: Account } }) => <Button variant="ghost" size="sm" onClick={() => setConfirm({ type: "account.toggle", id: row.original.id })}>{row.original.active ? "Désactiver" : "Activer"}</Button> } as ColumnDef<Account>] : []),
  ];
  type LedgerRow = (typeof ledgerRows)[number];
  const ledgerColumns: ColumnDef<LedgerRow>[] = [
    { id: "date", header: "Date", accessorFn: (row) => row.entry.date, cell: ({ row }) => formatListDate(row.original.entry.date) }, { id: "reference", header: "Référence", accessorFn: (row) => row.entry.reference }, { id: "account", header: "Compte", accessorFn: (row) => row.line.account }, { id: "label", header: "Libellé", accessorFn: (row) => row.line.label },
    { id: "debit", header: "Débit", meta: { align: "right" }, accessorFn: (row) => row.line.debit, cell: ({ row }) => <Money value={row.original.line.debit} /> }, { id: "credit", header: "Crédit", meta: { align: "right" }, accessorFn: (row) => row.line.credit, cell: ({ row }) => <Money value={row.original.line.credit} /> },
    ...(account ? [{ accessorKey: "running", header: "Solde cumulatif", meta: { align: "right" }, cell: ({ row }: { row: { original: LedgerRow } }) => <Money value={row.original.running} /> } as ColumnDef<LedgerRow>] : []),
  ];
  type TrialRow = (typeof trial)[number];
  const trialColumns: ColumnDef<TrialRow>[] = [
    { accessorKey: "number", header: "Compte" }, { accessorKey: "name", header: "Libellé" }, { accessorKey: "opening", header: "Ouverture", meta: { align: "right" }, cell: ({ row }) => <Money value={row.original.opening} /> }, { accessorKey: "debit", header: "Débit", meta: { align: "right" }, cell: ({ row }) => <Money value={row.original.debit} /> }, { accessorKey: "credit", header: "Crédit", meta: { align: "right" }, cell: ({ row }) => <Money value={row.original.credit} /> }, { accessorKey: "closing", header: "Solde final", meta: { align: "right" }, cell: ({ row }) => <Money value={row.original.closing} /> },
  ];
  const periodColumns: ColumnDef<Period>[] = [
    { accessorKey: "name", header: "Exercice / période" }, { accessorKey: "start", header: "Début", cell: ({ row }) => formatListDate(row.original.start) }, { accessorKey: "end", header: "Fin", cell: ({ row }) => formatListDate(row.original.end) }, { accessorKey: "status", header: "Statut", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    ...(can("accounting.close_period") ? [{ id: "actions", header: "Action", enableSorting: false, cell: ({ row }: { row: { original: Period } }) => row.original.status === "open" ? <Button variant="ghost" size="sm" onClick={() => setConfirm({ type: "period.lock", id: row.original.id })}><LockKeyhole /> Verrouiller</Button> : null } as ColumnDef<Period>] : []),
  ];

  const ageing = (kind: "clients" | "fournisseurs", min: number, max: number) => {
    const items = kind === "clients" ? db.sales.filter((sale) => salePosition(sale).due > 0).map((sale) => ({ date: sale.dueDate || sale.date, amount: salePosition(sale).due, storeId: sale.storeId })) : db.purchases.map((purchase) => ({ date: String(purchase.dueDate || purchase.date), amount: Number(purchase.amount ?? 0) - Number(purchase.paid ?? 0), storeId: purchase.storeId }));
    return items.filter((item) => { const age = Math.max(0, Math.floor((new Date(end).getTime() - new Date(item.date).getTime()) / 86400000)); return (storeId === "all" || item.storeId === storeId) && age >= min && age <= max; }).reduce((sum, item) => sum + item.amount, 0);
  };

  return (
    <div className="accounting-workbench space-y-6">
      <PageHeader title="Comptabilité" description="Contrôlez vos écritures, suivez vos comptes et préparez vos clôtures." primaryAction={can("accounting.post") ? <Button onClick={() => setEditor(true)}><Plus /> Nouvelle écriture</Button> : undefined} />
      <SummaryStrip aria-label="Synthèse comptable de la période">
        <SummaryItem label="Écritures postées" value={postedCount} meta="sur la période" />
        <SummaryItem label="Brouillons" value={draftCount} tone={draftCount ? "warning" : "default"} meta="à contrôler avant publication" />
        <SummaryItem label="Mouvements débit" money={totals.debit} meta="balance de la période" />
        <SummaryItem label="Résultat" money={profit} meta="produits moins charges" />
      </SummaryStrip>
      {tab === "ledger" ? <div className="rounded-lg border border-info/20 bg-info-background p-4 text-sm text-info">Choisissez un compte pour consulter son solde cumulatif. Cliquez sur une ligne pour retrouver l’écriture source.</div> : null}
      {tab === "periods" ? <div className="rounded-lg border border-warning/20 bg-warning-background p-4 text-sm text-warning">Une période verrouillée ne peut plus être modifiée. Les corrections se font par extourne dans une période ouverte.</div> : null}
      <ListCard aria-label="Comptabilité" tabs={<ListTabs aria-label="Vues comptables" items={tabs.map(([key, label]) => ({ href: href(`/accounting/${key}`), label, active: tab === key }))} />}>
      {tab === "journals" ? <DataTable name="journaux" data={inPeriod} columns={entryColumns} getRowId={(row) => row.id} onRow={setSelected} toolbarStart={<DateRangeFilter />} emptyTitle="Aucune écriture sur la période" emptyDescription="Élargissez la période ou choisissez un autre journal." filters={<Select value={journal || "all"} onValueChange={(value) => setJournal(value === "all" ? "" : value)}><SelectTrigger className="w-44" aria-label="Filtrer par journal"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les journaux</SelectItem>{journals.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>} canExport={can("exports.create")} exportRow={(entry) => ({ Référence: entry.reference, Date: entry.date, Journal: entry.journal, Libellé: entry.label, Débit: balance(entry.lines).debit, Crédit: balance(entry.lines).credit, Statut: entry.status })} mobileRow={(entry) => <div className="rounded-lg border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{entry.reference}</p><p className="mt-1 text-xs text-muted-foreground">{formatListDate(entry.date)} · {entry.journal}</p></div><StatusBadge value={entry.status} /></div><p className="mt-2 text-sm text-muted-foreground">{entry.label}</p><Money value={balance(entry.lines).debit} className="mt-3 block font-bold" /></div>} /> : null}

      {tab === "accounts" ? <DataTable name="plan-comptable" data={db.accounts} columns={accountColumns} getRowId={(row) => row.id} filters={can("accounting.post") ? <Button variant="outline" onClick={() => setAccountForm(true)}><Plus /> Ajouter un sous-compte</Button> : undefined} emptyTitle="Aucun compte" canExport={can("exports.create")} exportRow={(row) => ({ Numéro: row.number, Compte: row.name, Type: accountTypeLabels[row.type], "Sens normal": row.normal === "debit" ? "Débit" : "Crédit", Statut: row.active ? "Actif" : "Inactif" })} /> : null}

      {tab === "ledger" ? <DataTable name="grand-livre" data={ledgerRows} columns={ledgerColumns} getRowId={(row, index) => `${row.entry.id}-${row.line.account}-${index}`} toolbarStart={<DateRangeFilter />} emptyTitle="Aucun mouvement sur la période" emptyDescription="Élargissez la période ou choisissez un autre compte." onRow={(row) => setSelected(row.entry)} filters={<Select value={account || "all"} onValueChange={(value) => setAccount(value === "all" ? "" : value)}><SelectTrigger className="w-60" aria-label="Compte du grand livre"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les comptes</SelectItem>{db.accounts.map((item) => <SelectItem key={item.id} value={item.number}>{item.number} · {item.name}</SelectItem>)}</SelectContent></Select>} canExport={can("exports.create")} exportRow={(row) => ({ Date: row.entry.date, Référence: row.entry.reference, Compte: row.line.account, Libellé: row.line.label, Débit: row.line.debit, Crédit: row.line.credit, ...(account ? { "Solde cumulatif": row.running } : {}) })} /> : null}

      {tab === "trial-balance" ? <><DataTable name="balance" data={trial} columns={trialColumns} getRowId={(row) => row.id} toolbarStart={<DateRangeFilter />} emptyTitle="Aucun mouvement sur la période" canExport={can("exports.create")} exportRow={(row) => ({ Compte: row.number, Libellé: row.name, Ouverture: row.opening, Débit: row.debit, Crédit: row.credit, "Solde final": row.closing })} /><div aria-label="Totaux de la balance" className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-[#dde3e4] px-4 py-3 text-sm"><span className="text-muted-foreground">Mouvements débit <Money value={totals.debit} className="font-semibold text-foreground" /></span><span className="text-muted-foreground">Mouvements crédit <Money value={totals.credit} className="font-semibold text-foreground" /></span><StatusBadge value={totals.debit === totals.credit ? "Équilibrée" : "Déséquilibrée"} tone={totals.debit === totals.credit ? "success" : "destructive"} showIcon={false} /></div></> : null}

      {tab === "statements" ? <><div data-list-toolbar="" className="flex flex-wrap items-center gap-2 border-b border-[#dde3e4] px-4 py-3"><DateRangeFilter /></div><div className="space-y-4 p-4"><div className="grid gap-4 xl:grid-cols-2"><Card><CardHeader><CardTitle>Compte de résultat</CardTitle><CardDescription>Du {start} au {end} · écritures postées</CardDescription></CardHeader><CardContent className="space-y-3">{trial.filter((row) => row.type === "income" || row.type === "expense").map((row) => <div key={row.id} className="flex items-center justify-between gap-4 border-b border-border pb-2 text-sm"><span>{row.name}</span><Money value={row.type === "income" ? row.credit - row.debit : row.debit - row.credit} /></div>)}<div className="flex items-center justify-between gap-4 pt-2 font-semibold"><span>Résultat de la période</span><Money value={profit} /></div></CardContent></Card><Card><CardHeader><CardTitle>Bilan</CardTitle><CardDescription>Situation au {end}</CardDescription></CardHeader><CardContent className="space-y-3">{[["Actif", statements.asset ?? 0], ["Passif", statements.liability ?? 0], ["Capitaux propres", statements.equity ?? 0], ["Résultat cumulé", (statements.income ?? 0) - (statements.expense ?? 0)]] .map(([label, value]) => <div key={String(label)} className="flex items-center justify-between gap-4 border-b border-border pb-2 text-sm"><span>{label}</span><Money value={Number(value)} /></div>)}<div className="flex items-center justify-between gap-4 pt-2 font-semibold"><span>Total passif et capitaux propres</span><Money value={(statements.liability ?? 0) + (statements.equity ?? 0) + (statements.income ?? 0) - (statements.expense ?? 0)} /></div></CardContent></Card></div><Card><CardHeader><CardTitle>Flux de trésorerie</CardTitle><CardDescription>Encaissements et décaissements sur la période.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><div className="rounded-md bg-muted p-4"><p className="text-xs text-muted-foreground">Encaissements</p><Money value={income} className="mt-1 block text-lg font-bold" /></div><div className="rounded-md bg-muted p-4"><p className="text-xs text-muted-foreground">Décaissements</p><Money value={outgoing} className="mt-1 block text-lg font-bold" /></div></CardContent></Card><div className="grid gap-4 xl:grid-cols-2">{(["clients", "fournisseurs"] as const).map((kind) => <Card key={kind}><CardHeader><CardTitle>Ancienneté · {kind === "clients" ? "créances clients" : "dettes fournisseurs"}</CardTitle></CardHeader><CardContent className="space-y-3">{[[0, 30], [31, 60], [61, 90], [91, 99999]].map(([min, max]) => <div key={min} className="flex items-center justify-between gap-4 border-b border-border pb-2 text-sm"><span>{max > 90 ? "Plus de 90 jours" : `${min}–${max} jours`}</span><Money value={ageing(kind, min, max)} /></div>)}</CardContent></Card>)}</div></div></> : null}

      {tab === "periods" ? <DataTable name="exercices" data={db.periods} columns={periodColumns} getRowId={(row) => row.id} emptyTitle="Aucun exercice" canExport={can("exports.create")} exportRow={(row) => ({ Période: row.name, Début: row.start, Fin: row.end, Statut: row.status })} /> : null}
      </ListCard>

      {editor ? <EntryEditor onClose={() => setEditor(false)} /> : null}
      {selected ? <EntryDetail entry={db.entries.find((entry) => entry.id === selected.id) ?? selected} onClose={() => setSelected(null)} /> : null}
      {accountForm ? <ActionForm type="account.save" title="Ajouter un compte" onClose={() => setAccountForm(false)} /> : null}
      <AlertDialog open={Boolean(confirm)} onOpenChange={(open) => { if (!open && !confirmBusy) { setConfirm(null); setConfirmError(""); } }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirm?.type === "period.lock" ? "Verrouiller cette période ?" : "Modifier le statut du compte ?"}</AlertDialogTitle><AlertDialogDescription>{confirm?.type === "period.lock" ? "Vérifiez que les rapprochements sont terminés. Aucune nouvelle écriture ne pourra être postée dans cette période." : "Les écritures existantes seront conservées. Un compte désactivé ne sera plus proposé à la saisie."}</AlertDialogDescription></AlertDialogHeader>{confirmError ? <div className="rounded-lg border border-destructive/20 bg-destructive-background p-3 text-sm text-destructive" role="alert">{confirmError}</div> : null}<AlertDialogFooter><AlertDialogCancel disabled={confirmBusy}>Annuler</AlertDialogCancel><AlertDialogAction disabled={confirmBusy} onClick={(event) => { event.preventDefault(); if (!confirm) return; setConfirmError(""); setConfirmBusy(true); void command(confirm.type, { id: confirm.id }).then(() => { setConfirm(null); }).catch((caught) => setConfirmError((caught as Error).message)).finally(() => setConfirmBusy(false)); }}>{confirmBusy ? "Traitement…" : "Confirmer"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

export default AccountingPage;
