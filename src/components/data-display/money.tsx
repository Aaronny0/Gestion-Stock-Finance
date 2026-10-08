"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/frontend/provider";

interface MoneyProps extends React.ComponentProps<"span"> {
  value: number;
  currency?: string;
  locale?: string;
  minorUnits?: boolean;
  currencyClassName?: string;
  currencyDisplay?: Intl.NumberFormatOptions["currencyDisplay"];
}

function currencyDecimals(currency: string, locale: string) {
  return (
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 0
  );
}

function Money({
  value,
  currency: explicitCurrency,
  locale = "fr-FR",
  minorUnits = true,
  currencyClassName,
  currencyDisplay = "symbol",
  className,
  ...props
}: MoneyProps) {
  const { snapshot } = useWorkspace();
  const currency =
    explicitCurrency ?? snapshot?.session.organization.currency ?? "XOF";
  const decimals = currencyDecimals(currency, locale);
  const normalized = minorUnits ? value / 10 ** decimals : value;
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay,
    maximumFractionDigits: decimals,
  }).format(normalized);

  return (
    <span
      data-money=""
      className={cn(
        "whitespace-nowrap [font-variant-numeric:tabular-nums]",
        className,
      )}
      {...props}
    >
      {currencyClassName
        ? new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            currencyDisplay,
            maximumFractionDigits: decimals,
          })
            .formatToParts(normalized)
            .map((part, index) =>
              part.type === "currency" ? (
                <span key={index} className={currencyClassName}>
                  {part.value}
                </span>
              ) : (
                <React.Fragment key={index}>{part.value}</React.Fragment>
              ),
            )
        : formatted}
    </span>
  );
}

export { Money };
