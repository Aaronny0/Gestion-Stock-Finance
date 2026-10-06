import type { Product, Sale, SaleLine, SaleReturnLine } from "./types";
export function normalized(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("fr");
}
export function normalizedPhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}
function integer(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`${label} invalide.`);
  return value;
}
function share(total: number, weight: number, whole: number) {
  return whole
    ? Number(
        (BigInt(integer(total, "Montant")) * BigInt(integer(weight, "Poids"))) /
          BigInt(integer(whole, "Total")),
      )
    : 0;
}
export function lineValue(sale: Pick<Sale, "lines" | "total">, index: number) {
  const gross = sale.lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const before = sale.lines
    .slice(0, index)
    .reduce((s, l) => s + l.price * l.quantity, 0);
  const current = sale.lines[index];
  return (
    share(sale.total, before + current.price * current.quantity, gross) -
    share(sale.total, before, gross)
  );
}
export function returnedQuantity(sale: Sale, index: number) {
  return (sale.returns ?? [])
    .flatMap((r) => r.lines)
    .filter((l) => l.lineIndex === index)
    .reduce((s, l) => s + l.quantity, 0);
}
export function salePosition(sale: Sale) {
  const returns = sale.returns ?? [];
  const refunded = returns.reduce((s, r) => s + r.amount, 0);
  const cashRefunded = returns.reduce((s, r) => s + r.cashRefund, 0);
  const netTotal =
    sale.status === "refunded" && !returns.length ? 0 : sale.total - refunded;
  const netPaid =
    sale.status === "refunded" && !returns.length
      ? 0
      : sale.paid - cashRefunded - returns.reduce((n, r) => n + (r.tradeReduction ?? 0), 0);
  const restoredCost = returns
    .flatMap((r) => r.lines)
    .filter((l) => l.restock)
    .reduce((s, l) => s + (l.cost ?? 0), 0);
  const originalCost = sale.lines.reduce(
    (s, l) => s + (l.costTotal ?? (l.cost ?? 0) * l.quantity),
    0,
  );
  return {
    refunded,
    cashRefunded,
    netTotal,
    netIncome: netTotal - (sale.taxTotal ?? 0) + returns.reduce((n,r)=>n+(r.taxTotal??0),0),
    netPaid,
    due: Math.max(0, netTotal - netPaid),
    netCost:
      sale.status === "refunded" && !returns.length
        ? 0
        : originalCost - restoredCost,
    units: sale.lines.reduce(
      (s, l, i) => s + l.quantity - returnedQuantity(sale, i),
      0,
    ),
  };
}
export function saleActivity(sale: Sale, start: string, end: string) {
  const within = (date: string) => date.slice(0,10) >= start && date.slice(0,10) <= end;
  const sold = within(sale.date);
  const returns = (sale.returns ?? []).filter(r => within(r.date));
  const beforeEnd = (sale.returns ?? []).filter(r => r.date.slice(0,10) <= end).reduce((n,r)=>n+r.amount,0);
  return {
    netIncome: (sold ? sale.total - (sale.taxTotal ?? 0) : 0) - returns.reduce((n,r)=>n+r.amount-(r.taxTotal??0),0),
    netCost: (sold ? sale.lines.reduce((n,l)=>n+(l.costTotal??(l.cost??0)*l.quantity),0) : 0) - returns.flatMap(r=>r.lines).filter(l=>l.restock).reduce((n,l)=>n+(l.cost??0),0),
    units: (sold ? sale.lines.reduce((n,l)=>n+l.quantity,0) : 0) - returns.flatMap(r=>r.lines).reduce((n,l)=>n+l.quantity,0),
    count: sold && sale.total > beforeEnd ? 1 : 0,
  };
}

export interface ReturnSelection {
  lineIndex: number;
  quantity: number;
  restock: boolean;
}
export function quoteReturn(sale: Sale, selections: ReturnSelection[]) {
  if (sale.status === "refunded")
    throw new Error("Vente déjà annulée ou remboursée.");
  if (!selections.length)
    throw new Error("Sélectionnez au moins un article à retourner.");
  const used = new Set<number>();
  const lines: (SaleReturnLine & { cost: number })[] = selections.map((s) => {
    integer(s.lineIndex, "Ligne");
    integer(s.quantity, "Quantité");
    const line = sale.lines[s.lineIndex];
    if (
      !line ||
      s.quantity < 1 ||
      used.has(s.lineIndex) ||
      typeof s.restock !== "boolean"
    )
      throw new Error("Ligne de retour invalide.");
    used.add(s.lineIndex);
    const previous = returnedQuantity(sale, s.lineIndex);
    if (previous + s.quantity > line.quantity)
      throw new Error("La quantité dépasse les articles restant à retourner.");
    const net = lineValue(sale, s.lineIndex);
    return {
      ...s,
      value:
        share(net, previous + s.quantity, line.quantity) -
        share(net, previous, line.quantity),
      cost: share(line.costTotal ?? (line.cost ?? 0) * line.quantity, previous + s.quantity, line.quantity) - share(line.costTotal ?? (line.cost ?? 0) * line.quantity, previous, line.quantity),
    };
  });
  const amount = lines.reduce((s, l) => s + l.value, 0);
  if (sale.tradeValue && ((sale.returns ?? []).length || amount !== sale.total || selections.some(l => !l.restock))) throw new Error("Un troc exige un retour intégral des deux appareils.");
  const tradeReduction = sale.tradeValue ?? 0;
  const creditReduction = Math.min(salePosition(sale).due, amount - tradeReduction);
  return {
    lines,
    amount,
    creditReduction,
    tradeReduction,
    cashRefund: amount - creditReduction - tradeReduction,
  };
}
export function belowCostLines(lines: SaleLine[], discount: number) {
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0) - discount;
  if (total < 0) return [];
  return lines
    .map((l, index) => ({
      label: l.label,
      index,
      below:
        l.cost !== undefined &&
        lineValue({ lines, total }, index) < l.cost * l.quantity,
    }))
    .filter((l) => l.below);
}
export function cashSettlement(
  parts: { method: string; amount: number }[],
  tendered?: number,
) {
  const cashDue = parts
    .filter((p) => p.method === "Espèces")
    .reduce((s, p) => s + integer(p.amount, "Paiement"), 0);
  const cashTendered =
    tendered === undefined ? cashDue : integer(tendered, "Espèces remises");
  if (cashTendered < cashDue)
    throw new Error("Les espèces remises sont insuffisantes.");
  if (!cashDue && cashTendered)
    throw new Error("Aucun paiement en espèces ne nécessite de monnaie.");
  return { cashDue, cashTendered, cashChange: cashTendered - cashDue };
}
export function dueState(sale: Sale, today: string) {
  const due = salePosition(sale).due;
  if (!due) return { label: "Soldée", days: 0 };
  if (!sale.dueDate) return { label: "Échéance à définir", days: 0 };
  const days = Math.floor(
    (Date.parse(today.slice(0, 10) + "T12:00:00Z") -
      Date.parse(sale.dueDate.slice(0, 10) + "T12:00:00Z")) /
      86400000,
  );
  return {
    label:
      days > 0 ? "En retard" : days === 0 ? "Échéance aujourd’hui" : "À venir",
    days: Math.max(0, days),
  };
}
export function replenishment(product: Product) {
  const target =
    product.reorderTarget ??
    Math.max(product.threshold + 1, product.threshold * 2, 1);
  return { target, suggested: Math.max(0, target - product.quantity) };
}

export function netLineValue(sale: Sale, index: number, period?: {start:string;end:string}) {
  if (period) {
    const within=(date:string)=>date.slice(0,10)>=period.start && date.slice(0,10)<=period.end;
    return (within(sale.date) ? lineValue(sale,index) : 0) - (sale.returns??[]).filter(r=>within(r.date)).flatMap(r=>r.lines).filter(l=>l.lineIndex===index).reduce((n,l)=>n+l.value,0);
  }
  return sale.status === "refunded" && !sale.returns?.length
    ? 0
    : lineValue(sale, index) -
        (sale.returns ?? [])
          .flatMap((r) => r.lines)
          .filter((l) => l.lineIndex === index)
          .reduce((sum, l) => sum + l.value, 0);
}
