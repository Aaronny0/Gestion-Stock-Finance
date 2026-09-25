"use client";

import Link from "next/link";
import { BookOpen, Menu, Package, Repeat2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AppLogo } from "@/components/layout/app-logo";
import { SidebarNavigation, type SidebarNavigationProps } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";
import type { Permission } from "@/frontend/types";

interface MobileNavigationProps extends SidebarNavigationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { path: "/pos", label: "Vendre", permission: "sales.create" as Permission, icon: ShoppingCart },
  { path: "/stock", label: "Stock", permission: "stock.read" as Permission, icon: Package },
  { path: "/trade", label: "Troc", permission: "trade.create" as Permission, icon: Repeat2 },
  { path: "/accounting", label: "Compta", permission: "accounting.read" as Permission, icon: BookOpen },
];

function shortcutActive(path: string, itemPath: string) {
  return path === itemPath || path.startsWith(`${itemPath}/`) || (itemPath === "/stock" && path.startsWith("/products/"));
}

export function MobileNavigation({ open, onOpenChange, ...props }: MobileNavigationProps) {
  const visible = shortcuts.filter((item) => props.can(item.permission)).slice(0, 3);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="flex w-[88%] max-w-[340px] flex-col p-0 sm:max-w-[340px]">
          <SheetTitle className="sr-only">Navigation VORTEX</SheetTitle>
          <div className="flex h-[72px] items-center border-b border-border px-5">
            <AppLogo href={props.href("/")} />
          </div>
          <SidebarNavigation {...props} onNavigate={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex min-h-16 border-t border-border bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Raccourcis mobiles"
      >
        {visible.map((item) => {
          const Icon = item.icon;
          const active = shortcutActive(props.path, item.path);
          return (
            <Link
              key={item.path}
              href={props.href(item.path)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-semibold text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "text-primary",
              )}
            >
              <Icon className="size-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          aria-expanded={open}
          className="flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-semibold text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="size-5" />
          Menu
        </button>
      </nav>
    </>
  );
}

export function MobileMenuButton({ onClick, expanded }: { onClick: () => void; expanded: boolean }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={onClick}
      aria-label="Ouvrir le menu"
      aria-expanded={expanded}
    >
      <Menu />
    </Button>
  );
}
