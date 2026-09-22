import { salePosition } from "./operations";
import type {
  AccountingEntry,
  AccountingLine,
  Account,
  Payment,
  Period,
  Sale,
} from "./types";
// All persisted amounts are integer minor units. XOF/XAF have zero decimal places.
export function decimals(currency: string) {
  return (
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 0
  );
}
export function money(value: number, currency = "XOF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: decimals(currency),
  }).format(value / 10 ** decimals(currency));
}
export function minor(value: string | number, currency = "XOF") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) throw new Error("Montant invalide.");
  const result = Math.round(amount * 10 ** decimals(currency));
  if (!Number.isSafeInteger(result)) throw new Error("Montant trop élevé.");
  return result;
}
export function amount(value: unknown, label = "Montant") {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error(`${label} : indiquez un entier positif ou nul.`);
  return n;
}
export function balance(lines: AccountingLine[]) {
  const debit = lines.reduce((s, l) => s + l.debit, 0);
  const credit = lines.reduce((s, l) => s + l.credit, 0);
  return {
    debit,
    credit,
    difference: debit - credit,
    balanced: debit === credit && debit > 0,
  };
}
export function validateEntry(
  entry: Pick<AccountingEntry, "date" | "lines">,
  accounts: Account[],
  periods: Period[],
) {
  if (
    !periods.some(
      (p) =>
        p.status === "open" &&
        entry.date.slice(0, 10) >= p.start &&
        entry.date.slice(0, 10) <= p.end,
    )
  )
    throw new Error("Choisissez une date dans une période ouverte.");
  if (entry.lines.length < 2)
    throw new Error("Une écriture requiert au moins deux lignes.");
  for (const line of entry.lines) {
    amount(line.debit, "Débit");
    amount(line.credit, "Crédit");
    if (!accounts.some((a) => a.number === line.account && a.active))
      throw new Error("Choisissez un compte actif.");
    if (line.debit > 0 === line.credit > 0)
      throw new Error("Saisissez un débit OU un crédit par ligne.");
  }
  if (!balance(entry.lines).balanced)
    throw new Error("Le total débit doit être égal au total crédit.");
}
export function trialBalance(
  entries: AccountingEntry[],
  accounts: Account[],
  start: string,
  end: string,
) {
  return accounts.map((account) => {
    let opening = 0,
      debit = 0,
      credit = 0;
    for (const e of entries.filter(
      (e) => e.status !== "draft" && e.date.slice(0, 10) <= end,
    ))
      for (const l of e.lines.filter((l) => l.account === account.number)) {
        if (e.date.slice(0, 10) < start) opening += l.debit - l.credit;
        else {
          debit += l.debit;
          credit += l.credit;
        }
      }
    return {
      ...account,
      opening,
      debit,
      credit,
      closing: opening + debit - credit,
    };
  });
}
export function ledger(
  entries: AccountingEntry[],
  account: string,
  start: string,
  end: string,
) {
  let running = 0;
  const rows: {
    entry: AccountingEntry;
    line: AccountingLine;
    running: number;
  }[] = [];
  for (const entry of [...entries]
    .filter((e) => e.status !== "draft" && e.date.slice(0, 10) <= end)
    .sort((a, b) => a.date.localeCompare(b.date)))
    for (const line of entry.lines.filter(
      (l) => !account || l.account === account,
    )) {
      running += line.debit - line.credit;
      if (entry.date.slice(0, 10) >= start) rows.push({ entry, line, running });
    }
  return rows;
}
export function paymentAccount(method: string) {
  return method === "Espèces"
    ? "571"
    : method === "Mobile Money"
      ? "552"
      : "521";
}
export function saleLines(
  total: number,
  cost: number,
  paid: number,
  method = "Espèces",
): AccountingLine[] {
  return [
    ...(paid > 0
      ? [
          {
            account: paymentAccount(method),
            label: "Encaissement",
            debit: paid,
            credit: 0,
          },
        ]
      : []),
    ...(total > paid
      ? [
          {
            account: "411",
            label: "Créance client",
            debit: total - paid,
            credit: 0,
          },
        ]
      : []),
    { account: "701", label: "Vente de marchandises", debit: 0, credit: total },
    ...(cost > 0
      ? [
          {
            account: "603",
            label: "Coût des marchandises vendues",
            debit: cost,
            credit: 0,
          },
          { account: "31", label: "Sortie de stock", debit: 0, credit: cost },
        ]
      : []),
  ];
}
export function indicators(
  sales: Sale[],
  payments: Payment[],
  entries: AccountingEntry[],
) {
  const valid = sales.filter((s) => s.status !== "refunded");
  const revenue = sales.reduce((s, v) => s + salePosition(v).netTotal, 0);
  const cost = sales.reduce((sum, sale) => sum + salePosition(sale).netCost, 0);
  const incoming = payments
    .filter((p) => p.direction === "in")
    .reduce((s, p) => s + p.amount, 0);
  const outgoing = payments
    .filter((p) => p.direction === "out")
    .reduce((s, p) => s + p.amount, 0);
  let result = 0;
  for (const e of entries.filter((e) => e.status !== "draft"))
    for (const l of e.lines)
      if (l.account.startsWith("7") || l.account.startsWith("6"))
        result += l.credit - l.debit;
  return {
    revenue,
    incoming,
    outgoing,
    cashflow: incoming - outgoing,
    margin: revenue - cost,
    result,
    count: valid.length,
    units: valid.reduce((s, v) => s + salePosition(v).units, 0),
    average: valid.length ? Math.round(revenue / valid.length) : 0,
  };
}
