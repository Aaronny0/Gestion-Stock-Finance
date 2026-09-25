"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/data-display/empty-state";
import { ProductCard } from "@/features/pos/product-card";
import { ProductFilters } from "@/features/pos/product-filters";
import { ProductSearch } from "@/features/pos/product-search";
import { Cart } from "@/features/pos/cart";
import { MobileCartDrawer } from "@/features/pos/mobile-cart-drawer";
import { CheckoutConfirmation } from "@/features/pos/checkout-confirmation";
import { Receipt } from "@/features/pos/receipt";
import { useWorkspace, useUnsavedChanges } from "./provider";
import { ActionForm } from "./forms";
import { request } from "./api";
import { belowCostLines, cashSettlement } from "./operations";
import { minor } from "./accounting";
import { paymentMethods, type Sale, type SaleLine } from "./types";

export { Receipt } from "@/features/pos/receipt";

export default function POS() {
  const { snapshot, storeId, can, command, href, demo } = useWorkspace();
  const db = snapshot!.data;
  const currency = snapshot!.session.organization.currency;
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("Toutes");
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [discount, setDiscount] = useState("0");
  const [client, setClient] = useState("");
  const [method, setMethod] = useState("Espèces");
  const [credit, setCredit] = useState(false);
  const [paid, setPaid] = useState("0");
  const [split, setSplit] = useState(false);
  const [secondMethod, setSecondMethod] = useState("Mobile Money");
  const [secondAmount, setSecondAmount] = useState("0");
  const [imei, setImei] = useState(false);
  const [cashTendered, setCashTendered] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priceOverrideReason, setPriceOverrideReason] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [addingClient, setAddingClient] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  useUnsavedChanges(lines.length > 0, "Panier de vente");
  const searchRef = useRef<HTMLInputElement>(null);

  const discountMinor = minor(discount || 0, currency);
  const secondAmountMinor = minor(secondAmount || 0, currency);
  const total = Math.max(0, lines.reduce((sum, line) => sum + line.price * line.quantity, 0) - discountMinor);
  const paidAmount = credit ? minor(paid || 0, currency) : total;
  const parts = split
    ? [
        { method, amount: paidAmount - secondAmountMinor },
        { method: secondMethod, amount: secondAmountMinor },
      ]
    : [{ method, amount: paidAmount }];
  const cashDue = parts.filter((part) => part.method === "Espèces").reduce((sum, part) => sum + part.amount, 0);
  const tendered = cashTendered === "" ? Math.max(0, cashDue) : minor(cashTendered, currency);
  const loss = demo && belowCostLines(
    lines.map((line) => ({ ...line, cost: db.products.find((product) => product.id === line.productId)?.cost })),
    discountMinor,
  ).length > 0;

  const brands = useMemo(
    () => ["Toutes", ...Array.from(new Set(db.products.filter((product) => product.storeId === storeId && product.active).map((product) => product.brand))).sort()],
    [db.products, storeId],
  );

  const products = useMemo(() => {
    const query = search.trim().toLowerCase();
    return db.products.filter((product) =>
      product.storeId === storeId &&
      product.active &&
      product.quantity > 0 &&
      (brand === "Toutes" || product.brand === brand) &&
      (!query || `${product.brand} ${product.model} ${product.variant} ${product.imei ?? ""}`.toLowerCase().includes(query)),
    );
  }, [brand, db.products, search, storeId]);

  const changeQuantity = (productId: string, delta: number) => {
    setLines((previous) => previous
      .map((line) => line.productId === productId
        ? {
            ...line,
            quantity: Math.min(
              db.products.find((product) => product.id === productId)?.quantity ?? 0,
              line.quantity + delta,
            ),
          }
        : line)
      .filter((line) => line.quantity > 0));
  };

  const add = (productId: string) => {
    const product = db.products.find((item) => item.id === productId);
    if (!product) return;
    if (lines.some((line) => line.productId === productId)) {
      changeQuantity(productId, 1);
      return;
    }
    setLines((previous) => [...previous, {
      productId,
      label: `${product.brand} ${product.model}`,
      brand: product.brand,
      quantity: 1,
      price: product.price,
    }]);
  };

  const validate = async () => {
    if (quoting) return;
    setError("");
    if (!lines.length) {
      setError("Ajoutez au moins un produit.");
      setMobileCartOpen(true);
      return;
    }
    if (credit && !client) {
      setError("Choisissez un client pour la vente à crédit.");
      setMobileCartOpen(true);
      return;
    }
    if (split && secondAmountMinor > paidAmount) {
      setError("La répartition dépasse le montant payé.");
      setMobileCartOpen(true);
      return;
    }
    if (paidAmount > total) {
      setError("Le paiement dépasse le total.");
      setMobileCartOpen(true);
      return;
    }
    if (imei && lines.some((line) => line.imei && line.quantity !== 1)) {
      setError("Un IMEI ne peut être affecté qu’à une seule unité.");
      setMobileCartOpen(true);
      return;
    }
    if (discountMinor > lines.reduce((sum, line) => sum + line.price * line.quantity, 0) * 0.05 && !can("sales.discount_above_limit")) {
      setError("Votre remise est limitée à 5 %.");
      setMobileCartOpen(true);
      return;
    }

    try {
      cashSettlement(parts, tendered);
      let approval = loss;
      if (!demo) {
        setQuoting(true);
        const quote = await request<{ requiresApproval: boolean }>("sales/quote", {
          method: "POST",
          body: JSON.stringify({
            storeId,
            organizationId: snapshot!.session.organization.id,
            lines,
            discount: discountMinor,
          }),
        });
        approval = quote.requiresApproval;
        setRequiresApproval(approval);
      }
      if (approval && !can("sales.sell_below_cost")) {
        throw new Error("Prix insuffisant : demandez à un responsable de reprendre cette vente.");
      }
      if (approval && !priceOverrideReason.trim()) {
        throw new Error("Indiquez le motif de la vente sous le coût d’achat.");
      }
      setMobileCartOpen(false);
      setConfirm(true);
    } catch (validationError) {
      setError((validationError as Error).message);
      setMobileCartOpen(true);
    } finally {
      setQuoting(false);
    }
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "F8") {
        event.preventDefault();
        document.getElementById("checkout")?.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const removeLine = (productId: string) => setLines((previous) => previous.filter((line) => line.productId !== productId));
  const changePrice = (productId: string, value: string) => setLines((previous) => previous.map((line) => line.productId === productId ? { ...line, price: minor(value || 0, currency) } : line));
  const changeLineImei = (productId: string, value: string) => setLines((previous) => previous.map((line) => line.productId === productId ? { ...line, imei: value } : line));

  const sharedCartProps = {
    products: db.products,
    clients: db.clients,
    lines,
    currency,
    discount,
    onDiscountChange: setDiscount,
    client,
    onClientChange: setClient,
    onAddClient: () => setAddingClient(true),
    method,
    onMethodChange: (value: string) => {
      setMethod(value);
      if (value === secondMethod) {
        setSecondMethod(paymentMethods.find((candidate) => candidate !== value) ?? "Autre");
      }
    },
    methods: paymentMethods,
    credit,
    onCreditChange: setCredit,
    paid,
    onPaidChange: setPaid,
    dueDate,
    onDueDateChange: setDueDate,
    splitPaymentsEnabled: snapshot!.session.organization.splitPayments,
    split,
    onSplitChange: setSplit,
    secondMethod,
    onSecondMethodChange: setSecondMethod,
    secondAmount,
    secondAmountMinor,
    onSecondAmountChange: setSecondAmount,
    cashDue,
    cashTendered,
    onCashTenderedChange: setCashTendered,
    tendered,
    imei,
    onImeiChange: setImei,
    loss,
    requiresApproval,
    canSellBelowCost: can("sales.sell_below_cost"),
    priceOverrideReason,
    onPriceOverrideReasonChange: setPriceOverrideReason,
    canChangePrice: can("sales.change_price"),
    canDiscountAboveLimit: can("sales.discount_above_limit"),
    total,
    paidAmount,
    error,
    quoting,
    disabled: !lines.length || storeId === "all",
    onCheckout: () => void validate(),
    onQuantityChange: changeQuantity,
    onRemove: removeLine,
    onPriceChange: changePrice,
    onLineImeiChange: changeLineImei,
  };

  const completeSale = async () => {
    const result = await command("sale.create", {
      lines: lines.map((line) => ({ ...line, imei: imei ? line.imei : undefined })),
      discount: discountMinor,
      clientId: client,
      method,
      paid: paidAmount,
      cashTendered: tendered,
      dueDate: credit ? dueDate : undefined,
      priceOverrideReason,
      ...(split ? {
        payments: [
          { method, amount: paidAmount - secondAmountMinor },
          { method: secondMethod, amount: secondAmountMinor },
        ],
      } : {}),
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
    setError("");
    setConfirm(false);
    setMobileCartOpen(false);
  };

  return (
    <>
      <div className="space-y-6 pb-24 lg:pb-0">
        <PageHeader
          eyebrow="Espace de vente"
          title="Nouvelle vente"
          description="Recherchez un article, préparez le panier et encaissez sans quitter l’écran."
          actions={
            <Button asChild variant="outline">
              <Link href={href("/sales")}>Historique des ventes <ArrowRight /></Link>
            </Button>
          }
        />

        {storeId === "all" ? (
          <div className="rounded-lg border border-warning/20 bg-warning-background p-4 text-sm text-warning">
            Sélectionnez une boutique précise pour ouvrir une vente et afficher son stock disponible.
          </div>
        ) : null}

        <fieldset disabled={quoting} className="min-w-0 disabled:opacity-80">
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="min-w-0 space-y-4">
              <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                  <ProductSearch
                    ref={searchRef}
                    aria-label="Rechercher un produit en caisse"
                    placeholder="Rechercher un modèle, une marque, un IMEI…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && products.length === 1) {
                        event.preventDefault();
                        add(products[0].id);
                      }
                    }}
                  />
                  <p className="hidden whitespace-nowrap text-xs text-muted-foreground xl:block">Entrée ajoute le résultat unique</p>
                </div>
                <div className="mt-3">
                  <ProductFilters brands={brands} value={brand} onChange={setBrand} />
                </div>
              </div>

              {products.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      currency={currency}
                      cartQuantity={lines.find((line) => line.productId === product.id)?.quantity}
                      onAdd={add}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<ShoppingBag className="size-5" />}
                  title={storeId === "all" ? "Choisissez une boutique" : "Aucun produit disponible"}
                  description={storeId === "all" ? "Le catalogue de caisse dépend du stock de la boutique sélectionnée." : "Aucun article en stock ne correspond à votre recherche et aux filtres actifs."}
                />
              )}
            </section>

            <aside className="hidden lg:block">
              <div className="sticky top-20 h-[calc(100dvh-7rem)] overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
                <Cart idPrefix="desktop-cart" checkoutButtonId="checkout" {...sharedCartProps} />
              </div>
            </aside>
          </div>
        </fieldset>
      </div>

      <MobileCartDrawer
        idPrefix="mobile-cart"
        open={mobileCartOpen}
        onOpenChange={setMobileCartOpen}
        {...sharedCartProps}
      />

      {addingClient ? (
        <ActionForm type="client.save" title="Nouveau client" onClose={() => setAddingClient(false)} />
      ) : null}

      <CheckoutConfirmation
        open={confirm}
        currency={currency}
        total={total}
        paid={paidAmount}
        cashDue={cashDue}
        tendered={tendered}
        method={method}
        onOpenChange={setConfirm}
        onConfirm={completeSale}
      />

      {receipt ? <Receipt sale={receipt} onClose={() => setReceipt(null)} /> : null}
    </>
  );
}
