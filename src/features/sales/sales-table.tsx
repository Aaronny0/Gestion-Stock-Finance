"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}: {
  sales: Sale[];
  onOpen: (sale: Sale) => void;
  canExport: boolean;
  filters?: ReactNode;
  search?: string;
  onSearch?: (value: string) => void;
  onReset?: () => void;
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
            {new Date(row.original.date).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
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
      filters={filters}
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
        <div className={styles.state}>
          <span className={styles.stateIcon}>
            <ReceiptText size={20} />
          </span>
          <strong>Aucune vente sur cette période</strong>
          <p>
            Modifiez la période ou les filtres, ou enregistrez une nouvelle
            vente depuis la caisse.
          </p>
          <Button variant="outline" onClick={onReset}>
            Effacer les filtres
          </Button>
        </div>
      }
      emptyTitle="Aucune vente sur cette période"
      emptyDescription="Modifiez la période ou enregistrez une nouvelle vente depuis la caisse."
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
              {new Date(sale.date).toLocaleDateString("fr-FR")} ·{" "}
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
