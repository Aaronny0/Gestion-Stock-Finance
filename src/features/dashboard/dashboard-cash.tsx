import Link from "next/link";
import { Money } from "@/components/data-display/money";
import { useWorkspace } from "@/frontend/provider";
import styles from "./dashboard.module.css";
export function DashboardCash({ cashHref }: { cashHref: string }) {
  const { snapshot, storeId, start, end, can } = useWorkspace();
  const { data: db, session } = snapshot!;
  const stores = session.stores.filter(
    (store) => storeId === "all" || store.id === storeId,
  );
  const payments = db.payments.filter(
    (payment) =>
      (storeId === "all" || payment.storeId === storeId) &&
      payment.date.slice(0, 10) >= start &&
      payment.date.slice(0, 10) <= end &&
      payment.direction === "in",
  );
  const amounts =
    snapshot!.reporting?.paymentBreakdown ??
    Object.entries(
      payments.reduce<Record<string, number>>((all, payment) => {
        all[payment.method] = (all[payment.method] ?? 0) + payment.amount;
        return all;
      }, {}),
    );
  const total = amounts.reduce((sum, [, value]) => sum + Math.max(0, value), 0);
  const methods = ["Espèces", "Mobile Money", "Carte"];
  const list = [...amounts].sort(
    (a, b) => methods.indexOf(a[0]) - methods.indexOf(b[0]),
  );
  return (
    <section className={styles.card} aria-labelledby="cash-title">
      <div className={styles.cardHeading}>
        <h2 id="cash-title">Caisses & paiements</h2>
        <Link href={cashHref}>Trésorerie</Link>
      </div>
      <div className={styles.cashList}>
        {stores.map((store) => {
          const cash = db.cash
            .filter((row) => row.storeId === store.id)
            .sort((a, b) =>
              String(b.openedAt ?? b.date).localeCompare(
                String(a.openedAt ?? a.date),
              ),
            )[0];
          const open = cash?.status === "open";
          const balanceAvailable =
            open && !snapshot!.reporting && !snapshot!.pagination?.hasMore;
          const balance =
            cash?.theoretical !== undefined
              ? Number(cash.theoretical)
              : balanceAvailable
                ? Number(cash?.opening ?? 0) +
                  db.payments
                    .filter(
                      (payment) =>
                        payment.storeId === store.id &&
                        payment.method === "Espèces" &&
                        payment.date >= String(cash?.openedAt ?? "9999"),
                    )
                    .reduce(
                      (sum, payment) =>
                        sum +
                        (payment.direction === "in"
                          ? payment.amount
                          : -payment.amount),
                      0,
                    )
                : undefined;
          return (
            <Link key={store.id} href={cashHref} className={styles.cashRow}>
              <span className={styles.cashDot} data-open={open} />
              <span>
                <strong>{store.name}</strong>
                <small>
                  {open
                    ? "Ouverte"
                    : cash
                      ? "Clôturée"
                      : "Aucune caisse ouverte"}
                  {open && cash?.openedAt
                    ? ` depuis ${new Date(String(cash.openedAt)).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                    : ""}
                </small>
              </span>
              {balance !== undefined && Number.isFinite(balance) ? (
                <span className={styles.cashBalance}>
                  <Money
                    value={balance}
                    currency={session.organization.currency}
                  />
                  <small>solde théorique</small>
                </span>
              ) : (
                <span className={styles.cashStatus}>
                  {open ? "Ouverte" : "Fermée"}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <h3 className={styles.paymentTitle}>
        Encaissements par moyen de paiement
      </h3>
      {total > 0 ? (
        <>
          <div className={styles.paymentBar} aria-hidden="true">
            {list.map(([method, value]) => (
              <span
                key={method}
                data-method={method}
                style={{ width: `${(Math.max(0, value) / total) * 100}%` }}
              />
            ))}
          </div>
          <div className={styles.paymentRows}>
            {list.map(([method, value]) => (
              <Link href={cashHref} key={method}>
                <span>
                  <i data-method={method} />
                  {method}
                </span>
                <Money value={value} currency={session.organization.currency} />
              </Link>
            ))}
          </div>
        </>
      ) : (
        <p className={styles.muted}>Aucun encaissement sur cette période.</p>
      )}
      {can("cash.open_close") && (
        <Link className={styles.outlineAction} href={cashHref}>
          {db.cash.some(
            (row) =>
              row.status === "open" &&
              (storeId === "all" || row.storeId === storeId),
          )
            ? "Gérer et clôturer les caisses"
            : "Ouvrir une caisse"}
        </Link>
      )}
    </section>
  );
}
