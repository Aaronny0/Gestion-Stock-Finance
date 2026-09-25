"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Money } from "@/components/data-display/money";
import { decimals } from "@/frontend/accounting";

interface PaymentSelectorProps {
  idPrefix: string;
  currency: string;
  methods: readonly string[];
  method: string;
  onMethodChange: (value: string) => void;
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
  onSecondAmountChange: (value: string) => void;
  cashDue: number;
  cashTendered: string;
  onCashTenderedChange: (value: string) => void;
  tendered: number;
}

export function PaymentSelector(props: PaymentSelectorProps) {
  const {
    idPrefix, currency, methods, method, onMethodChange, credit, onCreditChange, paid, onPaidChange,
    dueDate, onDueDateChange, splitPaymentsEnabled, split, onSplitChange, secondMethod,
    onSecondMethodChange, secondAmount, onSecondAmountChange, cashDue, cashTendered,
    onCashTenderedChange, tendered,
  } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Paiement</Label>
        <Select value={method} onValueChange={onMethodChange}>
          <SelectTrigger aria-label="Mode de paiement principal"><SelectValue /></SelectTrigger>
          <SelectContent>{methods.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-md border border-border p-3">
        <span>
          <span className="block text-sm font-medium text-foreground">Vente à crédit</span>
          <span className="block text-xs text-muted-foreground">Autoriser un paiement partiel.</span>
        </span>
        <Switch checked={credit} onCheckedChange={onCreditChange} aria-label="Vente à crédit ou paiement partiel" />
      </label>

      {credit ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-paid`}>Montant payé ({currency})</Label>
            <Input id={`${idPrefix}-paid`} type="number" min="0" value={paid} onChange={(event) => onPaidChange(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-due-date`}>Échéance <span className="font-normal text-muted-foreground">· facultative</span></Label>
            <Input id={`${idPrefix}-due-date`} type="date" value={dueDate} onChange={(event) => onDueDateChange(event.target.value)} />
          </div>
        </div>
      ) : null}

      {splitPaymentsEnabled ? (
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-border p-3">
          <Checkbox checked={split} onCheckedChange={(checked) => onSplitChange(checked === true)} aria-label="Répartir entre deux modes de paiement" />
          <span>
            <span className="block text-sm font-medium text-foreground">Paiement partagé</span>
            <span className="block text-xs text-muted-foreground">Répartir l’encaissement entre deux moyens.</span>
          </span>
        </label>
      ) : null}

      {split ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Second mode</Label>
            <Select value={secondMethod} onValueChange={onSecondMethodChange}>
              <SelectTrigger aria-label="Second mode de paiement"><SelectValue /></SelectTrigger>
              <SelectContent>{methods.filter((item) => item !== method).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-second-amount`}>Montant second mode ({currency})</Label>
            <Input id={`${idPrefix}-second-amount`} type="number" min="0" value={secondAmount} onChange={(event) => onSecondAmountChange(event.target.value)} />
          </div>
        </div>
      ) : null}

      {cashDue > 0 ? (
        <div className="space-y-3 rounded-md bg-muted/60 p-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-cash-tendered`}>Espèces remises ({currency})</Label>
            <Input
              id={`${idPrefix}-cash-tendered`}
              type="number"
              min="0"
              value={cashTendered}
              placeholder={String(cashDue / 10 ** decimals(currency))}
              onChange={(event) => onCashTenderedChange(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Laissez vide si le client donne le montant exact.</p>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monnaie à rendre</span>
            <Money value={Math.max(0, tendered - cashDue)} currency={currency} className="font-semibold text-foreground" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
