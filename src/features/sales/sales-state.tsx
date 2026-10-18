import { CloudOff } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/data-display/empty-state";
import { ListCard } from "@/components/data-display/list-card";
import { SummaryStrip } from "@/components/data-display/summary-strip";
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
      {!error && <SummaryStrip.Skeleton count={4} />}
      <ListCard>
        {error ? (
          <EmptyState
            kind="error"
            icon={CloudOff}
            title="Impossible de charger les ventes"
            description={error}
            actions={onRetry ? <Button variant="outline" onClick={onRetry}>Réessayer</Button> : undefined}
          />
        ) : (
          <div role="status" aria-label="Chargement des ventes" aria-busy="true">
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
      </ListCard>
    </div>
  );
}
