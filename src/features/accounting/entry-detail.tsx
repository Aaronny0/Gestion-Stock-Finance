"use client";

import { useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, FilePenLine, RotateCcw } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { balance } from "@/frontend/accounting";
import { ActionForm } from "@/frontend/forms";
import { useWorkspace } from "@/frontend/provider";
import type { AccountingEntry, AccountingLine } from "@/frontend/types";
import { EntryEditor } from "@/features/accounting/entry-editor";

type EntryLineRow = AccountingLine & { id: string };

function EntryDetail({ entry, onClose }: { entry: AccountingEntry; onClose: () => void }) {
  const { href, can, command } = useWorkspace();
  const [action, setAction] = useState<"" | "edit" | "reverse">("");
  const [postingError, setPostingError] = useState("");
  const [busy, setBusy] = useState(false);
  if (action === "edit") return <EntryEditor initial={entry} onClose={onClose} />;
  if (action === "reverse") return <ActionForm type="entry.reverse" title="Extourner l’écriture" initial={{ id: entry.id }} onClose={() => { setAction(""); onClose(); }} />;

  const columns: ColumnDef<EntryLineRow>[] = [
    { accessorKey: "account", header: "Compte" },
    { accessorKey: "label", header: "Libellé" },
    { accessorKey: "debit", header: "Débit", cell: ({ row }) => <Money value={row.original.debit} /> },
    { accessorKey: "credit", header: "Crédit", cell: ({ row }) => <Money value={row.original.credit} /> },
  ];
  const sourcePath = entry.sourceId && entry.sourceType ? `/${({ entries: "accounting", trades: "trade", buybacks: "buyback" } as Record<string, string>)[entry.sourceType] ?? entry.sourceType}/${entry.sourceId}` : "";
  const totals = balance(entry.lines);

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2 pr-8"><DialogTitle>{entry.reference}</DialogTitle><StatusBadge value={entry.status} /></div>
          <DialogDescription>{entry.journal} · {entry.date} · {entry.label}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Total débit</p><Money value={totals.debit} className="mt-1 block font-semibold" /></div><div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Total crédit</p><Money value={totals.credit} className="mt-1 block font-semibold" /></div></div>
        <DataTable name="écriture" data={entry.lines.map((line, index) => ({ ...line, id: String(index) }))} columns={columns} getRowId={(row) => row.id} density="dense" enableColumnVisibility={false} searchPlaceholder="Compte ou libellé…" />
        {sourcePath ? <Button variant="link" asChild className="w-fit p-0"><Link href={href(sourcePath)} onClick={onClose}>Voir la transaction source <ArrowRight /></Link></Button> : null}
        {postingError ? <div className="rounded-lg border border-destructive/20 bg-destructive-background p-3 text-sm text-destructive" role="alert">{postingError}</div> : null}
        <DialogFooter>
          {can("accounting.post") && entry.status === "posted" ? <Button variant="outline" onClick={() => setAction("reverse")}><RotateCcw /> Extourner</Button> : null}
          {can("accounting.post") && entry.status === "draft" ? <Button variant="outline" onClick={() => setAction("edit")}><FilePenLine /> Modifier le brouillon</Button> : null}
          {can("accounting.post") && entry.status === "draft" ? <Button disabled={busy} onClick={async () => { setPostingError(""); try { setBusy(true); await command("entry.post", { id: entry.id }); onClose(); } catch (caught) { setPostingError((caught as Error).message); } finally { setBusy(false); } }}>{busy ? "Publication…" : "Poster définitivement"}</Button> : null}
          <Button variant="outline" onClick={onClose} disabled={busy}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { EntryDetail };
