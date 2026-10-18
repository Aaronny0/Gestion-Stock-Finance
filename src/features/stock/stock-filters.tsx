"use client";

import { Archive, TriangleAlert, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import styles from "@/features/stock/stock.module.css";

function StockFilters({ brands, brand, condition, low, archived, onBrand, onCondition, onLow, onArchived, onReset }: { brands: string[]; brand: string; condition: string; low: boolean; archived: boolean; onBrand: (value: string) => void; onCondition: (value: string) => void; onLow: (value: boolean) => void; onArchived: (value: boolean) => void; onReset?: () => void }) {
  const active = Boolean(brand || condition || low || archived);
  return (
    <div className={styles.filters}>
      <Select value={brand || "all"} onValueChange={(value) => onBrand(value === "all" ? "" : value)}>
        <SelectTrigger className="w-36" aria-label="Marque"><SelectValue placeholder="Marque" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Toutes marques</SelectItem>{brands.map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={condition || "all"} onValueChange={(value) => onCondition(value === "all" ? "" : value)}>
        <SelectTrigger className="w-36" aria-label="État"><SelectValue placeholder="État" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Tous états</SelectItem>{["Neuf", "Occasion", "Reconditionné"].map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent>
      </Select>
      <button type="button" className={cn(styles.chip, styles.chipWarning)} aria-pressed={low} onClick={() => onLow(!low)}><TriangleAlert aria-hidden="true" /> Stock faible</button>
      <button type="button" className={styles.chip} aria-pressed={archived} onClick={() => onArchived(!archived)}><Archive aria-hidden="true" /> Archivés</button>
      {active && onReset ? <button type="button" className={cn(styles.chip, styles.chipIcon)} onClick={onReset} aria-label="Effacer les filtres" title="Effacer les filtres"><X aria-hidden="true" /></button> : null}
    </div>
  );
}

export { StockFilters };
