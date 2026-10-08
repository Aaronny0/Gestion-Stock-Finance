import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Money } from "@/components/data-display/money";
import { StatusBadge } from "@/components/data-display/status-badge";
import { salePosition } from "@/frontend/operations";
import type { Sale } from "@/frontend/types";
import styles from "./dashboard.module.css";
export function DashboardRecentSales({
  sales,
  currency,
  href,
  historyHref,
}: {
  sales: Sale[];
  currency: string;
  href: (path: string) => string;
  historyHref: string;
}) {
  return (
    <section
      className={`${styles.card} ${styles.salesCard}`}
      aria-labelledby="recent-sales-title"
    >
      <div className={styles.cardHeading}>
        <h2 id="recent-sales-title">Dernières ventes</h2>
        <Link href={historyHref}>
          Voir l’historique <ArrowRight size={14} />
        </Link>
      </div>
      {sales.length ? (
        <>
          <table className={styles.salesTable}>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Article</th>
                <th>Vendeur</th>
                <th>Statut</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <Link href={href(`/sales/${sale.id}`)}>
                      {sale.reference}
                    </Link>
                    <small>
                      {new Date(sale.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      ·{" "}
                      {new Date(sale.date).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </td>
                  <td>{sale.lines.map((line) => line.label).join(" + ")}</td>
                  <td>{sale.seller}</td>
                  <td>
                    <StatusBadge value={sale.status} showIcon={false} />
                  </td>
                  <td>
                    <Money
                      currencyClassName={styles.tableCurrency}
                      currencyDisplay="code"
                      value={salePosition(sale).netTotal}
                      currency={currency}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.mobileSales}>
            {sales.map((sale) => (
              <Link href={href(`/sales/${sale.id}`)} key={sale.id}>
                <span>
                  <strong>{sale.reference}</strong>
                  <small>
                    {sale.lines.map((line) => line.label).join(" + ")}
                  </small>
                  <small>
                    {new Date(sale.date).toLocaleDateString("fr-FR")} ·{" "}
                    {sale.seller}
                  </small>
                </span>
                <span>
                  <StatusBadge value={sale.status} showIcon={false} />
                  <Money
                    currencyClassName={styles.tableCurrency}
                    currencyDisplay="code"
                    value={salePosition(sale).netTotal}
                    currency={currency}
                  />
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <p className={styles.empty}>
          Aucune vente sur la période sélectionnée.
        </p>
      )}
    </section>
  );
}
