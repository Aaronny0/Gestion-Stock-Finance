import Link from "next/link";
import { Money } from "@/components/data-display/money";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const palette = ["bg-primary", "bg-success", "bg-info", "bg-warning"];
const dotPalette = ["bg-primary", "bg-success", "bg-info", "bg-warning"];

export function DashboardPaymentBreakdown({
  rows,
  total,
  currency,
  href,
}: {
  rows: [string, number][];
  total: number;
  currency: string;
  href: (path: string) => string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Modes de paiement</CardTitle>
        <CardDescription>Répartition des encaissements de la période.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Money value={total} currency={currency} className="text-2xl font-bold tracking-tight text-foreground" />
          <p className="mb-0 mt-1 text-xs text-muted-foreground">encaissés sur la période</p>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted" aria-label="Répartition visuelle des modes de paiement">
          {rows.map(([method, value], index) => (
            <span
              key={method}
              className={cn("h-full", palette[index % palette.length])}
              style={{ width: `${total ? (value / total) * 100 : 0}%` }}
            />
          ))}
        </div>
        <div className="space-y-1">
          {rows.map(([method, value], index) => (
            <Link
              key={method}
              href={href("/payments") + `?method=${encodeURIComponent(method)}`}
              className="grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-md px-2 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className={cn("size-2.5 rounded-full", dotPalette[index % dotPalette.length])} aria-hidden="true" />
              <span className="truncate text-foreground">{method}</span>
              <strong className="text-xs tabular-nums text-muted-foreground">
                {total ? Math.round((value / total) * 100) : 0}%
              </strong>
              <Money value={value} currency={currency} className="font-semibold" />
            </Link>
          ))}
          {!rows.length ? <p className="m-0 text-sm text-muted-foreground">Aucun encaissement sur la période.</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
