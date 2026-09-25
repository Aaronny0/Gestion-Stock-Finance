"use client";

import Link from "next/link";
import { LogOut, Settings, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { roleLabels, type UserSession } from "@/frontend/types";

interface UserMenuProps {
  session?: UserSession;
  settingsHref?: string;
  canOpenSettings?: boolean;
  onLogout: () => void;
}

function initials(name?: string) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "V"
  );
}

export function UserMenu({ session, settingsHref = "/settings", canOpenSettings, onLogout }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 items-center gap-2 rounded-md px-1.5 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:pr-2"
          aria-label="Ouvrir le menu utilisateur"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
            {initials(session?.user.name)}
          </span>
          <span className="hidden min-w-0 lg:block">
            <span className="block max-w-32 truncate text-sm font-semibold text-foreground">
              {session?.user.name ?? "Mon compte"}
            </span>
            <span className="block text-xs text-muted-foreground">
              {session ? roleLabels[session.user.role] : ""}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <span className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block truncate">{session?.user.name ?? "Mon compte"}</span>
              <span className="block text-xs font-normal text-muted-foreground">
                {session ? roleLabels[session.user.role] : ""}
              </span>
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canOpenSettings && (
          <DropdownMenuItem asChild>
            <Link href={settingsHref}>
              <Settings className="size-4" /> Paramètres
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="size-4" /> Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
