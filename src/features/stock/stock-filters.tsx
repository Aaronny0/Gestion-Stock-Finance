"use client";

import { Archive, TriangleAlert } from "lucide-react";
import { ClearFiltersButton, FilterChip } from "@/components/ui/filter-chip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      <FilterChip tone="warning" icon={TriangleAlert} pressed={low} onPressedChange={onLow}>Stock faible</FilterChip>
      <FilterChip icon={Archive} pressed={archived} onPressedChange={onArchived}>Archivés</FilterChip>
      {active && onReset ? <ClearFiltersButton onClick={onReset} /> : null}
    </div>
  );
}

export { StockFilters };
