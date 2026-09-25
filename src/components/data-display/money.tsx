"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/frontend/provider";

interface MoneyProps extends React.ComponentProps<"span"> {
  value: number;
  currency?: string;
  locale?: string;
  minorUnits?: boolean;
}

function currencyDecimals(currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 0;
}

function Money({ value, currency: explicitCurrency, locale = "fr-FR", minorUnits = true, className, ...props }: MoneyProps) {
  const { snapshot } = useWorkspace();
  const currency = explicitCurrency ?? snapshot?.session.organization.currency ?? "XOF";
  const decimals = currencyDecimals(currency, locale);
  const normalized = minorUnits ? value / 10 ** decimals : value;
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: decimals,
  }).format(normalized);

  return <span className={cn("whitespace-nowrap [font-variant-numeric:tabular-nums]", className)} {...props}>{formatted}</span>;
}

export { Money };
