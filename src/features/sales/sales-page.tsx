"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Plus } from "lucide-react";
import { Money } from "@/components/data-display/money";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/data-display/status-badge";
import styles from "./sales.module.css";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/frontend/forms";
import { salePosition } from "@/frontend/operations";
import { Receipt } from "@/frontend/pos";
import { useViewState, useWorkspace } from "@/frontend/provider";
import type { Sale } from "@/frontend/types";
import { RefundDialog } from "@/features/sales/refund-dialog";
import { SaleDetails } from "@/features/sales/sale-details";
import { SalesTable } from "@/features/sales/sales-table";

function SalesPage({ path }: { path: string }) {
  const { snapshot, storeId, start, end, setDates, href, can, goBack } =
    useWorkspace();
  const router = useRouter();
  const db = snapshot!.data;
  const [returnSale, setReturnSale] = useState<Sale | null>(null);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const query =
    typeof location !== "undefined"
      ? new URLSearchParams(location.search)
      : new URLSearchParams();
  const scope = (sale: Sale) =>
    (storeId === "all" || sale.storeId === storeId) &&
    sale.date.slice(0, 10) >= start &&
    sale.date.slice(0, 10) <= end;
  const periodSales = db.sales.filter(
    (sale) =>
      scope(sale) &&
      (!query.get("brand") ||
        sale.lines.some((line) => line.brand === query.get("brand"))) &&
      (!query.get("seller") || sale.seller === query.get("seller")) &&
      (!query.get("product") ||
        sale.lines.some((line) => line.label === query.get("product"))),
  );
  const [status, setStatus] = useViewState(
    "sales:status",
    query.get("status") ?? "all",
  );
  const [search, setSearch] = useViewState("datatable:ventes:search", "");
  const category = (sale: Sale) =>
    sale.returns?.length || sale.status === "refunded"
      ? "returns"
      : salePosition(sale).due > 0
        ? "credit"
        : "paid";
  const sales = periodSales.filter(
    (sale) =>
      (status === "all" || category(sale) === status) &&
      `${sale.reference} ${sale.seller} ${db.clients.find((client) => client.id === sale.clientId)?.label ?? "Client de passage"} ${sale.lines.map((line) => `${line.label} ${line.imei ?? ""}`).join(" ")}`
        .toLocaleLowerCase("fr")
        .includes(search.trim().toLocaleLowerCase("fr")),
  );
  const selectPeriod = (days: number) => {
    const last = new Intl.DateTimeFormat("en-CA", {
      timeZone: snapshot!.session.organization.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const first = new Date(last + "T12:00:00Z");
    first.setUTCDate(first.getUTCDate() - days + 1);
    setDates(first.toISOString().slice(0, 10), last);
  };
  const periods = [
    { label: "Aujourd’hui", days: 1 },
    { label: "7 jours", days: 7 },
    { label: "30 jours", days: 30 },
  ];
  const filters = (
    <>
      <div className={styles.period}>
        {periods.map((period) => (
          <button
            key={period.days}
            type="button"
            aria-pressed={
              Math.round((Date.parse(end) - Date.parse(start)) / 86400000) +
                1 ===
              period.days
            }
            onClick={() => selectPeriod(period.days)}
          >
            {period.label}
          </button>
        ))}
      </div>
      <div className={styles.chips}>
        {[
          { key: "all", label: "Toutes" },
          { key: "paid", label: "Payées" },
          { key: "credit", label: "À crédit" },
          { key: "returns", label: "Retours" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={status === item.key}
            onClick={() => {
              resetPagination({ pageIndex: 0, pageSize: 10 });
              setStatus(item.key);
            }}
          >
            {item.label}
            <small>
              {
                periodSales.filter(
                  (sale) => item.key === "all" || category(sale) === item.key,
                ).length
              }
            </small>
          </button>
        ))}
      </div>
    </>
  );
  const saleId = path.split("/")[2];
  const [lastOpened, setLastOpened] = useViewState("sales:last-opened", "");
  const [, resetPagination] = useViewState("datatable:ventes:pagination", {
    pageIndex: 0,
    pageSize: 10,
  });
  useEffect(() => {
    if (!saleId && lastOpened) {
      const row = Array.from(
        document.querySelectorAll<HTMLElement>(
          `[data-row-id="${CSS.escape(lastOpened)}"]`,
        ),
      ).find((element) => element.getClientRects().length > 0);
      row?.focus({ preventScroll: true });
    }
  }, [saleId, lastOpened]);
  const sale = saleId
    ? db.sales.find(
        (item) =>
          item.id === saleId && (storeId === "all" || item.storeId === storeId),
      )
    : undefined;

  return (
    <div className={styles.page}>
      <PageHeader
        title="Ventes"
        description="Reçus, encaissements, crédits et retours de la boutique."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={href("/sales/credits")}>
                <CreditCard /> Crédits et échéances
              </Link>
            </Button>
            {can("sales.create") && (
              <Button asChild>
                <Link href={href("/pos")}>
                  <Plus /> Nouvelle vente
                </Link>
              </Button>
            )}
          </>
        }
      />
      <section
        className={styles.summary}
        aria-label="Synthèse des ventes affichées"
      >
        <div>
          <label>Ventes</label>
          <strong>{sales.length}</strong>
        </div>
        <div>
          <label>Montant net</label>
          <strong>
            <Money
              currencyDisplay="code"
              value={sales.reduce(
                (sum, sale) => sum + salePosition(sale).netTotal,
                0,
              )}
              currencyClassName={styles.currency}
            />
          </strong>
        </div>
        <div>
          <label>Encaissé</label>
          <strong>
            <Money
              currencyDisplay="code"
              value={sales.reduce(
                (sum, sale) => sum + salePosition(sale).netPaid,
                0,
              )}
              currencyClassName={styles.currency}
            />
          </strong>
        </div>
        <div>
          <label>Reste dû</label>
          <strong className={styles.warning}>
            <Money
              currencyDisplay="code"
              value={sales.reduce(
                (sum, sale) => sum + salePosition(sale).due,
                0,
              )}
              currencyClassName={styles.currency}
            />
          </strong>
        </div>
      </section>
      <div className={styles.ledger}>
        <SalesTable
          key={status}
          sales={sales}
          search={search}
          onSearch={setSearch}
          onReset={() => {
            resetPagination({ pageIndex: 0, pageSize: 10 });
            setSearch("");
            setStatus("all");
            const params = new URLSearchParams(location.search);
            for (const key of ["brand", "seller", "product", "status"])
              params.delete(key);
            if (params.toString() !== location.search.slice(1))
              router.replace(
                `${href("/sales")}${params.size ? `?${params}` : ""}`,
              );
          }}
          filters={filters}
          onOpen={(item) => {
            setLastOpened(item.id);
            router.push(href(`/sales/${item.id}`));
          }}
          canExport={can("exports.create")}
        />
      </div>
      {saleId && !sale && (
        <div
          className="rounded-lg border border-destructive/20 bg-destructive-background p-4 text-sm text-destructive"
          role="alert"
        >
          Vente introuvable dans cette boutique.
        </div>
      )}
      <Sheet
        open={!!sale}
        onOpenChange={(open) => {
          if (!open) goBack();
        }}
      >
        <SheetContent
          className={styles.sheet}
          overlayClassName={styles.overlay}
          onEscapeKeyDown={(event) => {
            const modal = document.querySelector("dialog[open]");
            if (modal instanceof HTMLDialogElement) {
              event.preventDefault();
              // Delegate to the existing cancel handler, including draft guards.
              modal.dispatchEvent(new Event("cancel", { cancelable: true }));
            }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
          }}
        >
          <div className={styles.sheetHeader}>
            <div>
              <SheetTitle>{sale?.reference}</SheetTitle>
              {sale && (
                <StatusBadge
                  value={sale.status}
                  showIcon={false}
                  className={styles.status}
                />
              )}
            </div>
            <SheetDescription>
              {sale &&
                `${new Date(sale.date).toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · ${sale.seller} · ${snapshot!.session.stores.find((store) => store.id === sale.storeId)?.name ?? "Boutique"}`}
            </SheetDescription>
          </div>
          {sale && (
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
          )}
          {paymentSale ? (
            <ActionForm
              type="payment.create"
              title="Encaisser un règlement"
              initial={{
                sourceId: paymentSale.id,
                amount: salePosition(paymentSale).due,
              }}
              onClose={() => setPaymentSale(null)}
            />
          ) : null}
          {returnSale ? (
            <RefundDialog
              sale={
                db.sales.find((item) => item.id === returnSale.id) ?? returnSale
              }
              onClose={() => setReturnSale(null)}
            />
          ) : null}
          {receipt ? (
            <Receipt sale={receipt} onClose={() => setReceipt(null)} />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export { SalesPage };
