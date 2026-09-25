"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Plus } from "lucide-react";
import { DateRangeFilter } from "@/components/data-display/date-range-filter";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/frontend/forms";
import { salePosition } from "@/frontend/operations";
import { Receipt } from "@/frontend/pos";
import { useWorkspace } from "@/frontend/provider";
import type { Sale } from "@/frontend/types";
import { RefundDialog } from "@/features/sales/refund-dialog";
import { SaleDetails } from "@/features/sales/sale-details";
import { SalesTable } from "@/features/sales/sales-table";

function SalesPage({ path }: { path: string }) {
  const { snapshot, storeId, start, end, href, can } = useWorkspace();
  const router = useRouter();
  const db = snapshot!.data;
  const [returnSale, setReturnSale] = useState<Sale | null>(null);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const query = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();
  const scope = (sale: Sale) => (storeId === "all" || sale.storeId === storeId) && sale.date.slice(0, 10) >= start && sale.date.slice(0, 10) <= end;
  const sales = db.sales.filter((sale) => scope(sale) && (!query.get("brand") || sale.lines.some((line) => line.brand === query.get("brand"))) && (!query.get("seller") || sale.seller === query.get("seller")) && (!query.get("product") || sale.lines.some((line) => line.label === query.get("product"))));
  const saleId = path.split("/")[2];
  const sale = saleId ? db.sales.find((item) => item.id === saleId && (storeId === "all" || item.storeId === storeId)) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="VENTES"
        title={sale ? sale.reference : "Chaque vente compte."}
        description="Consultez les reçus, suivez les crédits et retrouvez vos transactions."
        actions={can("sales.create") ? <Button asChild><Link href={href("/pos")}><Plus /> Nouvelle vente</Link></Button> : undefined}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!saleId ? <DateRangeFilter /> : <div />}
        <Button variant="outline" asChild><Link href={href("/sales/credits")}><CreditCard /> Crédits et échéances</Link></Button>
      </div>

      {saleId && !sale ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive-background p-4 text-sm text-destructive" role="alert">Vente introuvable dans cette boutique.</div>
      ) : sale ? (
        <SaleDetails
          sale={sale}
          href={href}
          canFinance={can("finance.read")}
          canRefund={can("sales.refund")}
          canAccounting={can("accounting.read")}
          onReceipt={() => setReceipt(sale)}
          onPayment={() => setPaymentSale(sale)}
          onRefund={() => setReturnSale(sale)}
        />
      ) : (
        <SalesTable sales={sales} onOpen={(item) => router.push(href(`/sales/${item.id}`))} canExport={can("exports.create")} />
      )}

      {paymentSale ? <ActionForm type="payment.create" title="Encaisser un règlement" initial={{ sourceId: paymentSale.id, amount: salePosition(paymentSale).due }} onClose={() => setPaymentSale(null)} /> : null}
      {returnSale ? <RefundDialog sale={db.sales.find((item) => item.id === returnSale.id) ?? returnSale} onClose={() => setReturnSale(null)} /> : null}
      {receipt ? <Receipt sale={receipt} onClose={() => setReceipt(null)} /> : null}
    </div>
  );
}

export { SalesPage };
