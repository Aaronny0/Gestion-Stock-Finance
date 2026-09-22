"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiPlus,
  FiMinus,
  FiShoppingBag,
  FiTrash2,
  FiArrowRight,
  FiPrinter,
} from "react-icons/fi";
import { useWorkspace, useUnsavedChanges } from "./provider";
import {
  Alert,
  Badge,
  ConfirmDialog,
  Field,
  Modal,
  Money,
  PageHeading,
} from "./ui";
import { ActionForm } from "./forms";
import { request } from "./api";
import { belowCostLines, cashSettlement, salePosition } from "./operations";
import { decimals, minor } from "./accounting";
import { paymentMethods, type Sale, type SaleLine } from "./types";
export function Receipt({
  sale,
  onClose,
}: {
  sale: Sale;
  onClose: () => void;
}) {
  const { snapshot, demo } = useWorkspace();
  return (
    <Modal title={`Reçu ${sale.reference}`} onClose={onClose}>
      <div className="receipt modal-body">
        <div className="receipt-brand">
          vortex<span>STOCK & FINANCE</span>
        </div>
        <h2>{snapshot!.session.organization.name}</h2>
        <p>
          {snapshot!.session.stores.find((s) => s.id === sale.storeId)?.name}
        </p>
        {demo && <Badge value="Démonstration · sans valeur fiscale" />}
        <hr />
        <div className="receipt-meta">
          <span>{sale.reference}</span>
          <span>{new Date(sale.date).toLocaleDateString("fr-FR")}</span>
        </div>
        {sale.lines.map((l, i) => (
          <div className="receipt-line" key={i}>
            <span>
              {l.label}
              <small>
                {l.quantity} × <Money value={l.price} />
                {l.imei && ` · IMEI ${l.imei}`}
              </small>
            </span>
            <Money value={l.price * l.quantity} />
          </div>
        ))}
        <div className="receipt-line">
          <span>Remise</span>
          <Money value={sale.discount} />
        </div>
        <div className="receipt-total">
          <span>Total</span>
          <Money value={sale.total} />
        </div>
        <div className="receipt-line">
          <span>Payé{sale.tradeValue ? " (dont valeur de reprise)" : ""}</span>
          <Money value={sale.paid} />
        </div>
        <div className="receipt-line">
          <span>Reste dû</span>
          <Money value={salePosition(sale).due} />
        </div>
        {!!sale.cashTendered && (
          <div className="receipt-line">
            <span>Espèces remises / monnaie rendue</span>
            <span>
              <Money value={sale.cashTendered} /> /{" "}
              <Money value={sale.cashChange ?? 0} />
            </span>
          </div>
        )}
        {!!sale.returns?.length && (
          <div className="receipt-line">
            <span>Retours / montant net après retours</span>
            <span>
              <Money value={salePosition(sale).refunded} /> /{" "}
              <Money value={salePosition(sale).netTotal} />
            </span>
          </div>
        )}
        <p>Merci de votre confiance.</p>
        {snapshot!.session.organization.fiscalEnabled && (
          <Alert>Statut fiscal : en attente de normalisation.</Alert>
        )}
      </div>
      <div className="modal-foot">
        <button className="button secondary" onClick={onClose}>
          Fermer
        </button>
        <button className="button primary" onClick={() => window.print()}>
          <FiPrinter />
          Imprimer / PDF
        </button>
      </div>
    </Modal>
  );
}
export default function POS() {
  const { snapshot, storeId, can, command, href, demo } = useWorkspace();
  const db = snapshot!.data,
    currency = snapshot!.session.organization.currency;
  const [search, setSearch] = useState(""),
    [brand, setBrand] = useState("Toutes"),
    [lines, setLines] = useState<SaleLine[]>([]),
    [discount, setDiscount] = useState("0"),
    [client, setClient] = useState(""),
    [method, setMethod] = useState("Espèces"),
    [credit, setCredit] = useState(false),
    [paid, setPaid] = useState("0"),
    [split, setSplit] = useState(false),
    [secondMethod, setSecondMethod] = useState("Mobile Money"),
    [secondAmount, setSecondAmount] = useState("0"),
    [imei, setImei] = useState(false),
    [cashTendered, setCashTendered] = useState(""),
    [dueDate, setDueDate] = useState(""),
    [priceOverrideReason, setPriceOverrideReason] = useState(""),
    [requiresApproval, setRequiresApproval] = useState(false),
    [quoting, setQuoting] = useState(false),
    [confirm, setConfirm] = useState(false),
    [error, setError] = useState(""),
    [receipt, setReceipt] = useState<Sale | null>(null),
    [addingClient, setAddingClient] = useState(false);
  useUnsavedChanges(lines.length > 0, "Panier de vente");
  const searchRef = useRef<HTMLInputElement>(null);
  const total = Math.max(
    0,
    lines.reduce((s, l) => s + l.price * l.quantity, 0) -
      minor(discount || 0, currency),
  );
  const paidAmount = credit ? minor(paid || 0, currency) : total;
  const parts = split
    ? [
        { method, amount: paidAmount - minor(secondAmount || 0, currency) },
        { method: secondMethod, amount: minor(secondAmount || 0, currency) },
      ]
    : [{ method, amount: paidAmount }];
  const cashDue = parts
    .filter((p) => p.method === "Espèces")
    .reduce((sum, p) => sum + p.amount, 0);
  const tendered =
    cashTendered === "" ? Math.max(0, cashDue) : minor(cashTendered, currency);
  const loss =
    demo &&
    belowCostLines(
      lines.map((l) => ({
        ...l,
        cost: db.products.find((p) => p.id === l.productId)?.cost,
      })),
      minor(discount || 0, currency),
    ).length > 0;
  const products = db.products.filter(
    (p) =>
      p.storeId === storeId &&
      p.active &&
      p.quantity > 0 &&
      (brand === "Toutes" || p.brand === brand) &&
      `${p.brand} ${p.model} ${p.variant} ${p.imei ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const changeQuantity = (productId: string, delta: number) =>
    setLines((prev) =>
      prev
        .map((l) =>
          l.productId === productId
            ? {
                ...l,
                quantity: Math.min(
                  db.products.find((p) => p.id === productId)?.quantity ?? 0,
                  l.quantity + delta,
                ),
              }
            : l,
        )
        .filter((l) => l.quantity > 0),
    );
  const add = (productId: string) => {
    const p = db.products.find((p) => p.id === productId)!;
    if (lines.some((l) => l.productId === productId)) {
      changeQuantity(productId, 1);
      return;
    }
    setLines([
      ...lines,
      {
        productId,
        label: `${p.brand} ${p.model}`,
        brand: p.brand,
        quantity: 1,
        price: p.price,
      },
    ]);
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "F8") {
        e.preventDefault();
        document.getElementById("checkout")?.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const validate = async () => {
    if (quoting) return;
    setError("");
    if (!lines.length) {
      setError("Ajoutez au moins un produit.");
      return;
    }
    if (credit && !client) {
      setError("Choisissez un client pour la vente à crédit.");
      return;
    }
    if (split && minor(secondAmount || 0, currency) > paidAmount) {
      setError("La répartition dépasse le montant payé.");
      return;
    }
    if (paidAmount > total) {
      setError("Le paiement dépasse le total.");
      return;
    }
    if (imei && lines.some((l) => l.imei && l.quantity !== 1)) {
      setError("Un IMEI ne peut être affecté qu’à une seule unité.");
      return;
    }
    if (
      minor(discount || 0, currency) >
        lines.reduce((s, l) => s + l.price * l.quantity, 0) * 0.05 &&
      !can("sales.discount_above_limit")
    ) {
      setError("Votre remise est limitée à 5 %.");
      return;
    }
    try {
      cashSettlement(parts, tendered);
      let approval = loss;
      if (!demo) {
        setQuoting(true);
        const quote = await request<{ requiresApproval: boolean }>(
          "sales/quote",
          {
            method: "POST",
            body: JSON.stringify({
              storeId,
              organizationId: snapshot!.session.organization.id,
              lines,
              discount: minor(discount || 0, currency),
            }),
          },
        );
        approval = quote.requiresApproval;
        setRequiresApproval(approval);
      }
      if (approval && !can("sales.sell_below_cost"))
        throw new Error(
          "Prix insuffisant : demandez à un responsable de reprendre cette vente.",
        );
      if (approval && !priceOverrideReason.trim())
        throw new Error("Indiquez le motif de la vente sous le coût d’achat.");
      setConfirm(true);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setQuoting(false);
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="ESPACE DE VENTE"
        title="Une nouvelle vente."
        description="Sélectionnez vos articles, encaissez et c’est parti."
        action={
          <Link className="button secondary" href={href("/sales")}>
            Historique des ventes <FiArrowRight />
          </Link>
        }
      />
      <button
        className="mobile-cart-jump"
        onClick={() =>
          document
            .getElementById("cart")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      >
        <FiShoppingBag />
        Voir le panier ({lines.reduce((n, l) => n + l.quantity, 0)})
        <Money value={total} />
      </button>
      <fieldset className="pos-layout pos-workspace" disabled={quoting}>
        <section className="pos-catalog">
          <label className="search-input large">
            <FiSearch />
            <input
              ref={searchRef}
              aria-label="Rechercher un produit en caisse"
              placeholder="Rechercher un modèle, une marque, un IMEI…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && products.length === 1) {
                  e.preventDefault();
                  add(products[0].id);
                }
              }}
            />
            <kbd>F2</kbd>
          </label>
          <div className="tabs">
            {["Toutes", ...new Set(db.products.map((p) => p.brand))].map(
              (v) => (
                <button
                  className={brand === v ? "active" : ""}
                  key={v}
                  onClick={() => setBrand(v)}
                >
                  {v}
                </button>
              ),
            )}
          </div>
          <div className="product-grid">
            {products.map((p, i) => (
              <button
                className="product-card"
                key={p.id}
                onClick={() => add(p.id)}
              >
                <span className={`product-art tone-${i % 4}`}>
                  <span className="phone-shape">
                    <i />
                    <b>{p.brand === "Apple" ? "●" : p.brand[0]}</b>
                  </span>
                  <span className="product-stock">{p.quantity} en stock</span>
                </span>
                <span className="product-brand">{p.brand}</span>
                <strong>{p.model}</strong>
                <small>{p.variant}</small>
                <span className="product-bottom">
                  <Money value={p.price} />
                  <span className="add-circle">
                    <FiPlus />
                  </span>
                </span>
              </button>
            ))}
          </div>
          {!products.length && (
            <Alert>Aucun produit disponible pour cette recherche.</Alert>
          )}
        </section>
        <aside id="cart" className="panel cart-panel">
          <div className="cart-heading">
            <h2>
              <FiShoppingBag />
              Panier
            </h2>
            <Badge
              value={`${lines.reduce((s, l) => s + l.quantity, 0)} article(s)`}
            />
          </div>
          <div className="cart-lines">
            {!lines.length ? (
              <div className="cart-empty">
                <FiShoppingBag />
                <h3>Prêt pour la prochaine vente</h3>
                <p>Ajoutez un produit depuis le catalogue.</p>
              </div>
            ) : (
              lines.map((l) => (
                <div className="cart-item" key={l.productId}>
                  <div>
                    <strong>{l.label}</strong>
                    <button
                      className="icon-button"
                      aria-label={`Retirer ${l.label}`}
                      onClick={() =>
                        setLines(
                          lines.filter((v) => v.productId !== l.productId),
                        )
                      }
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  <div>
                    <div className="quantity-control">
                      <button
                        aria-label={`Réduire ${l.label}`}
                        onClick={() => changeQuantity(l.productId, -1)}
                      >
                        <FiMinus />
                      </button>
                      <span>{l.quantity}</span>
                      <button
                        aria-label={`Augmenter ${l.label}`}
                        onClick={() => changeQuantity(l.productId, 1)}
                      >
                        <FiPlus />
                      </button>
                    </div>
                    {can("sales.change_price") ? (
                      <label className="price-edit">
                        <span className="sr-only">Prix de {l.label}</span>
                        <input
                          type="number"
                          min="0"
                          step={1 / 10 ** decimals(currency)}
                          value={l.price / 10 ** decimals(currency)}
                          onChange={(e) =>
                            setLines(
                              lines.map((v) =>
                                v.productId === l.productId
                                  ? {
                                      ...v,
                                      price: minor(e.target.value, currency),
                                    }
                                  : v,
                              ),
                            )
                          }
                        />
                      </label>
                    ) : (
                      <Money value={l.price} />
                    )}
                  </div>
                  {imei && (
                    <Field label="IMEI unique · facultatif">
                      <input
                        value={l.imei ?? ""}
                        onChange={(e) =>
                          setLines(
                            lines.map((v) =>
                              v.productId === l.productId
                                ? { ...v, imei: e.target.value }
                                : v,
                            ),
                          )
                        }
                      />
                    </Field>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="cart-options">
            <Field label="Client" required={credit}>
              <select
                value={client}
                onChange={(e) => setClient(e.target.value)}
              >
                <option value="">Client de passage</option>
                {db.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <button
              className="text-button"
              onClick={() => setAddingClient(true)}
            >
              <FiPlus />
              Nouveau client
            </button>
            <div className="form-grid">
              <Field
                label={`Remise (${currency})`}
                hint={
                  can("sales.discount_above_limit")
                    ? "Selon votre autorisation"
                    : "Plafond : 5 %"
                }
              >
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </Field>
              <Field label="Paiement">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  {paymentMethods.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
            </div>
            <label className="check-field">
              <input
                type="checkbox"
                checked={credit}
                onChange={(e) => setCredit(e.target.checked)}
              />
              Vente à crédit / paiement partiel
            </label>
            {credit && (
              <Field label={`Montant payé (${currency})`}>
                <input
                  type="number"
                  min="0"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                />
              </Field>
            )}
            {credit && (
              <Field label="Échéance du solde (facultative)">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Field>
            )}
            {snapshot!.session.organization.splitPayments && (
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={split}
                  onChange={(e) => setSplit(e.target.checked)}
                />
                Répartir entre deux modes de paiement
              </label>
            )}
            {split && (
              <div className="form-grid">
                <Field label="Second mode">
                  <select
                    value={secondMethod}
                    onChange={(e) => setSecondMethod(e.target.value)}
                  >
                    {paymentMethods
                      .filter((m) => m !== method)
                      .map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                  </select>
                </Field>
                <Field label={`Montant second mode (${currency})`}>
                  <input
                    type="number"
                    min="0"
                    value={secondAmount}
                    onChange={(e) => setSecondAmount(e.target.value)}
                  />
                </Field>
              </div>
            )}
            {cashDue > 0 && (
              <>
                <Field
                  label={`Espèces remises (${currency})`}
                  hint="Laissez vide si le client donne le montant exact."
                >
                  <input
                    type="number"
                    min="0"
                    value={cashTendered}
                    placeholder={String(cashDue / 10 ** decimals(currency))}
                    onChange={(e) => setCashTendered(e.target.value)}
                  />
                </Field>
                <div className="money-change">
                  Monnaie à rendre :{" "}
                  <Money value={Math.max(0, tendered - cashDue)} />
                </div>
              </>
            )}
            {(loss || requiresApproval) && (
              <>
                <Alert>
                  Le prix net est inférieur au coût d’achat. Une permission
                  responsable et un motif sont nécessaires.
                </Alert>
                {can("sales.sell_below_cost") && (
                  <Field label="Motif de la vente sous le coût d’achat">
                    <textarea
                      value={priceOverrideReason}
                      onChange={(e) => setPriceOverrideReason(e.target.value)}
                    />
                  </Field>
                )}
              </>
            )}
            <label className="check-field">
              <input
                type="checkbox"
                checked={imei}
                onChange={(e) => setImei(e.target.checked)}
              />
              Suivre une unité par IMEI (facultatif)
            </label>
          </div>
          <div className="cart-checkout">
            <div>
              <span>Total à payer</span>
              <strong>
                <Money value={total} />
              </strong>
            </div>
            {split && (
              <p>
                {method} :{" "}
                <Money
                  value={paidAmount - minor(secondAmount || 0, currency)}
                />{" "}
                · {secondMethod} :{" "}
                <Money value={minor(secondAmount || 0, currency)} />
              </p>
            )}
            {credit && (
              <p>
                Reste dû : <Money value={total - paidAmount} />
              </p>
            )}
            {error && <Alert error>{error}</Alert>}
            <button
              id="checkout"
              className="button primary full"
              disabled={!lines.length || storeId === "all"}
              onClick={validate}
            >
              Encaisser <FiArrowRight />
              <kbd>F8</kbd>
            </button>
            <small>Confirmation avant enregistrement</small>
          </div>
        </aside>
      </fieldset>
      {addingClient && (
        <ActionForm
          type="client.save"
          title="Nouveau client"
          onClose={() => setAddingClient(false)}
        />
      )}{" "}
      {confirm && (
        <ConfirmDialog
          title="Confirmer l’encaissement"
          onClose={() => setConfirm(false)}
          onConfirm={async () => {
            const result = await command("sale.create", {
              lines: lines.map((l) => ({
                ...l,
                imei: imei ? l.imei : undefined,
              })),
              discount: minor(discount || 0, currency),
              clientId: client,
              method,
              paid: paidAmount,
              cashTendered: tendered,
              dueDate: credit ? dueDate : undefined,
              priceOverrideReason,
              ...(split
                ? {
                    payments: [
                      {
                        method,
                        amount: paidAmount - minor(secondAmount || 0, currency),
                      },
                      {
                        method: secondMethod,
                        amount: minor(secondAmount || 0, currency),
                      },
                    ],
                  }
                : {}),
            });
            if (result.sale) setReceipt(result.sale);
            setLines([]);
            setCashTendered("");
            setDueDate("");
            setPriceOverrideReason("");
            setRequiresApproval(false);
            setDiscount("0");
            setPaid("0");
            setCredit(false);
            setClient("");
            setSplit(false);
            setSecondAmount("0");
          }}
        >
          {cashDue > 0 && (
            <p>
              Espèces remises : <Money value={tendered} /> · Monnaie à rendre :{" "}
              <Money value={tendered - cashDue} />
            </p>
          )}
          <div className="impact-summary">
            <span>
              Total
              <strong>
                <Money value={total} />
              </strong>
            </span>
            <span>
              Payé · {method}
              <strong>
                <Money value={paidAmount} />
              </strong>
            </span>
            <span>
              Reste dû
              <strong>
                <Money value={total - paidAmount} />
              </strong>
            </span>
          </div>
        </ConfirmDialog>
      )}
      {receipt && <Receipt sale={receipt} onClose={() => setReceipt(null)} />}
    </>
  );
}
