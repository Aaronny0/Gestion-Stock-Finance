"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Money } from "@/components/data-display/money";
import { cn } from "@/lib/utils";
import styles from "./summary-strip.module.css";

/** D28 : bande de 2 à 4 totaux, une ligne puis 2 × 2 sous 860 px de largeur utile. */
function SummaryStrip({ className, children, ...props }: React.ComponentProps<"section">) {
  return (
    <section className={cn(styles.strip, className)} {...props}>
      <div className={styles.grid}>{children}</div>
    </section>
  );
}

interface SummaryItemProps {
  label: React.ReactNode;
  /** Valeur affichée telle quelle ; ignorée si `money` est fourni. */
  value?: React.ReactNode;
  /** Montant en unités mineures, formaté avec le code devise en petit. */
  money?: number;
  /** Complément discret à droite de la valeur (« dont 2 en rupture »). */
  note?: React.ReactNode;
  meta?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "warning";
  /** Rend la cellule cliquable (`button aria-pressed`), par exemple pour filtrer la liste. */
  pressed?: boolean;
  onPress?: () => void;
}

function SummaryItem({ label, value, money, note, meta, icon: Icon, tone = "default", pressed, onPress }: SummaryItemProps) {
  const content = (
    <>
      <span className={styles.label}>
        {Icon ? <Icon aria-hidden="true" /> : null}
        {label}
      </span>
      <strong className={styles.value}>
        {money !== undefined ? <Money value={money} currencyDisplay="code" currencyClassName={styles.currency} /> : value}
        {note ? <span className={styles.note}> {note}</span> : null}
      </strong>
      {meta ? <span className={styles.meta}>{meta}</span> : null}
    </>
  );
  const className = cn(styles.item, tone === "warning" && styles.warning, onPress && styles.pressable);
  if (onPress)
    return (
      <button type="button" className={className} aria-pressed={!!pressed} onClick={onPress}>
        {content}
      </button>
    );
  return <div className={className}>{content}</div>;
}

function SummaryStripSkeleton({ count, ...props }: { count: number } & React.ComponentProps<"section">) {
  return (
    <SummaryStrip aria-busy="true" aria-label="Chargement de la synthèse" {...props}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.item}>
          <span className={styles.skeleton} />
          <span className={styles.skeleton} />
        </div>
      ))}
    </SummaryStrip>
  );
}
SummaryStrip.Skeleton = SummaryStripSkeleton;

export { SummaryStrip, SummaryItem };
export type { SummaryItemProps };
