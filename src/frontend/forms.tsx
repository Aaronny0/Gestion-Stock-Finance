"use client";
import { ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import { salePosition } from "./operations";
import { useRef, useState, type ReactNode } from "react";
import { useWorkspace, useUnsavedChanges } from "./provider";
import { Alert, Field, Modal, Money } from "./ui";
import { decimals, minor } from "./accounting";
import { request } from "./api";
import { paymentMethods } from "./types";
type Spec = {
  key: string;
  label: string;
  kind?: "text" | "number" | "money" | "select" | "date" | "email" | "textarea";
  required?: boolean;
  options?: [string, string][];
  min?: number;
  hint?: string;
};
type PurchaseExtra = { productId: string; quantity: number; cost: string };
export function ActionForm({
  type,
  title,
  onClose,
  initial = {},
}: {
  type: string;
  title: string;
  onClose: () => void;
  initial?: Record<string, unknown>;
}) {
  const { snapshot, storeId, command, demo } = useWorkspace();
  const db = snapshot!.data,
    currency = snapshot!.session.organization.currency;
  const products = db.products.filter((p) => p.storeId === storeId && p.active);
  const opts = {
    products: products.map(
      (p) =>
        [
          p.id,
          `${p.brand} ${p.model} · ${p.variant} (${p.quantity} en stock)`,
        ] as [string, string],
    ),
    suppliers: db.suppliers.map((s) => [s.id, s.label] as [string, string]),
    clients: db.clients.map((s) => [s.id, s.label] as [string, string]),
    stores: snapshot!.session.stores
      .filter((s) => s.id !== storeId && s.active)
      .map((s) => [s.id, s.name] as [string, string]),
  };
  const f = (
    key: string,
    label: string,
    kind: Spec["kind"] = "text",
    required = true,
    options?: [string, string][],
  ): Spec => ({ key, label, kind, required, options });
  const product = f("productId", "Produit", "select", true, opts.products),
    quantity = { ...f("quantity", "Quantité", "number"), min: 1 },
    cost = f("cost", `Coût unitaire (${currency})`, "money"),
    method = f(
      "method",
      "Mode de paiement",
      "select",
      true,
      paymentMethods.map((v) => [v, v]),
    ),
    client = f("clientId", "Client", "select", false, opts.clients),
    reason = f("reason", "Motif / commentaire", "textarea"),
    date = f("date", "Date", "date");
  const device = [
    f("brand", "Marque"),
    f("model", "Modèle"),
    f("variant", "Variante / stockage / couleur", undefined, false),
    f("condition", "État", "select", true, [
      ["Neuf", "Neuf"],
      ["Occasion", "Occasion"],
      ["Reconditionné", "Reconditionné"],
    ]),
    f("value", `Valeur de reprise (${currency})`, "money"),
    f("price", `Prix de revente proposé (${currency})`, "money", false),
    f("imei", "IMEI unique · facultatif", undefined, false),
  ];
  const configs: Record<string, Spec[]> = {
    "product.save": [
      f("brand", "Marque"),
      f("model", "Modèle"),
      f("variant", "Variante", undefined, false),
      f("condition", "État", "select", true, [
        ["Neuf", "Neuf"],
        ["Occasion", "Occasion"],
        ["Reconditionné", "Reconditionné"],
      ]),
      f("price", `Prix de vente (${currency})`, "money", false),
      f("threshold", "Seuil d’alerte", "number", false),
      f("reorderTarget", "Stock cible de réapprovisionnement", "number", false),
      f("supplierId", "Fournisseur habituel", "select", false, opts.suppliers),
    ],
    "stock.entry": [
      product,
      quantity,
      cost,
      f("imei", "IMEI d’une unité suivie · facultatif", undefined, false),
      { ...reason, required: false },
    ],
    "stock.adjust": [
      product,
      { ...quantity, label: "Quantité réellement comptée", min: 0 },
      reason,
    ],
    "stock.transfer": [
      product,
      f("destination", "Boutique de destination", "select", true, opts.stores),
      quantity,
      reason,
    ],
    "product.archive": [product, reason],
    "trade.create": [...device, product, client, method],
    "buyback.create": [...device, client, method],
    "purchase.create": [
      f("supplierId", "Fournisseur", "select", true, opts.suppliers),
      f("reference", "Référence facture", undefined, false),
      date,
      product,
      quantity,
      cost,
      f("paid", `Payé maintenant (${currency})`, "money"),
      method,
      f("dueDate", "Échéance", "date", false),
    ],
    "supplier.save": [
      f("label", "Nom du fournisseur"),
      f("phone", "Téléphone", undefined, false),
      f("email", "Email", "email", false),
    ],
    "client.save": [
      f("label", "Nom du client"),
      f("phone", "Téléphone", undefined, false),
      f("email", "Email", "email", false),
    ],
    "expense.create": [
      f("label", "Libellé"),
      f(
        "category",
        "Catégorie",
        "select",
        true,
        [
          "Loyer",
          "Transport",
          "Salaires",
          "Internet",
          "Électricité",
          "Marketing",
          "Maintenance",
          "Frais bancaires",
          "Autres",
        ].map((v) => [v, v]),
      ),
      f(
        "account",
        "Compte de charge",
        "select",
        true,
        db.accounts
          .filter((a) => a.active && a.type === "expense")
          .map((a) => [a.number, `${a.number} · ${a.name}`]),
      ),
      f("amount", `Montant (${currency})`, "money"),
      method,
      date,
    ],
    "payment.create": [
      f("sourceId", "Créance client ou dette fournisseur", "select", true, [
        ...db.sales
          .filter((s) => s.storeId === storeId && salePosition(s).due > 0)
          .map((s) => [s.id, `${s.reference} · client`] as [string, string]),
        ...db.purchases
          .filter(
            (s) => s.storeId === storeId && (s.amount ?? 0) > (s.paid ?? 0),
          )
          .map((s) => [s.id, `${s.label} · fournisseur`] as [string, string]),
      ]),
      f("amount", `Montant du règlement (${currency})`, "money"),
      method,
      date,
    ],
    "expense.reverse": [reason],
    "entry.reverse": [date, reason],
    "cash.open": [f("amount", `Solde initial compté (${currency})`, "money")],
    "cash.close": [
      f("amount", `Espèces comptées (${currency})`, "money"),
      { ...reason, required: false },
    ],
    "cash.movement": [
      f("direction", "Sens du mouvement", "select", true, [
        ["in", "Entrée"],
        ["out", "Sortie"],
      ]),
      f("amount", `Montant (${currency})`, "money"),
      method,
      reason,
    ],
    "account.save": [
      f("number", "Numéro de compte"),
      f("label", "Nom du compte"),
      f("accountType", "Type", "select", true, [
        ["asset", "Actif"],
        ["liability", "Passif"],
        ["equity", "Capitaux propres"],
        ["income", "Produit"],
        ["expense", "Charge"],
      ]),
      f("normal", "Sens normal", "select", true, [
        ["debit", "Débit"],
        ["credit", "Crédit"],
      ]),
    ],
  };
  const fields = configs[type] ?? [];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((s) => [
        s.key,
        initial[s.key] !== undefined
          ? String(
              s.kind === "money"
                ? Number(initial[s.key]) / 10 ** decimals(currency)
                : initial[s.key],
            )
          : s.kind === "date"
            ? new Date().toISOString().slice(0, 10)
            : s.kind === "select" && s.required
              ? (s.options?.[0]?.[0] ?? "")
              : s.kind === "number"
                ? s.key === "reorderTarget"
                  ? ""
                  : "1"
                : s.kind === "money"
                  ? "0"
                  : "",
      ]),
    ),
  );
  const [extras, setExtras] = useState<PurchaseExtra[]>([]);
  const [file, setFile] = useState<File | null>(null),
    [review, setReview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [reconciledMethods, setReconciledMethods] = useState<string[]>([]);
  const cashSession = db.cash.find(
    (c) => c.storeId === storeId && c.status === "open",
  );
  const sessionPayments = db.payments.filter(
    (p) =>
      p.storeId === storeId &&
      p.date >= String(cashSession?.openedAt ?? "9999"),
  );
  const cashExpected =
    Number(cashSession?.opening ?? 0) +
    sessionPayments
      .filter((p) => p.method === "Espèces")
      .reduce((n, p) => n + (p.direction === "in" ? p.amount : -p.amount), 0);
  const nonCashMethods = [
    ...new Set(
      sessionPayments
        .filter((p) => p.method !== "Espèces")
        .map((p) => p.method),
    ),
  ];
  const signature = JSON.stringify({
    values,
    extras,
    reconciledMethods,
  });
  const original = useRef(signature);
  const discard = useUnsavedChanges(
    signature !== original.current || !!file,
    title,
  );
  const close = () => {
    if (!busy && discard()) onClose();
  };
  const data = () => ({
    ...initial,
    ...(type === "cash.close" ? { reconciledMethods } : {}),
    ...Object.fromEntries(
      fields.map((s) => [
        s.key,
        s.kind === "money"
          ? minor(values[s.key] || 0, currency)
          : s.kind === "number"
            ? s.key === "reorderTarget" && !values[s.key]
              ? undefined
              : Number(values[s.key] || 0)
            : values[s.key],
      ]),
    ),
    ...(type === "purchase.create"
      ? {
          lines: [
            {
              productId: values.productId,
              quantity: Number(values.quantity),
              cost: minor(values.cost || 0, currency),
            },
            ...extras.map((l) => ({
              ...l,
              cost: minor(l.cost || 0, currency),
            })),
          ],
        }
      : {}),
  });
  const selected = products.find((p) => p.id === values.productId);
  const total =
    Number(values.quantity || 0) * minor(values.cost || 0, currency) +
    extras.reduce(
      (sum, l) => sum + l.quantity * minor(l.cost || 0, currency),
      0,
    );
  const paid = minor(values.paid || 0, currency);
  const cash = db.cash.find(
    (c) => c.storeId === storeId && c.status === "open",
  );
  const theoretical = cash
    ? Number(cash.opening) +
      db.payments
        .filter(
          (p) =>
            p.storeId === storeId &&
            p.method === "Espèces" &&
            p.date >= String(cash.openedAt),
        )
        .reduce((s, p) => s + (p.direction === "in" ? p.amount : -p.amount), 0)
    : 0;
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const payload: Record<string, unknown> = data();
      if (file) {
        if (demo) payload.attachmentName = file.name;
        else {
          const upload = await request<{
            uploadUrl: string;
            documentId: string;
          }>("documents/upload-url", {
            method: "POST",
            body: JSON.stringify({
              name: file.name,
              size: file.size,
              mime: file.type,
              storeId,
            }),
          });
          const result = await fetch(upload.uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });
          if (!result.ok)
            throw new Error("Échec du transfert du justificatif.");
          payload.documentId = upload.documentId;
        }
      }
      await command(type, payload);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const impact: Record<string, ReactNode> = {
    "stock.entry": (
      <>
        <span>
          Quantité à recevoir<strong>{values.quantity || 0} unités</strong>
        </span>
        <span>
          Coût total
          <strong>
            <Money value={total} />
          </strong>
        </span>
      </>
    ),
    "purchase.create": (
      <>
        <span>
          Montant de l’achat
          <strong>
            <Money value={total} />
          </strong>
        </span>
        <span>
          Dette fournisseur
          <strong>
            <Money value={Math.max(0, total - paid)} />
          </strong>
        </span>
      </>
    ),
    "stock.adjust": (
      <>
        <span>
          Stock actuel<strong>{selected?.quantity ?? 0}</strong>
        </span>
        <span>
          Stock compté<strong>{values.quantity || 0}</strong>
        </span>
        <span>
          Écart
          <strong>
            {Number(values.quantity || 0) - (selected?.quantity ?? 0)}
          </strong>
        </span>
      </>
    ),
    "trade.create": (
      <>
        <span>
          Appareil boutique
          <strong>{selected?.model ?? "À sélectionner"}</strong>
        </span>
        <span>
          Complément à encaisser
          <strong>
            <Money
              value={
                (selected?.price ?? 0) - minor(values.value || 0, currency)
              }
            />
          </strong>
        </span>
      </>
    ),
    "buyback.create": (
      <>
        <span>
          Entrée en stock<strong>1 appareil</strong>
        </span>
        <span>
          Sortie de trésorerie
          <strong>
            <Money value={minor(values.value || 0, currency)} />
          </strong>
        </span>
      </>
    ),
    "cash.close": (
      <>
        <span>
          Montant théorique
          <strong>
            <Money value={theoretical} />
          </strong>
        </span>
        <span>
          Écart de caisse
          <strong>
            <Money value={minor(values.amount || 0, currency) - theoretical} />
          </strong>
        </span>
      </>
    ),
  };
  return (
    <Modal
      title={review ? `Confirmer · ${title}` : title}
      onClose={() => {
        close();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          try {
            if (
              type === "cash.close" &&
              nonCashMethods.some((m) => !reconciledMethods.includes(m))
            )
              throw new Error(
                "Vérifiez chaque mode de paiement avant la clôture.",
              );
            if (
              type === "cash.close" &&
              minor(values.amount || 0, currency) !== cashExpected &&
              !values.reason?.trim()
            )
              throw new Error(
                "Expliquez l’écart de caisse avant de continuer.",
              );
            if (type === "purchase.create" && paid > total)
              throw new Error("Le paiement dépasse le montant de l’achat.");
            if (
              type === "stock.entry" &&
              values.imei &&
              Number(values.quantity) !== 1
            )
              throw new Error(
                "Saisissez l’entrée sans IMEI pour plusieurs unités, puis suivez une unité séparément.",
              );
            if (
              type === "cash.close" &&
              minor(values.amount || 0, currency) !== theoretical &&
              !values.reason
            )
              throw new Error("Un commentaire est obligatoire en cas d’écart.");
            if (review) void submit();
            else setReview(true);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <div className="modal-body">
          <div className="context-note">
            {snapshot!.session.organization.name} <span>→</span>{" "}
            {snapshot!.session.stores.find((s) => s.id === storeId)?.name ??
              "Sélectionnez une boutique"}
          </div>
          {type === "cash.close" && (
            <div className="workflow-list">
              <Alert>
                1. Comptez les espèces. 2. Vérifiez les paiements électroniques.
                3. Expliquez tout écart avant confirmation.
              </Alert>
              <div className="impact-summary">
                <span>
                  Espèces théoriques
                  <strong>
                    <Money value={cashExpected} />
                  </strong>
                </span>
                <span>
                  Écart du comptage
                  <strong>
                    <Money
                      value={minor(values.amount || 0, currency) - cashExpected}
                    />
                  </strong>
                </span>
              </div>
              {nonCashMethods.map((m) => (
                <label className="check-field" key={m}>
                  <input
                    type="checkbox"
                    disabled={review || busy}
                    checked={reconciledMethods.includes(m)}
                    onChange={(e) =>
                      setReconciledMethods((old) =>
                        e.target.checked
                          ? [...old, m]
                          : old.filter((v) => v !== m),
                      )
                    }
                  />
                  {m} vérifié · net{" "}
                  <Money
                    value={sessionPayments
                      .filter((p) => p.method === m)
                      .reduce(
                        (n, p) =>
                          n + (p.direction === "in" ? p.amount : -p.amount),
                        0,
                      )}
                  />
                </label>
              ))}
            </div>
          )}
          {review ? (
            <>
              <dl className="review-list">
                {fields.map((s) => (
                  <div key={s.key}>
                    <dt>{s.label}</dt>
                    <dd>
                      {s.kind === "select" ? (
                        (s.options?.find((o) => o[0] === values[s.key])?.[1] ??
                        "—")
                      ) : s.kind === "money" ? (
                        <Money value={minor(values[s.key] || 0, currency)} />
                      ) : (
                        values[s.key] || "—"
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              {extras.map((line, index) => (
                <p key={index}>
                  {products.find((p) => p.id === line.productId)?.model} ·{" "}
                  {line.quantity} unités ·{" "}
                  <Money
                    value={line.quantity * minor(line.cost || 0, currency)}
                  />
                </p>
              ))}
              
              {file && <p>Justificatif : {file.name}</p>}
            </>
          ) : (
            <>
              <div className="form-grid">
                {fields.map((s) => (
                  <Field
                    key={s.key}
                    label={s.label}
                    required={s.required}
                    hint={s.hint}
                  >
                    {s.kind === "select" ? (
                      <select
                        required={s.required}
                        value={values[s.key]}
                        onChange={(e) =>
                          setValues({ ...values, [s.key]: e.target.value })
                        }
                      >
                        <option value="">Sélectionner…</option>
                        {s.options?.map(([v, l]) => (
                          <option value={v} key={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    ) : s.kind === "textarea" ? (
                      <textarea
                        required={s.required}
                        value={values[s.key]}
                        onChange={(e) =>
                          setValues({ ...values, [s.key]: e.target.value })
                        }
                      />
                    ) : (
                      <input
                        autoFocus={fields[0] === s}
                        type={
                          s.kind === "money" ? "number" : (s.kind ?? "text")
                        }
                        step={
                          s.kind === "money"
                            ? 1 / 10 ** decimals(currency)
                            : s.kind === "number"
                              ? 1
                              : undefined
                        }
                        min={
                          s.kind === "number" || s.kind === "money"
                            ? (s.min ?? 0)
                            : undefined
                        }
                        required={s.required}
                        value={values[s.key]}
                        onChange={(e) =>
                          setValues({ ...values, [s.key]: e.target.value })
                        }
                      />
                    )}
                  </Field>
                ))}
              </div>
              {type === "purchase.create" && (
                <>
                  {extras.map((line, index) => (
                    <fieldset key={index}>
                      <legend>Article supplémentaire {index + 1}</legend>
                      <div className="form-grid">
                        <Field label="Produit">
                          <select
                            required
                            value={line.productId}
                            onChange={(e) =>
                              setExtras(
                                extras.map((l, i) =>
                                  i === index
                                    ? { ...l, productId: e.target.value }
                                    : l,
                                ),
                              )
                            }
                          >
                            <option value="">Sélectionner…</option>
                            {opts.products.map(([id, label]) => (
                              <option key={id} value={id}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Quantité">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required
                            value={line.quantity}
                            onChange={(e) =>
                              setExtras(
                                extras.map((l, i) =>
                                  i === index
                                    ? { ...l, quantity: Number(e.target.value) }
                                    : l,
                                ),
                              )
                            }
                          />
                        </Field>
                        <Field label={`Coût unitaire (${currency})`}>
                          <input
                            type="number"
                            min="0"
                            required
                            value={line.cost}
                            onChange={(e) =>
                              setExtras(
                                extras.map((l, i) =>
                                  i === index
                                    ? { ...l, cost: e.target.value }
                                    : l,
                                ),
                              )
                            }
                          />
                        </Field>
                      </div>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          setExtras(extras.filter((_, i) => i !== index))
                        }
                      >
                        <Trash2 />
                        Retirer
                      </button>
                    </fieldset>
                  ))}
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() =>
                      setExtras([
                        ...extras,
                        { productId: "", quantity: 1, cost: "0" },
                      ])
                    }
                  >
                    <Plus />
                    Ajouter un article à l’achat
                  </button>
                  <p className="report-footnote">
                    Les quantités saisies seront réceptionnées dans la boutique
                    active.
                  </p>
                </>
              )}
              {type === "stock.entry" && (
                <Field label={`Ou saisir le coût total (${currency})`}>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={total / 10 ** decimals(currency)}
                    onChange={(e) => {
                      const q = Number(values.quantity);
                      if (q > 0)
                        setValues({
                          ...values,
                          cost: String(Number(e.target.value) / q),
                        });
                    }}
                  />
                </Field>
              )}
              
              
              {["purchase.create", "expense.create"].includes(type) && (
                <Field
                  label="Justificatif · facultatif"
                  hint={
                    demo
                      ? "Le fichier reste local en démonstration."
                      : "PDF ou image, 10 Mo maximum."
                  }
                >
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={(e) => {
                      const v = e.target.files?.[0];
                      if (v && v.size > 10 * 1024 * 1024) {
                        setError("Le justificatif dépasse 10 Mo.");
                        e.target.value = "";
                        setFile(null);
                      } else setFile(v ?? null);
                    }}
                  />
                </Field>
              )}
            </>
          )}
          {impact[type] && <div className="impact-summary">{impact[type]}</div>}
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
            className="button primary"
            disabled={busy || storeId === "all"}
          >
            {busy ? (
              "Enregistrement…"
            ) : review ? (
              <>
                <Check />
                Confirmer
              </>
            ) : (
              <>
                Vérifier <ArrowRight />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
