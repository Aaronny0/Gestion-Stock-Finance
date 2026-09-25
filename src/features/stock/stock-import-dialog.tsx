"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUnsavedChanges, useWorkspace } from "@/frontend/provider";

const fields = [
  ["brand", "Marque"],
  ["model", "Modèle"],
  ["quantity", "Quantité"],
  ["cost", "Coût unitaire"],
  ["price", "Prix de vente"],
  ["variant", "Variante"],
] as const;

type ImportRow = Record<string, unknown> & { id: string; line: number; error: string };

function downloadCsv(rows: Record<string, unknown>[], name: string) {
  const columns = Object.keys(rows[0] ?? {});
  const content = "\uFEFF" + [columns, ...rows.map((row) => columns.map((key) => row[key] ?? ""))].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name}.csv`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function StockImportDialog({ onClose }: { onClose: () => void }) {
  const { command } = useWorkspace();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const discard = useUnsavedChanges(rows.length > 0, "Import de stock");
  const mapped: ImportRow[] = rows.map((row, index) => {
    const value = Object.fromEntries(fields.map(([key]) => [key, row[mapping[key]] ?? ""]));
    const errors: string[] = [];
    if (!value.brand || !value.model) errors.push("Marque et modèle requis");
    if (!Number.isInteger(Number(value.quantity)) || Number(value.quantity) < 1) errors.push("Quantité entière positive requise");
    if (!Number.isFinite(Number(value.cost)) || Number(value.cost) < 0) errors.push("Coût invalide");
    if (!Number.isFinite(Number(value.price)) || Number(value.price) < 0) errors.push("Prix invalide");
    return { ...value, id: String(index), line: index + 2, error: errors.join(" · ") };
  });
  const invalid = mapped.filter((row) => row.error);
  const close = () => { if (!busy && discard()) onClose(); };

  const previewColumns: ColumnDef<ImportRow>[] = [
    { accessorKey: "line", header: "Ligne" },
    { accessorKey: "brand", header: "Marque" },
    { accessorKey: "model", header: "Modèle" },
    { accessorKey: "quantity", header: "Quantité" },
    { accessorKey: "cost", header: "Coût" },
    { accessorKey: "error", header: "Erreurs", cell: ({ row }) => row.original.error ? <span className="text-destructive">{row.original.error}</span> : <span className="text-success">Valide</span> },
  ];

  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer un arrivage CSV / Excel</DialogTitle>
          <DialogDescription>Maximum 5 Mo et 2 000 lignes. L’import reste atomique : aucune ligne n’est enregistrée tant que la validation contient une erreur.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2" aria-label="Étapes de l'import">
          {["Fichier", "Colonnes", "Validation"].map((label, index) => <div key={label} className={`rounded-md border px-3 py-2 text-center text-xs font-semibold ${step === index ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground"}`}>{index + 1}. {label}</div>)}
        </div>

        {step === 0 ? (
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="stock-import-file">Fichier CSV ou XLSX</Label><Input id="stock-import-file" type="file" accept=".csv,.xlsx" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setError("");
              try {
                if (file.size > 5 * 1024 * 1024) throw new Error("Fichier trop volumineux (5 Mo maximum).");
                const XLSX = await import("xlsx");
                const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
                const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
                if (!data.length || data.length > 2000) throw new Error("Le fichier doit contenir entre 1 et 2 000 lignes.");
                setRows(data);
                setMapping(Object.fromEntries(fields.map(([key, label]) => [key, Object.keys(data[0]).find((column) => column.toLowerCase() === key || column.toLowerCase() === label.toLowerCase()) ?? ""])));
                setStep(1);
              } catch (caught) { setError((caught as Error).message); }
            }} /></div>
            <Button variant="outline" onClick={() => downloadCsv([{ brand: "Samsung", model: "Galaxy A55", quantity: 2000, cost: 155000, price: 215000, variant: "128 Go" }], "modèle-import-stock")}><Download /> Télécharger un modèle CSV</Button>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map(([key, label]) => <div className="space-y-1.5" key={key}><Label>{label}</Label><Select value={mapping[key] || "none"} onValueChange={(value) => setMapping({ ...mapping, [key]: value === "none" ? "" : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Non renseigné</SelectItem>{Object.keys(rows[0] ?? {}).map((column) => <SelectItem value={column} key={column}>{column}</SelectItem>)}</SelectContent></Select></div>)}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className={`rounded-md border p-3 text-sm ${invalid.length ? "border-destructive/20 bg-destructive-background text-destructive" : "border-success/20 bg-success-background text-success"}`}>{mapped.length} lignes · {invalid.length} ligne(s) invalide(s). {invalid.length ? "Corrigez les erreurs avant de confirmer." : "Le fichier peut être importé."}</div>
            <DataTable name="prévisualisation-import" data={mapped} columns={previewColumns} getRowId={(row) => row.id} density="dense" pageSize={8} enableColumnVisibility={false} />
            {invalid.length ? <Button variant="outline" onClick={() => downloadCsv(invalid, "erreurs-import")}><FileSpreadsheet /> Rapport d’erreurs</Button> : null}
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => step ? setStep(step - 1) : close()}>Retour</Button>
          {step === 1 ? <Button onClick={() => setStep(2)}>Valider les lignes</Button> : null}
          {step === 2 ? <Button disabled={busy || !!invalid.length} onClick={async () => {
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              await command("stock.import", { rows: mapped.map((row) => Object.fromEntries(fields.map(([key]) => [key, row[key]]))) });
              onClose();
            } catch (caught) { setError((caught as Error).message); } finally { setBusy(false); }
          }}><Upload /> {busy ? "Import en cours…" : "Confirmer l’import"}</Button> : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { StockImportDialog };
