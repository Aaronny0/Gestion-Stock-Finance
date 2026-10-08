import { CloudOff } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import styles from "./sales.module.css";

export function SalesState({
  error,
  onRetry,
}: {
  error?: string;
  onRetry?: () => void;
}) {
  return (
    <div className={styles.page}>
      <PageHeader
        title="Ventes"
        description="Reçus, encaissements, crédits et retours de la boutique."
      />
      {!error && (
        <div className={styles.summary} aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <div key={index}>
              <i className={styles.placeholder} />
              <i className={styles.placeholder} />
            </div>
          ))}
        </div>
      )}
      <section className={styles.ledger}>
        {error ? (
          <div className={styles.state} role="alert">
            <span className={styles.stateIcon} data-error>
              <CloudOff size={20} />
            </span>
            <strong>Impossible de charger les ventes</strong>
            <p>{error}</p>
            <Button variant="outline" onClick={onRetry}>
              Réessayer
            </Button>
          </div>
        ) : (
          <div
            role="status"
            aria-label="Chargement des ventes"
            aria-busy="true"
          >
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div key={index} className={styles.skeletonRow}>
                <i />
                <i />
                <span />
                <i />
                <i />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
