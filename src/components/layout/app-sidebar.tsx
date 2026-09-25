"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Package,
  ReceiptText,
  Repeat2,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Truck,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { OrganizationSwitcher } from "@/components/layout/organization-switcher";
import { AppLogo } from "@/components/layout/app-logo";
import { cn } from "@/lib/utils";
import { navigation } from "@/frontend/navigation";
import type { Permission, UserSession } from "@/frontend/types";

const icons: Record<string, LucideIcon> = {
  home: LayoutDashboard,
  chart: BarChart3,
  cart: ShoppingCart,
  receipt: ReceiptText,
  box: Package,
  repeat: Repeat2,
  phone: Smartphone,
  bag: ShoppingBag,
  truck: Truck,
  users: Users,
  wallet: WalletCards,
  out: CircleDollarSign,
  card: CreditCard,
  book: BookOpen,
  clock: Clock3,
  settings: Settings,
};

export interface SidebarNavigationProps {
  path: string;
  href: (path: string) => string;
  can: (permission: Permission) => boolean;
  session?: UserSession;
  storeId: string;
  stockAlertCount?: number;
  compact?: boolean;
  onNavigate?: () => void;
  onOrganizationChange: (id: string) => void;
}

function isActive(path: string, itemPath: string) {
  if (itemPath === "/") return path === "/";
  return (
    path === itemPath ||
    path.startsWith(`${itemPath}/`) ||
    (itemPath === "/stock" && path.startsWith("/products/"))
  );
}

function NavigationLink({
  label,
  itemPath,
  icon: Icon,
  active,
  href,
  compact,
  badge,
  onNavigate,
}: {
  label: string;
  itemPath: string;
  icon: LucideIcon;
  active: boolean;
  href: string;
  compact: boolean;
  badge?: number;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      data-qa="nav-item"
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-accent text-accent-foreground shadow-[inset_3px_0_0_var(--primary)]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        compact && "justify-center px-2",
      )}
    >
      <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} aria-hidden="true" />
      {!compact && <span className="min-w-0 flex-1 truncate">{label}</span>}
      {!compact && badge !== undefined && badge > 0 && (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-warning-background px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-warning">
          {badge}
        </span>
      )}
      {compact && badge !== undefined && badge > 0 && (
        <span className="absolute right-1 top-1 size-2 rounded-full bg-warning" aria-label={`${badge} alertes`} />
      )}
    </Link>
  );

  if (!compact) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function SidebarNavigation({
  path,
  href,
  can,
  session,
  storeId,
  stockAlertCount = 0,
  compact = false,
  onNavigate,
  onOrganizationChange,
}: SidebarNavigationProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn("px-3 pb-5 pt-1", compact && "px-2")}>
        <OrganizationSwitcher
          organization={session?.organization}
          organizations={session?.organizations}
          compact={compact}
          onChange={onOrganizationChange}
        />
      </div>

      <nav aria-label="Navigation principale" className="min-h-0 flex-1 overflow-y-auto px-3 pb-5">
        <div className="space-y-5">
          {navigation.map((section) => {
            const items = section.items.filter(
              (item) => can(item.permission) || (item.path === "/cash" && can("finance.read")),
            );
            if (!items.length) return null;

            return (
              <section key={section.section} aria-labelledby={`nav-${section.section.toLowerCase()}`}>
                {!compact && (
                  <h2
                    id={`nav-${section.section.toLowerCase()}`}
                    className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    {section.section}
                  </h2>
                )}
                {compact && <span className="sr-only">{section.section}</span>}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = icons[item.icon] ?? LayoutDashboard;
                    return (
                      <NavigationLink
                        key={item.path}
                        label={item.label}
                        itemPath={item.path}
                        icon={Icon}
                        active={isActive(path, item.path)}
                        href={href(item.path)}
                        compact={compact}
                        badge={item.path === "/stock" ? stockAlertCount : undefined}
                        onNavigate={onNavigate}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </nav>

      <div className={cn("border-t border-border/80 px-4 py-4", compact && "px-2")}>
        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", compact && "justify-center") }>
          <span className="size-2 rounded-full bg-success" aria-hidden="true" />
          {!compact && <span>{storeId === "all" ? "Vue consolidée" : "Espace sécurisé"}</span>}
        </div>
        {!compact && <p className="mb-0 mt-1 text-[11px] text-muted-foreground">VORTEX · Version 1.0</p>}
      </div>
    </div>
  );
}

interface AppSidebarProps extends SidebarNavigationProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function AppSidebar({ collapsed, onCollapsedChange, ...props }: AppSidebarProps) {
  return (
    <aside
      data-qa="workspace-sidebar"
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border/80 bg-card/95 shadow-[8px_0_24px_rgb(32_42_46_/_0.03)] transition-[width] duration-200 lg:flex",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className={cn("flex h-[72px] items-center border-b border-border px-5", collapsed && "justify-center px-2")}>
        <AppLogo href={props.href("/")} compact={collapsed} />
      </div>
      <SidebarNavigation {...props} compact={collapsed} />
      <Button
        variant="outline"
        size="icon"
        className="absolute -right-5 top-24 size-9 rounded-full bg-card shadow-sm"
        onClick={() => onCollapsedChange(!collapsed)}
        aria-label={collapsed ? "Déployer la barre latérale" : "Réduire la barre latérale"}
      >
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </Button>
    </aside>
  );
}
