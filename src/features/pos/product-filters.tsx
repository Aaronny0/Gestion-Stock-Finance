"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductFiltersProps {
  brands: string[];
  value: string;
  onChange: (brand: string) => void;
}

export function ProductFilters({ brands, value, onChange }: ProductFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Filtrer les produits par marque">
      {brands.map((brand) => (
        <Button
          key={brand}
          type="button"
          size="sm"
          variant={value === brand ? "default" : "outline"}
          className={cn("shrink-0", value === brand && "shadow-none")}
          aria-pressed={value === brand}
          onClick={() => onChange(brand)}
        >
          {brand}
        </Button>
      ))}
    </div>
  );
}
