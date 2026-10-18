"use client";

import { formatListDate } from "@/lib/format";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, ReceiptText } from "lucide-react";
import { EmptyState } from "@/components/data-display/empty-state";
import { DataTable } from "@/components/data-display/data-table";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { useWorkspace } from "@/frontend/provider";
import type { ReactNode } from "react";
import styles from "./sales.module.css";
import { salePosition } from "@/frontend/operations";
import type { Sale } from "@/frontend/types";

function SalesTable({
  sales,
  onOpen,
  canExport,
  filters,
  search,
  onSearch,
  onReset,
  toolbarStart,
  filtered = false,
}: {
  sales: Sale[];
  onOpen: (sale: Sale) => void;
  canExport: boolean;
  filters?: ReactNode;
  search?: string;
  onSearch?: (value: string) => void;
  onReset?: () => void;
  toolbarStart?: ReactNode;
  /** Un filtre ou une recherche est actif : l'état vide propose de les effacer. */
  filtered?: boolean;
}) {
  const { snapshot } = useWorkspace();
  const clientName = (sale: Sale) =>
    String(
      snapshot?.data.clients.find((client) => client.id === sale.clientId)
        ?.label ?? "Client de passage",
    );
  const columns: ColumnDef<Sale>[] = [
    {
      accessorKey: "reference",
      header: "Référence",
      accessorFn: (sale) =>
        `${sale.reference} ${sale.lines.map((line) => line.imei ?? "").join(" ")}`,
      cell: ({ row }) => (
        <span>
          <span className={styles.reference}>{row.original.reference}</span>
          <span className={styles.secondary}>
            {formatListDate(row.original.date, { time: true })}
          </span>
        </span>
      ),
    },
    {
      id: "client",
      header: "Client · articles",
      accessorFn: (sale) =>
        `${clientName(sale)} ${sale.lines.map((line) => line.label).join(" ")}`,
      cell: ({ row }) => (
        <span>
          <span className={styles.client}>{clientName(row.original)}</span>
          <span className={styles.secondary}>
            {row.original.lines
              .map((line) => `${line.quantity} × ${line.label}`)
              .join(", ")}
          </span>
        </span>
      ),
    },
    { accessorKey: "seller", header: "Vendeur" },
    {
      id: "status",
      header: "Statut",
      accessorFn: (sale) => sale.status,
      cell: ({ row }) => (
        <StatusBadge
          value={row.original.status}
          showIcon={false}
          className={styles.status}
        />
      ),
    },
    {
      id: "total",
      header: "Montant net",
      meta: { align: "right" },
      accessorFn: (sale) => salePosition(sale).netTotal,
      cell: ({ row }) => (
        <Money
          currencyClassName={styles.tableCurrency}
          value={salePosition(row.original).netTotal}
          className="font-semibold"
        />
      ),
    },
    {
      id: "due",
      header: "Reste dû",
      meta: { align: "right" },
      accessorFn: (sale) => salePosition(sale).due,
      cell: ({ row }) =>
        salePosition(row.original).due > 0 ? (
          <Money
            currencyClassName={styles.tableCurrency}
            value={salePosition(row.original).due}
            className="font-semibold text-warning"
          />
        ) : (
          <span className={styles.secondary}>—</span>
        ),
    },

    {
      id: "open",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: () => <ChevronRight size={16} className="text-muted-foreground" />,
    },
  ];

  return (
    <DataTable
      name="ventes"
      density="comfortable"
      filters={filters}
      toolbarStart={toolbarStart}
      searchValue={search}
      onSearchChange={onSearch}
      enableColumnVisibility={false}
      manualFiltering
      numberedPagination
      data={sales}
      columns={columns}
      onRow={onOpen}
      getRowId={(sale) => sale.id}
      enableSelection={canExport}
      canExport={canExport}
      exportRow={(sale) => ({
        Référence: sale.reference,
        Date: new Date(sale.date).toLocaleString("fr-FR"),
        Vendeur: sale.seller,
        "Montant net": salePosition(sale).netTotal,
        "Paiement net": salePosition(sale).netPaid,
        "Reste dû": salePosition(sale).due,
        Statut: sale.status,
      })}
      emptyContent={
        <EmptyState
          kind={filtered ? "no-results" : "first-use"}
          icon={ReceiptText}
          title={filtered ? "Aucune vente ne correspond" : "Aucune vente sur cette période"}
          description={filtered ? "Aucune vente de la période ne correspond à la recherche ou au statut choisi." : "Changez de période ou enregistrez une nouvelle vente depuis la caisse."}
          onClearFilters={filtered ? onReset : undefined}
        />
      }
      searchPlaceholder="Référence, client, IMEI…"
      mobileRow={(sale) => (
        <div className={styles.mobileRow}>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <strong className="truncate text-sm">{sale.reference}</strong>
              <StatusBadge
                value={sale.status}
                showIcon={false}
                className={styles.status}
              />
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {formatListDate(sale.date)} ·{" "}
              {clientName(sale)}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <Money
                currencyClassName={styles.tableCurrency}
                value={salePosition(sale).netTotal}
                className="text-sm font-semibold"
              />
              {salePosition(sale).due > 0 ? (
                <span className="text-xs font-medium text-warning">
                  Reste{" "}
                  <Money
                    currencyClassName={styles.tableCurrency}
                    value={salePosition(sale).due}
                  />
                </span>
              ) : null}
            </div>
          </div>
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      )}
    />
  );
}

export { SalesTable };
