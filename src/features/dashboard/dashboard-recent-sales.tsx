import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { salePosition } from "@/frontend/operations";
import type { Sale } from "@/frontend/types";

export function DashboardRecentSales({
  sales,
  currency,
  href,
}: {
  sales: Sale[];
  currency: string;
  href: (path: string) => string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Dernières ventes</CardTitle>
          <CardDescription>Transactions les plus récentes de la période.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={href("/sales")}>
            Voir l’historique <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="hidden overflow-hidden rounded-lg border border-border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vendeur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="w-12"><span className="sr-only">Ouvrir</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <Link href={href(`/sales/${sale.id}`)} className="font-semibold text-foreground hover:text-primary">
                      {sale.reference}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(sale.date).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>{sale.seller}</TableCell>
                  <TableCell><StatusBadge value={sale.status} /></TableCell>
                  <TableCell className="text-right font-semibold"><Money value={salePosition(sale).netTotal} currency={currency} /></TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="icon" className="size-9 min-h-9">
                      <Link href={href(`/sales/${sale.id}`)} aria-label={`Ouvrir ${sale.reference}`}>
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="divide-y divide-border rounded-lg border border-border md:hidden">
          {sales.map((sale) => (
            <Link
              key={sale.id}
              href={href(`/sales/${sale.id}`)}
              className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] gap-3 p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm text-foreground">{sale.reference}</strong>
                  <StatusBadge value={sale.status} showIcon={false} />
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {new Date(sale.date).toLocaleDateString("fr-FR")} · {sale.seller}
                </span>
                <Money value={salePosition(sale).netTotal} currency={currency} className="mt-2 block text-sm font-bold" />
              </span>
              <ArrowRight className="mt-1 size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          ))}
        </div>

        {!sales.length ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aucune vente sur la période sélectionnée.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
