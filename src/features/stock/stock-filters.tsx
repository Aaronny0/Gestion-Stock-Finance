"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function StockFilters({ brands, brand, condition, low, archived, onBrand, onCondition, onLow, onArchived }: { brands: string[]; brand: string; condition: string; low: boolean; archived: boolean; onBrand: (value: string) => void; onCondition: (value: string) => void; onLow: (value: boolean) => void; onArchived: (value: boolean) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={brand || "all"} onValueChange={(value) => onBrand(value === "all" ? "" : value)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Marque" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Toutes marques</SelectItem>{brands.map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={condition || "all"} onValueChange={(value) => onCondition(value === "all" ? "" : value)}>
        <SelectTrigger className="w-44"><SelectValue placeholder="État" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Tous états</SelectItem>{["Neuf", "Occasion", "Reconditionné"].map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent>
      </Select>
      <Label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium"><Checkbox checked={low} onCheckedChange={(value) => onLow(Boolean(value))} /> Stock faible</Label>
      <Label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium"><Checkbox checked={archived} onCheckedChange={(value) => onArchived(Boolean(value))} /> Archivés</Label>
    </div>
  );
}

export { StockFilters };
