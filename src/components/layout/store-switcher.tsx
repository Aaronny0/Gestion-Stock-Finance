"use client";

import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Store } from "@/frontend/types";

interface StoreSwitcherProps {
  stores: Store[];
  value: string;
  allowAll: boolean;
  onChange: (id: string) => void;
}

export function StoreSwitcher({ stores, value, allowAll, onChange }: StoreSwitcherProps) {
  const activeStores = stores.filter((store) => store.active);

  if (activeStores.length <= 1) {
    return (
      <div className="hidden min-h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground sm:flex">
        <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="max-w-40 truncate">{activeStores[0]?.name ?? "Boutique"}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <MapPin className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 min-h-10 w-[150px] border-border shadow-none sm:w-[190px]" aria-label="Boutique active">
          <SelectValue placeholder="Choisir une boutique" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" disabled={!allowAll}>
            Toutes les boutiques
          </SelectItem>
          {activeStores.map((store) => (
            <SelectItem value={store.id} key={store.id}>
              {store.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
