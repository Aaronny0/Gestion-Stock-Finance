"use client";
import { useState } from "react";
import { Alert, Field, Modal, Money } from "./ui";
import { useWorkspace, useUnsavedChanges } from "./provider";
import {
  quoteReturn,
  returnedQuantity,
  type ReturnSelection,
} from "./operations";
import { paymentMethods, type Sale } from "./types";
export default function ReturnForm({
  sale,
  onClose,
}: {
  sale: Sale;
  onClose: () => void;
}) {
  const { command } = useWorkspace();
  const [lines, setLines] = useState<ReturnSelection[]>(
    sale.lines.map((_, lineIndex) => ({
      lineIndex,
      quantity: 0,
      restock: true,
    })),
  );
  const [reason, setReason] = useState(""),
    [method, setMethod] = useState("Espèces"),
    [review, setReview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const discard = useUnsavedChanges(
    !!reason || lines.some((l) => l.quantity > 0),
    "Retour client",
  );
  const selected = lines.filter((l) => l.quantity > 0);
  let quote: ReturnType<typeof quoteReturn> | undefined;
  try {
    quote = quoteReturn(sale, selected);
  } catch {}
  const close = () => {
    if (!busy && discard()) onClose();
  };
  return (
    <Modal title={`Retour · ${sale.reference}`} onClose={close}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          if (busy) return;
          try {
            quoteReturn(sale, selected);
            if (!reason.trim()) throw new Error("Motif obligatoire.");
            if (!review) {
              setReview(true);
              return;
            }
            setBusy(true);
            await command("sale.return", {
              id: sale.id,
              lines: selected,
              reason,
              method,
            });
            onClose();
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-body workflow-list">
          <Alert>
            Les articles revendables retournent en stock. Les articles
            défectueux restent exclus du stock disponible. Le retour réduit
            d’abord le solde impayé, puis rembourse l’excédent.
          </Alert>
          {lines.map((line, index) => {
            const original = sale.lines[index],
              remaining = original.quantity - returnedQuantity(sale, index);
            return (
              remaining > 0 && (
                <div className="workflow-row" key={index}>
                  <strong>{original.label}</strong>
                  <p>{remaining} unité(s) encore retournable(s)</p>
                  <div className="form-grid">
                    <Field label="Quantité à retourner">
                      <input
                        aria-label={`Quantité retournée ${original.label}`}
                        type="number"
                        min="0"
                        max={remaining}
                        step="1"
                        disabled={review || busy}
                        value={line.quantity}
                        onChange={(e) =>
                          setLines((old) =>
                            old.map((l, i) =>
                              i === index
                                ? { ...l, quantity: Number(e.target.value) }
                                : l,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field label="État de l’article">
                      <select
                        disabled={review || busy}
                        value={line.restock ? "yes" : "no"}
                        onChange={(e) =>
                          setLines((old) =>
                            old.map((l, i) =>
                              i === index
                                ? { ...l, restock: e.target.value === "yes" }
                                : l,
                            ),
                          )
                        }
                      >
                        <option value="yes">
                          Revendable · remettre en stock
                        </option>
                        <option value="no">
                          Défectueux · ne pas remettre en stock
                        </option>
                      </select>
                    </Field>
                  </div>
                </div>
              )
            );
          })}
          <Field label="Motif du retour">
            <textarea
              required
              disabled={review || busy}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          {!!quote?.cashRefund && (
            <Field label="Mode du remboursement">
              <select
                value={method}
                disabled={review || busy}
                onChange={(e) => setMethod(e.target.value)}
              >
                {paymentMethods.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
          )}
          {quote && (
            <div className="impact-summary">
              <span>
                Valeur retournée
                <strong>
                  <Money value={quote.amount} />
                </strong>
              </span>
              <span>
                Créance réduite
                <strong>
                  <Money value={quote.creditReduction} />
                </strong>
              </span>
              <span>
                À rembourser
                <strong>
                  <Money value={quote.cashRefund} />
                </strong>
              </span>
            </div>
          )}
          {review && (
            <Alert>
              Vérifiez les quantités, l’état et les montants avant confirmation.
              Le retour sera conservé dans l’historique.
            </Alert>
          )}
          {error && <Alert error>{error}</Alert>}
        </div>
        <div className="modal-foot">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={() => (review ? setReview(false) : close())}
          >
            {review ? "Modifier" : "Annuler"}
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={busy || !quote}
          >
            {busy
              ? "Enregistrement…"
              : review
                ? "Confirmer le retour"
                : "Vérifier le retour"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
