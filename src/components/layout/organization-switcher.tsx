"use client";

import { Building2, Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Organization } from "@/frontend/types";

interface OrganizationSwitcherProps {
  organization?: Organization;
  organizations?: Organization[];
  compact?: boolean;
  onChange: (id: string) => void;
}

export function OrganizationSwitcher({
  organization,
  organizations = [],
  compact = false,
  onChange,
}: OrganizationSwitcherProps) {
  const initial = organization?.name.slice(0, 1).toUpperCase() ?? "V";
  const hasMultiple = organizations.length > 1;

  if (!hasMultiple) {
    return (
      <div
        className={cn(
          "flex min-h-12 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2",
          compact && "justify-center px-2",
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
          {initial}
        </span>
        {!compact && (
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {organization?.name ?? "Votre entreprise"}
            </span>
            <span className="block truncate text-xs text-muted-foreground">Espace professionnel</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-h-12 w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            compact && "justify-center px-2",
          )}
          aria-label="Changer d’organisation"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
            {initial}
          </span>
          {!compact && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {organization?.name ?? "Votre entreprise"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">Organisation active</span>
              </span>
              <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="size-4" /> Organisations
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((item) => {
          const active = item.id === organization?.id;
          return (
            <DropdownMenuItem key={item.id} onSelect={() => onChange(item.id)}>
              <span className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                {item.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              {active && <Check className="size-4 text-primary" aria-label="Organisation active" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
