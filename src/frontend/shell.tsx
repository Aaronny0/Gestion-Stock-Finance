"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpen, Check, X } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Topbar } from "@/components/layout/topbar";
import type { ShellNotification } from "@/components/layout/notifications-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspaceProvider, useWorkspace, publicRoutes } from "./provider";
import { canonical, routePermission } from "./navigation";
import { Alert, Skeleton } from "./ui";
import { roleLabels, type Role } from "./types";
import { api } from "./api";
import { cn } from "@/lib/utils";

function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const path = canonical(pathname);
  const {
    snapshot,
    loading,
    error,
    demo,
    can,
    href,
    storeId,
    setStoreId,
    reload,
    setRole,
    notice,
    setNotice,
    setOrganization,
    confirmDiscard,
    goBack,
    locationKey,
  } = useWorkspace();

  const [offline, setOffline] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = snapshot?.session;

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (session && path === "/" && !can("dashboard.read")) {
      router.replace(
        href(
          session.user.role === "cashier"
            ? "/pos"
            : session.user.role === "stock"
              ? "/stock"
              : "/accounting",
        ),
      );
    }
  }, [session, path, can, href, router]);

  if (publicRoutes.includes(pathname)) return children;

  const required = routePermission(path);
  const allowed = path.startsWith("/cash")
    ? can("cash.open_close") || can("finance.read")
    : required
      ? can(required)
      : false;
  const allAllowed =
    session?.user.role === "owner" &&
    (path === "/" || path.startsWith("/analytics"));

  const stockAlertCount = snapshot
    ? snapshot.data.products.filter(
        (product) =>
          product.active &&
          product.quantity <= product.threshold &&
          (storeId === "all" || product.storeId === storeId),
      ).length
    : 0;

  const notifications: ShellNotification[] = [];
  if (offline) {
    notifications.push({
      id: "offline",
      label: "Vous êtes hors connexion. Les opérations réelles nécessitent une connexion.",
      tone: "warning",
    });
  }
  if (demo) {
    notifications.push({
      id: "demo",
      label: "Le mode démonstration utilise des données fictives réinitialisées au rechargement.",
      tone: "info",
    });
  }
  if (session && storeId !== session.defaultStoreId && storeId !== "all") {
    const store = session.stores.find((item) => item.id === storeId);
    notifications.push({
      id: "store-context",
      label: `Boutique active : ${store?.name ?? "boutique sélectionnée"}.`,
      tone: "info",
    });
  }
  if (storeId === "all" && !allAllowed) {
    notifications.push({
      id: "store-required",
      label: "Sélectionnez une boutique précise pour travailler sur cet écran.",
      tone: "warning",
    });
  }

  async function logout() {
    if (!confirmDiscard()) return;
    if (demo) {
      location.assign("/login");
      return;
    }
    try {
      await api.auth("logout", {});
      location.assign("/login");
    } catch (caught) {
      setNotice((caught as Error).message);
    }
  }

  const sidebarProps = {
    path,
    href,
    can,
    session,
    storeId,
    stockAlertCount,
    onOrganizationChange: setOrganization,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>

      <AppSidebar
        {...sidebarProps}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <MobileNavigation
        {...sidebarProps}
        open={mobileOpen}
        onOpenChange={setMobileOpen}
      />

      <div
        className={cn(
          "min-h-screen pb-16 transition-[padding] duration-200 lg:pb-0",
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64",
        )}
      >
        <Topbar
          path={path}
          href={href}
          session={session}
          storeId={storeId}
          allowAllStores={allAllowed}
          notifications={notifications}
          canOpenSettings={can("settings.manage")}
          mobileOpen={mobileOpen}
          onOpenMobile={() => setMobileOpen(true)}
          onStoreChange={setStoreId}
          onLogout={logout}
        />

        {demo && (
          <div className="border-b border-border bg-accent/55">
            <div className="mx-auto flex min-h-11 w-full max-w-[1680px] flex-col justify-between gap-2 px-4 py-2 text-xs text-accent-foreground sm:flex-row sm:items-center sm:px-6 xl:px-8">
              <span>
                <strong>Démonstration</strong> · Données fictives, réinitialisées au rechargement.
              </span>
              <label className="flex items-center gap-2 font-medium">
                <span>Tester le rôle</span>
                <select
                  aria-label="Rôle de démonstration"
                  value={session?.user.role ?? "owner"}
                  onChange={(event) => setRole(event.target.value as Role)}
                  className="h-9 min-h-9 rounded-md border-border bg-card px-2 py-1 text-xs text-foreground"
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}

        <main id="main" data-qa="workspace-main" className="min-h-[calc(100vh-120px)]">
          <PageContainer>
            <div className="space-y-4">
              {offline && (
                <Alert error>
                  Vous êtes hors connexion. Les opérations réelles nécessitent une connexion.
                </Alert>
              )}

              {session && storeId !== session.defaultStoreId && storeId !== "all" && (
                <Alert>
                  Vous travaillez dans la boutique {session.stores.find((store) => store.id === storeId)?.name}.
                </Alert>
              )}

              {storeId === "all" && !allAllowed && (
                <Alert error>Sélectionnez une boutique précise pour travailler sur cet écran.</Alert>
              )}

              {path !== "/" && (
                <nav aria-label="Retour" className="flex">
                  <Button variant="outline" size="sm" onClick={goBack} aria-label="Revenir à la page précédente">
                    <ArrowLeft />
                    Retour
                  </Button>
                </nav>
              )}

              {loading ? (
                <Skeleton />
              ) : error ? (
                <Card className="mx-auto max-w-xl">
                  <CardContent className="space-y-4 p-6">
                    <Alert error>{error}</Alert>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={reload}>
                        Réessayer
                      </Button>
                      <Button asChild>
                        <Link href="/demo">
                          Explorer la démonstration <ArrowUpRight />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : !allowed ? (
                <Card className="mx-auto max-w-lg">
                  <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                    <span className="mb-4 flex size-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <BookOpen className="size-5" />
                    </span>
                    <h1 className="mb-2 text-2xl font-bold">Accès réservé</h1>
                    <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                      Votre rôle ne permet pas de consulter cet écran.
                    </p>
                    <Button asChild>
                      <Link
                        href={href(
                          session?.user.role === "cashier"
                            ? "/pos"
                            : session?.user.role === "stock"
                              ? "/stock"
                              : "/accounting",
                        )}
                      >
                        Retour à mon espace
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div
                  key={`${pathname}-${locationKey}-${storeId}-${session?.organization.id}-${session?.user.role}`}
                >
                  {children}
                </div>
              )}
            </div>
          </PageContainer>
        </main>

        <footer className="border-t border-border px-4 py-5 text-xs text-muted-foreground sm:px-6 xl:px-8">
          <div className="mx-auto flex w-full max-w-[1680px] flex-col justify-between gap-1 sm:flex-row">
            <span>VORTEX · Votre activité, en toute clarté.</span>
            <span>
              {session?.organization.currency ?? "FCFA"} · {session?.organization.timezone ?? "Gestion Stock & Finance"}
            </span>
          </div>
        </footer>
      </div>

      {notice && (
        <div
          className="fixed bottom-20 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-[var(--shadow-dialog)] lg:bottom-6"
          role="status"
        >
          <Check className="size-4 text-success" aria-hidden="true" />
          <span className="min-w-0 flex-1">{notice}</span>
          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Fermer la notification"
            onClick={() => setNotice("")}
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return null;
}

export function FrontendShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <Shell>{children}</Shell>
    </WorkspaceProvider>
  );
}
