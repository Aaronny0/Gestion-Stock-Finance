import Link from "next/link";
import { ArrowUpRight, Package } from "lucide-react";
import { Money } from "@/components/data-display/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardTopProducts({
  rows,
  currency,
  href,
}: {
  rows: { label: string; quantity: number; amount: number }[];
  currency: string;
  href: (path: string) => string;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Meilleures ventes</CardTitle>
          <CardDescription>Produits les plus performants sur la période.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={href("/analytics/sales")}>
            Tout voir <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {rows.map((product, index) => (
          <Link
            key={product.label}
            href={href("/sales") + `?product=${encodeURIComponent(product.label)}`}
            className="grid min-h-16 grid-cols-[2rem_2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="text-xs font-bold tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <Package className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm font-semibold text-foreground">{product.label}</strong>
              <span className="block text-xs text-muted-foreground">{product.quantity} unités vendues</span>
            </span>
            <Money value={product.amount} currency={currency} className="text-sm font-semibold" />
          </Link>
        ))}
        {!rows.length ? (
          <div className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">
            Aucune vente produit sur la période.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
