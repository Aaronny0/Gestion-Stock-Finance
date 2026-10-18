"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import styles from "./segmented-control.module.css";

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onValueChange: (value: T) => void;
  "aria-label": string;
  className?: string;
}

/** D28 : choix exclusif parmi quelques options (périodes de Ventes, préréglages du dashboard). */
function SegmentedControl<T extends string>({ options, value, onValueChange, className, ...props }: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={props["aria-label"]} className={cn(styles.group, className)}>
      {options.map((option) => (
        <button key={option.value} type="button" className={styles.option} aria-pressed={option.value === value} onClick={() => onValueChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

export { SegmentedControl };
