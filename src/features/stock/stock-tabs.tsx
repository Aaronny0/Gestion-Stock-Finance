"use client";

import Link from "next/link";
import { useWorkspace } from "@/frontend/provider";
import { cn } from "@/lib/utils";
import styles from "@/features/stock/stock.module.css";

const views = [
  { id: "catalog", label: "Catalogue", path: "/stock" },
  { id: "entries", label: "Entrées & ajustements", path: "/stock/entries" },
  { id: "transfers", label: "Transferts", path: "/stock/transfers" },
  { id: "replenishment", label: "Réapprovisionnement", path: "/stock/replenishment" },
];

function StockTabs({ current, catalogCount, lowCount }: { current: string; catalogCount?: number; lowCount?: number }) {
  const { href } = useWorkspace();
  return (
    <nav className={styles.tabs} aria-label="Vues du stock">
      {views.map((view) => {
        const count = view.id === "catalog" ? catalogCount : view.id === "replenishment" ? lowCount : undefined;
        return (
          <Link key={view.id} href={href(view.path)} aria-current={current === view.id ? "page" : undefined}>
            {view.label}
            {count ? <><span className={cn(styles.count, view.id === "replenishment" && styles.countWarning)} aria-hidden="true">{count}</span><span className="sr-only">, {count} références</span></> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export { StockTabs };
