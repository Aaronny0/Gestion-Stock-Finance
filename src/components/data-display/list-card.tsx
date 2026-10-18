"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import styles from "./list-card.module.css";

/** D28 : carte de liste (onglets facultatifs + DataTable). Container query `list` pour la bascule en cartes. */
function ListCard({ tabs, children, className, ...props }: { tabs?: React.ReactNode; children: React.ReactNode } & React.ComponentProps<"section">) {
  return (
    <section className={cn(styles.card, className)} {...props}>
      {tabs}
      {children}
    </section>
  );
}

interface TabItem {
  label: string;
  count?: number;
  tone?: "warning";
}
type LinkTabs = { items: (TabItem & { href: string; active: boolean })[]; "aria-label"?: string };
type ValueTabs = { items: (TabItem & { value: string })[]; value: string; onValueChange: (value: string) => void; "aria-label": string };

function Count({ count, tone }: TabItem) {
  if (count === undefined) return null;
  return <span className={cn(styles.count, tone === "warning" && styles.countWarning)}>{count}</span>;
}

/** Onglets soulignés : liens (`aria-current`) ou valeurs (`role="tablist"`, flèches, Début, Fin). */
function ListTabs(props: LinkTabs | ValueTabs) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  if (!("onValueChange" in props))
    return (
      <nav className={styles.tabs} aria-label={props["aria-label"] ?? "Sections"}>
        {props.items.map((item) => (
          <Link key={item.href} href={item.href} className={styles.tab} aria-current={item.active ? "page" : undefined}>
            {item.label}
            <Count {...item} />
          </Link>
        ))}
      </nav>
    );
  const { items, value, onValueChange } = props;
  const move = (index: number) => {
    const next = (index + items.length) % items.length;
    onValueChange(items[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={props["aria-label"]} className={styles.tabs}>
      {items.map((item, index) => (
        <button
          key={item.value}
          ref={(element) => {
            refs.current[index] = element;
          }}
          type="button"
          role="tab"
          aria-selected={item.value === value}
          tabIndex={item.value === value ? 0 : -1}
          className={styles.tab}
          onClick={() => onValueChange(item.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") move(index + 1);
            else if (event.key === "ArrowLeft") move(index - 1);
            else if (event.key === "Home") move(0);
            else if (event.key === "End") move(items.length - 1);
            else return;
            event.preventDefault();
          }}
        >
          {item.label}
          <Count {...item} />
        </button>
      ))}
    </div>
  );
}

export { ListCard, ListTabs };
