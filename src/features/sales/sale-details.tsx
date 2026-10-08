"use client";

import Link from "next/link";
import { Printer } from "lucide-react";
import { FiscalInvoice } from "@/components/data-display/fiscal-invoice";
import { Money } from "@/components/data-display/money";
import { Button } from "@/components/ui/button";
import { salePosition } from "@/frontend/operations";
import { useWorkspace } from "@/frontend/provider";
import type { Sale } from "@/frontend/types";
import styles from "./sales.module.css";

function SaleDetails({
  sale,
  href,
  canFinance,
  canRefund,
  canAccounting,
  onReceipt,
  onPayment,
  onRefund,
}: {
  sale: Sale;
  href: (path: string) => string;
  canFinance: boolean;
  canRefund: boolean;
  canAccounting: boolean;
  onReceipt: () => void;
  onPayment: () => void;
  onRefund: () => void;
}) {
  const { snapshot, can } = useWorkspace();
  const position = salePosition(sale);
  const client = snapshot!.data.clients.find(
    (client) => client.id === sale.clientId,
  );
  const clientName = String(client?.label ?? "Client de passage");
  const payments = snapshot!.data.payments
    .filter((payment) => payment.sourceId === sale.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const costAvailable = sale.lines.every(
    (line) => line.costTotal !== undefined || line.cost !== undefined,
  );
  return (
    <div className={styles.detail}>
      <div className={styles.body}>
        <div className={styles.customer}>
          <span>
            {clientName
              .split(/\s+/)
              .map((word) => word[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <strong>{clientName}</strong>
            <small>{String(client?.phone ?? "Sans numéro renseigné")}</small>
          </div>
        </div>
        <section>
          <h3>
            Articles ·{" "}
            {sale.lines.reduce((sum, line) => sum + line.quantity, 0)} unités
          </h3>
          {sale.lines.map((line, index) => (
            <div className={styles.article} key={index}>
              <div>
                <strong>{line.label}</strong>
                <small>
                  {line.imei ? `IMEI ${line.imei}` : `${line.quantity} × `}
                  {!line.imei && (
                    <Money currencyDisplay="code" value={line.price} />
                  )}
                </small>
              </div>
              <Money
                currencyDisplay="code"
                value={line.price * line.quantity}
                currencyClassName={styles.tableCurrency}
              />
            </div>
          ))}
          <div className={styles.totals}>
            {sale.discount > 0 && (
              <div>
                <span>Remise</span>
                <Money currencyDisplay="code" value={-sale.discount} />
              </div>
            )}
            <div>
              <span>Montant net</span>
              <Money currencyDisplay="code" value={position.netTotal} />
            </div>
            <div>
              <span>Encaissé</span>
              <Money currencyDisplay="code" value={position.netPaid} />
            </div>
            <div className={position.due > 0 ? styles.warning : undefined}>
              <span>Reste dû</span>
              <Money currencyDisplay="code" value={position.due} />
            </div>
          </div>
        </section>
        {can("analytics.cost_margin_read") && costAvailable && (
          <div className={styles.margin}>
            <span>
              <i />
              Marge brute
            </span>
            <strong>
              <Money
                currencyDisplay="code"
                value={position.netIncome - position.netCost}
              />
            </strong>
          </div>
        )}
        <section>
          <h3>Paiements</h3>
          {payments.length ? (
            payments.map((payment) => (
              <div
                key={payment.id}
                className={styles.payment}
                data-out={payment.direction === "out"}
              >
                <div>
                  <strong>{payment.method}</strong>
                  <small>
                    {" "}
                    ·{" "}
                    {new Date(payment.date).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </div>
                <Money
                  currencyDisplay="code"
                  value={
                    payment.direction === "in"
                      ? payment.amount
                      : -payment.amount
                  }
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun paiement enregistré.
            </p>
          )}
        </section>
        {!!sale.fiscalInvoices?.length && (
          <section>
            <h3>Factures fiscales</h3>
            {sale.fiscalInvoices.map((invoice) => (
              <FiscalInvoice key={invoice.id} invoice={invoice} />
            ))}
          </section>
        )}
        {!!sale.returns?.length && (
          <section data-qa="return-history">
            <h3>Historique des retours</h3>
            {sale.returns.map((entry) => (
              <div key={entry.id} className={styles.returns}>
                <strong>
                  Retour du {new Date(entry.date).toLocaleDateString("fr-FR")}
                </strong>
                <p>
                  {entry.reason} · Remboursé :{" "}
                  <Money currencyDisplay="code" value={entry.cashRefund} />
                </p>
                <small>
                  {entry.lines
                    .map(
                      (line) =>
                        `${line.quantity} × ${sale.lines[line.lineIndex].label} (${line.restock ? "remis en stock" : "défectueux"})`,
                    )
                    .join(" · ")}
                </small>
              </div>
            ))}
          </section>
        )}
        {canAccounting && (
          <Link className={styles.accounting} href={href("/accounting")}>
            Voir les écritures comptables →
          </Link>
        )}
      </div>
      <div className={styles.detailFooter}>
        <Button
          variant="outline"
          onClick={onReceipt}
          aria-label="Voir le reçu / Imprimer"
        >
          <Printer size={15} /> Reçu
        </Button>
        {canRefund && sale.status !== "refunded" && (
          <Button
            variant="ghost"
            className={styles.refund}
            onClick={onRefund}
            aria-label="Retourner / rembourser"
          >
            Retour client
          </Button>
        )}
        {position.due > 0 && canFinance && (
          <Button
            className={styles.collect}
            onClick={onPayment}
            aria-label="Enregistrer un paiement"
          >
            Encaisser{" "}
            <Money
              currencyDisplay="code"
              value={position.due}
              currencyClassName={styles.tableCurrency}
            />
          </Button>
        )}
      </div>
    </div>
  );
}
export { SaleDetails };
