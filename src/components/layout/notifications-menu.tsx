"use client";

import { Bell, CircleAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ShellNotification {
  id: string;
  label: string;
  tone?: "warning" | "info";
}

export function NotificationsMenu({ items }: { items: ShellNotification[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell />
          {items.length > 0 && (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications système</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">Aucune notification active.</div>
        ) : (
          <div className="space-y-1 p-1">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-md px-2 py-2.5 text-sm">
                {item.tone === "warning" ? (
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                ) : (
                  <Info className="mt-0.5 size-4 shrink-0 text-info" />
                )}
                <span className="leading-5 text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
