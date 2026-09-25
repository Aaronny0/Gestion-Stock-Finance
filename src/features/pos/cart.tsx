"use client";

import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/data-display/empty-state";
import { CartItem } from "./cart-item";
import { CustomerSelector } from "./customer-selector";
import { PaymentSelector } from "./payment-selector";
import { CheckoutPanel } from "./checkout-panel";
import type { Product, RecordRow, SaleLine } from "@/frontend/types";

interface CartProps {
  idPrefix: string;
  products: Product[];
  clients: RecordRow[];
  lines: SaleLine[];
  currency: string;
  discount: string;
  onDiscountChange: (value: string) => void;
  client: string;
  onClientChange: (value: string) => void;
  onAddClient: () => void;
  method: string;
  onMethodChange: (value: string) => void;
  methods: readonly string[];
  credit: boolean;
  onCreditChange: (value: boolean) => void;
  paid: string;
  onPaidChange: (value: string) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  splitPaymentsEnabled: boolean;
  split: boolean;
  onSplitChange: (value: boolean) => void;
  secondMethod: string;
  onSecondMethodChange: (value: string) => void;
  secondAmount: string;
  secondAmountMinor: number;
  onSecondAmountChange: (value: string) => void;
  cashDue: number;
  cashTendered: string;
  onCashTenderedChange: (value: string) => void;
  tendered: number;
  imei: boolean;
  onImeiChange: (value: boolean) => void;
  loss: boolean;
  requiresApproval: boolean;
  canSellBelowCost: boolean;
  priceOverrideReason: string;
  onPriceOverrideReasonChange: (value: string) => void;
  canChangePrice: boolean;
  canDiscountAboveLimit: boolean;
  total: number;
  paidAmount: number;
  error: string;
  quoting: boolean;
  disabled: boolean;
  checkoutButtonId?: string;
  onCheckout: () => void;
  onQuantityChange: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onPriceChange: (productId: string, value: string) => void;
  onLineImeiChange: (productId: string, value: string) => void;
}

export function Cart(props: CartProps) {
  const quantity = props.lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Panier</h2>
            <p className="text-xs text-muted-foreground">Vente en cours</p>
          </div>
        </div>
        <Badge variant={quantity ? "default" : "secondary"}>{quantity} article{quantity > 1 ? "s" : ""}</Badge>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5">
        {props.lines.length ? props.lines.map((line) => (
          <CartItem
            key={line.productId}
            idPrefix={props.idPrefix}
            line={line}
            stockQuantity={props.products.find((product) => product.id === line.productId)?.quantity ?? 0}
            currency={props.currency}
            canChangePrice={props.canChangePrice}
            imeiEnabled={props.imei}
            onQuantityChange={props.onQuantityChange}
            onRemove={props.onRemove}
            onPriceChange={props.onPriceChange}
            onImeiChange={props.onLineImeiChange}
          />
        )) : (
          <EmptyState
            className="my-5"
            icon={<ShoppingBag className="size-5" />}
            title="Panier vide"
            description="Ajoutez un produit depuis le catalogue pour commencer la vente."
          />
        )}

        <div className="space-y-5 border-t border-border py-5">
          <CustomerSelector clients={props.clients} value={props.client} required={props.credit} onChange={props.onClientChange} onAddClient={props.onAddClient} />

          <div className="space-y-1.5">
            <Label htmlFor={`${props.idPrefix}-discount`}>Remise ({props.currency})</Label>
            <Input id={`${props.idPrefix}-discount`} type="number" min="0" value={props.discount} onChange={(event) => props.onDiscountChange(event.target.value)} />
            <p className="text-xs text-muted-foreground">{props.canDiscountAboveLimit ? "Selon votre autorisation." : "Plafond : 5 %."}</p>
          </div>

          <PaymentSelector
            idPrefix={props.idPrefix}
            currency={props.currency}
            methods={props.methods}
            method={props.method}
            onMethodChange={props.onMethodChange}
            credit={props.credit}
            onCreditChange={props.onCreditChange}
            paid={props.paid}
            onPaidChange={props.onPaidChange}
            dueDate={props.dueDate}
            onDueDateChange={props.onDueDateChange}
            splitPaymentsEnabled={props.splitPaymentsEnabled}
            split={props.split}
            onSplitChange={props.onSplitChange}
            secondMethod={props.secondMethod}
            onSecondMethodChange={props.onSecondMethodChange}
            secondAmount={props.secondAmount}
            onSecondAmountChange={props.onSecondAmountChange}
            cashDue={props.cashDue}
            cashTendered={props.cashTendered}
            onCashTenderedChange={props.onCashTenderedChange}
            tendered={props.tendered}
          />

          {(props.loss || props.requiresApproval) ? (
            <div className="space-y-3 rounded-md border border-warning/20 bg-warning-background p-3">
              <p className="text-sm text-warning">Le prix net est inférieur au coût d’achat. Une permission responsable et un motif sont nécessaires.</p>
              {props.canSellBelowCost ? (
                <div className="space-y-1.5">
                  <Label htmlFor={`${props.idPrefix}-price-reason`}>Motif de la vente sous le coût d’achat</Label>
                  <Textarea id={`${props.idPrefix}-price-reason`} value={props.priceOverrideReason} onChange={(event) => props.onPriceOverrideReasonChange(event.target.value)} />
                </div>
              ) : null}
            </div>
          ) : null}

          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-md border border-border p-3">
            <span>
              <span className="block text-sm font-medium text-foreground">Suivi IMEI</span>
              <span className="block text-xs text-muted-foreground">Associer une unité unique aux articles concernés.</span>
            </span>
            <Switch checked={props.imei} onCheckedChange={props.onImeiChange} aria-label="Suivre une unité par IMEI" />
          </label>
        </div>
      </div>

      <div className="px-5 pb-5">
        <CheckoutPanel
          currency={props.currency}
          total={props.total}
          paidAmount={props.paidAmount}
          credit={props.credit}
          split={props.split}
          method={props.method}
          secondMethod={props.secondMethod}
          secondAmount={props.split ? props.secondAmountMinor : 0}
          error={props.error}
          disabled={props.disabled}
          quoting={props.quoting}
          buttonId={props.checkoutButtonId}
          onCheckout={props.onCheckout}
        />
      </div>
    </div>
  );
}
