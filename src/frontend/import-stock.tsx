"use client";
import { useState } from "react";
import { useWorkspace, useUnsavedChanges } from "./provider";
import { Alert, DataTable, Field, Modal, downloadCsv } from "./ui";
export default function ImportStock({ onClose }: { onClose: () => void }) {
  const { command } = useWorkspace();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [step, setStep] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const discard = useUnsavedChanges(rows.length > 0, "Import de stock");
  const fields = [
    ["brand", "Marque"],
    ["model", "Modèle"],
    ["quantity", "Quantité"],
    ["cost", "Coût unitaire"],
    ["price", "Prix de vente"],
    ["variant", "Variante"],
  ];
  const mapped = rows.map((r, i) => {
    const value = Object.fromEntries(
      fields.map(([key]) => [key, r[mapping[key]] ?? ""]),
    );
    const errors = [];
    if (!value.brand || !value.model) errors.push("Marque et modèle requis");
    if (!Number.isInteger(Number(value.quantity)) || Number(value.quantity) < 1)
      errors.push("Quantité entière positive requise");
    if (!Number.isFinite(Number(value.cost)) || Number(value.cost) < 0)
      errors.push("Coût invalide");
    if (!Number.isFinite(Number(value.price)) || Number(value.price) < 0)
      errors.push("Prix invalide");
    return { ...value, id: String(i), line: i + 2, error: errors.join(" · ") };
  });
  const invalid = mapped.filter((r) => r.error);
  return (
    <Modal
      title="Importer un arrivage CSV / Excel"
      onClose={() => {
        if (!busy && discard()) onClose();
      }}
    >
      <div className="modal-body">
        <div className="steps">
          {["Fichier", "Colonnes", "Validation"].map((s, i) => (
            <span key={s} className={step === i ? "active" : ""}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
        {step === 0 && (
          <>
            <Field
              label="Fichier CSV ou XLSX"
              hint="Maximum 5 Mo et 2 000 lignes. Une ligne peut contenir 2 000 unités, sans IMEI."
            >
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setError("");
                  try {
                    if (file.size > 5 * 1024 * 1024)
                      throw new Error(
                        "Fichier trop volumineux (5 Mo maximum).",
                      );
                    const XLSX = await import("xlsx");
                    const workbook = XLSX.read(await file.arrayBuffer(), {
                      type: "array",
                    });
                    const data = XLSX.utils.sheet_to_json<
                      Record<string, unknown>
                    >(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
                    if (!data.length || data.length > 2000)
                      throw new Error(
                        "Le fichier doit contenir entre 1 et 2 000 lignes.",
                      );
                    setRows(data);
                    setMapping(
                      Object.fromEntries(
                        fields.map(([key, label]) => [
                          key,
                          Object.keys(data[0]).find(
                            (k) =>
                              k.toLowerCase() === key ||
                              k.toLowerCase() === label.toLowerCase(),
                          ) ?? "",
                        ]),
                      ),
                    );
                    setStep(1);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              />
            </Field>
            <button
              className="text-button"
              onClick={() =>
                downloadCsv(
                  [
                    {
                      brand: "Samsung",
                      model: "Galaxy A55",
                      quantity: 2000,
                      cost: 155000,
                      price: 215000,
                      variant: "128 Go",
                    },
                  ],
                  "modèle-import-stock",
                )
              }
            >
              Télécharger un modèle CSV
            </button>
          </>
        )}
        {step === 1 && (
          <div className="form-grid">
            {fields.map(([key, label]) => (
              <Field key={key} label={label}>
                <select
                  value={mapping[key]}
                  onChange={(e) =>
                    setMapping({ ...mapping, [key]: e.target.value })
                  }
                >
                  <option value="">Non renseigné</option>
                  {Object.keys(rows[0] ?? {}).map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
            ))}
          </div>
        )}
        {step === 2 && (
          <>
            <Alert error={invalid.length > 0}>
              {mapped.length} lignes · {invalid.length} ligne(s) invalide(s).
              L’import est atomique : corrigez les erreurs avant de confirmer.
            </Alert>
            <DataTable
              name="prévisualisation-import"
              rows={mapped}
              columns={[
                { key: "line", label: "Ligne" },
                { key: "brand", label: "Marque" },
                { key: "model", label: "Modèle" },
                { key: "quantity", label: "Quantité" },
                { key: "cost", label: "Coût" },
                { key: "error", label: "Erreurs" },
              ]}
            />
            {invalid.length > 0 && (
              <button
                className="button secondary"
                onClick={() => downloadCsv(invalid, "erreurs-import")}
              >
                Rapport d’erreurs
              </button>
            )}
          </>
        )}
        {error && <Alert error>{error}</Alert>}
      </div>
      <div className="modal-foot">
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => (step ? setStep(step - 1) : onClose())}
        >
          Retour
        </button>
        {step === 1 && (
          <button className="button primary" onClick={() => setStep(2)}>
            Valider les lignes
          </button>
        )}
        {step === 2 && (
          <button
            className="button primary"
            disabled={busy || !!invalid.length}
            onClick={async () => {
              if (busy) return;
              setBusy(true);
              try {
                await command("stock.import", {
                  rows: mapped.map((r) =>
                    Object.fromEntries(
                      fields.map(([key]) => [key, r[key as keyof typeof r]]),
                    ),
                  ),
                });
                onClose();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Import en cours…" : "Confirmer l’import"}
          </button>
        )}
      </div>
    </Modal>
  );
}
