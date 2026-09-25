"use client";

import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { MobileMenuButton } from "@/components/layout/mobile-navigation";
import { NotificationsMenu, type ShellNotification } from "@/components/layout/notifications-menu";
import { StoreSwitcher } from "@/components/layout/store-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import type { UserSession } from "@/frontend/types";

interface TopbarProps {
  path: string;
  href: (path: string) => string;
  session?: UserSession;
  storeId: string;
  allowAllStores: boolean;
  notifications: ShellNotification[];
  canOpenSettings: boolean;
  mobileOpen: boolean;
  onOpenMobile: () => void;
  onStoreChange: (id: string) => void;
  onLogout: () => void;
}

export function Topbar({
  path,
  href,
  session,
  storeId,
  allowAllStores,
  notifications,
  canOpenSettings,
  mobileOpen,
  onOpenMobile,
  onStoreChange,
  onLogout,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-border/80 bg-background/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-5 xl:px-7">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <MobileMenuButton onClick={onOpenMobile} expanded={mobileOpen} />
        <AppBreadcrumb path={path} href={href} />
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {session && (
          <StoreSwitcher stores={session.stores} value={storeId} allowAll={allowAllStores} onChange={onStoreChange} />
        )}
        <NotificationsMenu items={notifications} />
        <UserMenu
          session={session}
          settingsHref={href("/settings")}
          canOpenSettings={canOpenSettings}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
