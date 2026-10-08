"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  BookOpen,
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
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Search,
  ChevronsUpDown,
  type LucideIcon,
} from "lucide-react";
import { AppLogo } from "@/components/layout/app-logo";
import {
  NotificationsMenu,
  type ShellNotification,
} from "@/components/layout/notifications-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Money } from "@/components/data-display/money";
import { navigation } from "@/frontend/navigation";
import { useWorkspace } from "@/frontend/provider";
import {
  roleLabels,
  type Permission,
  type UserSession,
} from "@/frontend/types";
import styles from "./sidebar.module.css";

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
const sections = [
  { title: "Pilotage", short: "Pilotage", icon: LayoutDashboard },
  { title: "Opérations", short: "Ventes", icon: ShoppingCart },
  { title: "Finance", short: "Finance", icon: WalletCards },
  { title: "Administration", short: "Admin", icon: Settings },
];
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
  onStoreChange?: (id: string) => void;
  onLogout?: () => void;
  notifications?: ShellNotification[];
  globalShortcuts?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}
function isActive(path: string, itemPath: string) {
  return itemPath === "/"
    ? path === "/"
    : path === itemPath ||
        path.startsWith(`${itemPath}/`) ||
        (itemPath === "/stock" && path.startsWith("/products/"));
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
  onStoreChange,
  onLogout,
  notifications = [],
  onCollapsedChange,
  globalShortcuts = false,
}: SidebarNavigationProps) {
  const { snapshot } = useWorkspace();
  const router = useRouter();
  const currentSection = Math.max(
    0,
    navigation.findIndex((section) =>
      section.items.some((item) => isActive(path, item.path)),
    ),
  );
  const [selection, setSelection] = useState<{
    path: string;
    index: number;
  } | null>(null);
  const activeSection =
    selection?.path === path ? selection.index : currentSection;
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!globalShortcuts) return;
    let precedingG = false;
    const shortcut = (event: KeyboardEvent) => {
      if (document.querySelector("dialog[open]")) return;
      const modal = document.querySelector(
        '[role="dialog"][data-state="open"]',
      );
      if (modal && !modal.hasAttribute("data-workspace-search")) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
        return;
      }
      const target = event.target as HTMLElement;
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        target.closest(
          "input,textarea,select,[contenteditable=true],[role=dialog]",
        )
      )
        return;
      if (event.key.toLowerCase() === "n" && can("sales.create")) {
        event.preventDefault();
        router.push(href("/pos"));
      }
      if (
        event.key.toLowerCase() === "d" &&
        precedingG &&
        can("dashboard.read")
      ) {
        event.preventDefault();
        router.push(href("/"));
      }
      precedingG = event.key.toLowerCase() === "g";
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, [globalShortcuts, can, href, router]);
  const visibleSections = navigation
    .map((section, index) => ({
      ...section,
      index,
      items: section.items.filter(
        (item) =>
          can(item.permission) ||
          (item.path === "/cash" && can("finance.read")),
      ),
    }))
    .filter((section) => section.items.length);
  const section =
    visibleSections.find((item) => item.index === activeSection) ??
    visibleSections[0];
  const store = session?.stores.find((item) => item.id === storeId);
  const cash = snapshot?.data.cash
    .filter((item) => item.storeId === storeId)
    .sort((a, b) =>
      String(b.openedAt ?? b.date).localeCompare(String(a.openedAt ?? a.date)),
    )[0];
  const cashOpen = cash?.status === "open";
  const cashBalance =
    cash?.theoretical !== undefined
      ? Number(cash.theoretical)
      : cashOpen && !snapshot?.reporting && !snapshot?.pagination?.hasMore
        ? Number(cash?.opening ?? 0) +
          (snapshot?.data.payments
            .filter(
              (payment) =>
                payment.storeId === storeId &&
                payment.method === "Espèces" &&
                payment.date >= String(cash?.openedAt ?? "9999"),
            )
            .reduce(
              (sum, payment) =>
                sum +
                (payment.direction === "in" ? payment.amount : -payment.amount),
              0,
            ) ?? 0)
        : undefined;
  const normalizedQuery = query.trim().toLocaleLowerCase("fr");
  const links = visibleSections
    .flatMap((section) => section.items)
    .filter((item) =>
      item.label.toLocaleLowerCase("fr").includes(normalizedQuery),
    );
  const sales =
    normalizedQuery && can("sales.read")
      ? (snapshot?.data.sales
          .filter(
            (sale) =>
              (storeId === "all" || sale.storeId === storeId) &&
              `${sale.reference} ${sale.lines.map((line) => line.imei ?? "").join(" ")}`
                .toLocaleLowerCase("fr")
                .includes(normalizedQuery),
          )
          .slice(0, 12) ?? [])
      : [];
  const products =
    normalizedQuery && can("stock.read")
      ? (snapshot?.data.products
          .filter(
            (product) =>
              (storeId === "all" || product.storeId === storeId) &&
              `${product.brand} ${product.model} ${product.imei ?? ""} ${product.availableImeis?.join(" ") ?? ""}`
                .toLocaleLowerCase("fr")
                .includes(normalizedQuery),
          )
          .slice(0, 12) ?? [])
      : [];
  function navigate() {
    setSearchOpen(false);
    onNavigate?.();
  }
  return (
    <div className={styles.navigation} data-compact={compact}>
      <div className={styles.rail}>
        <AppLogo href={href("/")} compact className={styles.logo} />
        {can("sales.create") && (
          <Link
            className={styles.quickSale}
            href={href("/pos")}
            onClick={onNavigate}
            aria-label="Vente rapide"
          >
            <Plus size={20} />
          </Link>
        )}
        {visibleSections.map(({ index }) => {
          const Icon = sections[index].icon;
          return (
            <button
              key={index}
              type="button"
              className={styles.section}
              data-active={section?.index === index}
              aria-label={sections[index].title}
              aria-pressed={section?.index === index}
              onClick={() => {
                setSelection({ path, index });
                onCollapsedChange?.(false);
              }}
            >
              <Icon size={20} />
              <span>{sections[index].short}</span>
              {index === 1 && can("stock.read") && stockAlertCount > 0 && (
                <i
                  className={styles.alertDot}
                  aria-label={`${stockAlertCount} alertes de stock`}
                />
              )}
            </button>
          );
        })}
        <div className={styles.railBottom}>
          <NotificationsMenu items={notifications} />
          {onCollapsedChange && (
            <button
              type="button"
              onClick={() => onCollapsedChange(!compact)}
              aria-label={
                compact
                  ? "Déployer la barre latérale"
                  : "Réduire la barre latérale"
              }
            >
              {compact ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>
          )}
          <span className={styles.avatar} title={session?.user.name}>
            {session?.user.name
              .split(/\s+/)
              .map((word) => word[0])
              .slice(0, 2)
              .join("") ?? "V"}
          </span>
        </div>
      </div>
      {!compact && (
        <div className={styles.panel}>
          <div className={styles.panelTop}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={styles.organization}
                  aria-label="Changer d’organisation ou de boutique"
                >
                  <span>
                    <strong>
                      {session?.organization.name ?? "Votre entreprise"}
                    </strong>
                    <small>
                      <i />
                      {store
                        ? store.name.includes(store.city)
                          ? store.name
                          : `${store.city} · ${store.name}`
                        : "Toutes les boutiques"}
                    </small>
                  </span>
                  <ChevronsUpDown size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Organisations</DropdownMenuLabel>
                {session?.organizations.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onSelect={() => onOrganizationChange(item.id)}
                  >
                    {item.name}
                    {item.id === session.organization.id ? " ✓" : ""}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Boutiques</DropdownMenuLabel>
                {session?.stores.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onSelect={() => onStoreChange?.(item.id)}
                  >
                    {item.city} · {item.name}
                    {item.id === storeId ? " ✓" : ""}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              ref={searchTrigger}
              type="button"
              className={styles.search}
              onClick={() => setSearchOpen(true)}
            >
              <Search size={15} />
              <span>Aller à…</span>
              <kbd>⌘K</kbd>
            </button>
          </div>
          <div className={styles.sectionHeading}>
            <h2>{sections[section?.index ?? 0].title}</h2>
            <span>{section?.items.length ?? 0} écrans</span>
          </div>
          <nav aria-label="Navigation principale" className={styles.links}>
            {section?.items.map((item) => {
              const Icon = icons[item.icon] ?? LayoutDashboard;
              return (
                <Link
                  key={item.path}
                  href={href(item.path)}
                  onClick={onNavigate}
                  data-qa="nav-item"
                  aria-label={item.label}
                  aria-current={isActive(path, item.path) ? "page" : undefined}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                  {item.path === "/stock" && stockAlertCount > 0 ? (
                    <b>{stockAlertCount}</b>
                  ) : item.path === "/pos" ? (
                    <kbd>N</kbd>
                  ) : item.path === "/" ? (
                    <kbd>G D</kbd>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          {(can("cash.open_close") || can("finance.read")) &&
            storeId !== "all" && (
              <section
                className={styles.cash}
                aria-label="Caisse de la boutique"
              >
                <div>
                  <strong data-open={cashOpen}>
                    <i />
                    {cashOpen ? "Caisse ouverte" : "Caisse fermée"}
                  </strong>
                  {cashOpen && !!cash?.openedAt && (
                    <small>
                      depuis{" "}
                      {new Date(String(cash.openedAt)).toLocaleTimeString(
                        "fr-FR",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </small>
                  )}
                </div>
                {cashBalance !== undefined && Number.isFinite(cashBalance) && (
                  <p>
                    <Money
                      currencyDisplay="code"
                      value={cashBalance}
                      currencyClassName={styles.currency}
                    />
                    <small> théorique</small>
                  </p>
                )}
                <Link href={href("/cash")} onClick={onNavigate}>
                  {can("cash.open_close")
                    ? cashOpen
                      ? "Clôturer la caisse"
                      : "Ouvrir la caisse"
                    : "Consulter la caisse"}
                </Link>
              </section>
            )}
          <div className={styles.user}>
            <span>
              <strong>{session?.user.name ?? "Chargement…"}</strong>
              <small>{session ? roleLabels[session.user.role] : ""}</small>
            </span>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                aria-label="Se déconnecter"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      )}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            searchTrigger.current?.focus();
          }}
          className={styles.searchDialog}
          data-workspace-search=""
        >
          <DialogTitle>Aller à…</DialogTitle>
          <label className="sr-only" htmlFor="workspace-search">
            Écran, vente ou IMEI
          </label>
          <input
            id="workspace-search"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Écran, vente ou IMEI…"
          />
          <div className={styles.results}>
            {links.map((item) => (
              <Link key={item.path} href={href(item.path)} onClick={navigate}>
                {item.label}
              </Link>
            ))}
            {sales.map((sale) => (
              <Link
                key={sale.id}
                href={href(`/sales/${sale.id}`)}
                onClick={navigate}
              >
                {sale.reference} · {sale.seller}
              </Link>
            ))}
            {products.map((product) => (
              <Link
                key={product.id}
                href={href(`/products/${product.id}`)}
                onClick={navigate}
              >
                {product.brand} {product.model} · {product.imei}
              </Link>
            ))}
            {!links.length && !sales.length && !products.length && (
              <p>Aucun résultat dans les données chargées de cet espace.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
interface AppSidebarProps extends SidebarNavigationProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}
export function AppSidebar({
  collapsed,
  onCollapsedChange,
  ...props
}: AppSidebarProps) {
  return (
    <aside
      data-qa="workspace-sidebar"
      className={styles.sidebar}
      data-collapsed={collapsed}
    >
      <SidebarNavigation
        {...props}
        globalShortcuts
        compact={collapsed}
        onCollapsedChange={onCollapsedChange}
      />
    </aside>
  );
}
