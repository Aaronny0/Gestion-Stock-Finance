"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Money } from "@/components/data-display/money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { balance, decimals, minor, validateEntry } from "@/frontend/accounting";
import { useUnsavedChanges, useWorkspace } from "@/frontend/provider";
import type { AccountingEntry, AccountingLine } from "@/frontend/types";

const journals = ["Ventes", "Achats", "Caisse", "Banque", "Opérations diverses"];

function EntryEditor({ onClose, initial }: { onClose: () => void; initial?: AccountingEntry }) {
  const { snapshot, command } = useWorkspace();
  const currency = snapshot!.session.organization.currency;
  const activeAccounts = snapshot!.data.accounts.filter((account) => account.active);
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [journal, setJournal] = useState(initial?.journal ?? "Opérations diverses");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [lines, setLines] = useState<AccountingLine[]>(initial?.lines ?? [
    { account: "571", label: "", debit: 0, credit: 0 },
    { account: "701", label: "", debit: 0, credit: 0 },
  ]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signature = JSON.stringify({ date, journal, label, lines });
  const original = useRef(signature);
  const discard = useUnsavedChanges(signature !== original.current, "Écriture comptable");
  const result = balance(lines);
  const scale = 10 ** decimals(currency);

  const close = () => { if (!busy && discard()) onClose(); };
  const change = (index: number, key: keyof AccountingLine, value: string | number) => setLines((current) => current.map((line, lineIndex) => lineIndex === index ? {
    ...line,
    [key]: value,
    ...(key === "debit" && Number(value) > 0 ? { credit: 0 } : {}),
    ...(key === "credit" && Number(value) > 0 ? { debit: 0 } : {}),
  } : line));

  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? `Modifier ${initial.reference}` : "Saisir une écriture comptable"}</DialogTitle>
          <DialogDescription>Une écriture doit contenir au moins deux lignes et rester parfaitement équilibrée.</DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setError("");
          try {
            validateEntry({ date, lines }, snapshot!.data.accounts, snapshot!.data.periods);
            setBusy(true);
            await command("entry.save", { date, journal, label, lines, id: initial?.id });
            onClose();
          } catch (caught) {
            setError((caught as Error).message);
          } finally {
            setBusy(false);
          }
        }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Journal</Label><Select value={journal} onValueChange={setJournal}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{journals.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="entry-date">Date</Label><Input id="entry-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="entry-label">Libellé de l’écriture</Label><Input id="entry-label" required value={label} onChange={(event) => setLabel(event.target.value)} /></div>

          <div className="space-y-3">
            {lines.map((line, index) => (
              <Card key={index} className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-semibold">Ligne {index + 1}</p><Button type="button" variant="ghost" size="sm" disabled={lines.length <= 2} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}><Trash2 /> Retirer</Button></div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2"><Label>Compte</Label><Select value={line.account} onValueChange={(value) => change(index, "account", value)}><SelectTrigger aria-label={`Compte ligne ${index + 1}`}><SelectValue /></SelectTrigger><SelectContent>{activeAccounts.map((account) => <SelectItem key={account.id} value={account.number}>{account.number} · {account.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label htmlFor={`entry-line-label-${index}`}>Libellé</Label><Input id={`entry-line-label-${index}`} value={line.label} onChange={(event) => change(index, "label", event.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor={`entry-debit-${index}`}>Débit ({currency})</Label><Input id={`entry-debit-${index}`} type="number" min="0" step={1 / scale} value={line.debit / scale} onChange={(event) => change(index, "debit", minor(event.target.value, currency))} /></div>
                  <div className="space-y-2"><Label htmlFor={`entry-credit-${index}`}>Crédit ({currency})</Label><Input id={`entry-credit-${index}`} type="number" min="0" step={1 / scale} value={line.credit / scale} onChange={(event) => change(index, "credit", minor(event.target.value, currency))} /></div>
                </div>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={() => setLines((current) => [...current, { account: activeAccounts[0]?.number ?? "", label: "", debit: 0, credit: 0 }])}><Plus /> Ajouter une ligne</Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Total débit</p><Money value={result.debit} currency={currency} className="mt-2 block text-lg font-bold" /></Card>
            <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Total crédit</p><Money value={result.credit} currency={currency} className="mt-2 block text-lg font-bold" /></Card>
            <Card className="p-4"><p className="text-xs font-medium text-muted-foreground">Écart</p><Money value={result.difference} currency={currency} className="mt-2 block text-lg font-bold" /></Card>
          </div>
          <div className={result.balanced ? "rounded-lg border border-success/20 bg-success-background p-3 text-sm text-success" : "rounded-lg border border-destructive/20 bg-destructive-background p-3 text-sm text-destructive"}>{result.balanced ? "L’écriture est équilibrée." : "Le total débit doit être égal au total crédit."}</div>
          {error ? <div className="rounded-lg border border-destructive/20 bg-destructive-background p-3 text-sm text-destructive" role="alert">{error}</div> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={busy}>Annuler</Button>
            <Button type="submit" disabled={busy || !result.balanced}>{busy ? "Enregistrement…" : "Enregistrer le brouillon"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { EntryEditor };
