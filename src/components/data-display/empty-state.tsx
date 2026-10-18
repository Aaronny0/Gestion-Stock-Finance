import * as React from "react";
import { Inbox, SearchX, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import styles from "./empty-state.module.css";

type EmptyKind = "first-use" | "no-results" | "error";

interface EmptyStateProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** first-use : rien n'existe encore ; no-results : des filtres masquent tout ; error : chargement impossible. */
  kind?: EmptyKind;
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  steps?: { title: string; description: string }[];
  /** Ajoute « Effacer les filtres » (no-results). */
  onClearFilters?: () => void;
}

const defaultIcons: Record<EmptyKind, LucideIcon> = { "first-use": Inbox, "no-results": SearchX, error: TriangleAlert };
const kindClass: Record<EmptyKind, string> = { "first-use": styles.firstUse, "no-results": styles.noResults, error: styles.error };

/** D29 : état vide propre à chaque écran, jamais générique. */
function EmptyState({ kind = "first-use", title, description, icon, actions, steps, onClearFilters, className, ...props }: EmptyStateProps) {
  const Icon = icon ?? defaultIcons[kind];
  return (
    <div data-empty-kind={kind} role={kind === "error" ? "alert" : undefined} className={cn(styles.empty, kindClass[kind], className)} {...props}>
      <span className={styles.icon}>
        <Icon aria-hidden="true" />
      </span>
      <div>
        <h3 className={styles.title}>{title}</h3>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions || onClearFilters ? (
        <div className={styles.actions}>
          {onClearFilters ? (
            <Button variant="outline" onClick={onClearFilters}>
              <X /> Effacer les filtres
            </Button>
          ) : null}
          {actions}
        </div>
      ) : null}
      {steps?.length ? (
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span>
                <strong>{step.title}</strong>
                <small>{step.description}</small>
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

export { EmptyState };
export type { EmptyKind, EmptyStateProps };
