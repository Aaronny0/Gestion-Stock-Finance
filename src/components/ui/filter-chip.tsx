"use client";

import * as React from "react";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./filter-chip.module.css";

interface FilterChipProps extends Omit<React.ComponentProps<"button">, "onClick" | "type"> {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  count?: number;
  tone?: "default" | "warning";
  icon?: LucideIcon;
}

/** D28 : filtre booléen ou statut de liste, en bouton bascule `aria-pressed`. */
function FilterChip({ pressed, onPressedChange, count, tone = "default", icon: Icon, className, children, ...props }: FilterChipProps) {
  return (
    <button type="button" aria-pressed={pressed} onClick={() => onPressedChange(!pressed)} className={cn(styles.chip, tone === "warning" && styles.warning, className)} {...props}>
      {Icon ? <Icon aria-hidden="true" /> : null}
      {children}
      {count !== undefined ? <span className={styles.count}>{count}</span> : null}
    </button>
  );
}

/** Bouton icône de la barre d'outils qui remet les filtres à zéro. */
function ClearFiltersButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={cn(styles.chip, styles.icon)} onClick={onClick} aria-label="Effacer les filtres" title="Effacer les filtres">
      <X aria-hidden="true" />
    </button>
  );
}

export { FilterChip, ClearFiltersButton };
