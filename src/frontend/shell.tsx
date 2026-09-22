"use client";
import { useEffect, useState, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiHome,
  FiArrowLeft,
  FiBarChart2,
  FiShoppingCart,
  FiFileText,
  FiPackage,
  FiRepeat,
  FiSmartphone,
  FiShoppingBag,
  FiTruck,
  FiUsers,
  FiCreditCard,
  FiBookOpen,
  FiClock,
  FiSettings,
  FiArrowUpRight,
  FiMenu,
  FiX,
  FiLogOut,
  FiChevronDown,
  FiMapPin,
  FiCheck,
} from "react-icons/fi";
import { WorkspaceProvider, useWorkspace, publicRoutes } from "./provider";
import { canonical, navigation, routePermission } from "./navigation";
import { Alert, Skeleton } from "./ui";
import { roleLabels, type Role } from "./types";
import { api } from "./api";
const icons: Record<string, typeof FiHome> = {
  home: FiHome,
  chart: FiBarChart2,
  cart: FiShoppingCart,
  receipt: FiFileText,
  box: FiPackage,
  repeat: FiRepeat,
  phone: FiSmartphone,
  bag: FiShoppingBag,
  truck: FiTruck,
  users: FiUsers,
  wallet: FiCreditCard,
  out: FiArrowUpRight,
  card: FiCreditCard,
  book: FiBookOpen,
  clock: FiClock,
  settings: FiSettings,
};
function Shell({ children }: { children: ReactNode }) {
  const router = useRouter(),
    pathname = usePathname(),
    path = canonical(pathname),
    {
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
  const [open, setOpen] = useState(false),
    [offline, setOffline] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const session = snapshot?.session;
  useEffect(() => {
    const media = matchMedia("(max-width: 1024px)");
    const update = () => {
      setDrawer(media.matches);
      if (!media.matches) setOpen(false);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!open || !drawer) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),select:not([disabled]),[tabindex="0"]',
        ) ?? [],
      ).filter((el) => el.getClientRects().length);
    sidebarRef.current?.querySelector<HTMLElement>(".mobile-close")?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key === "Tab") {
        const nodes = focusable(),
          first = nodes[0],
          last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open, drawer]);
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
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (session && path === "/" && !can("dashboard.read"))
      router.replace(
        href(
          session.user.role === "cashier"
            ? "/pos"
            : session.user.role === "stock"
              ? "/stock"
              : "/accounting",
        ),
      );
  }, [session, path, can, href, router]);
  if (publicRoutes.includes(pathname)) return children;
  const required = routePermission(path),
    allowed = path.startsWith("/cash")
      ? can("cash.open_close") || can("finance.read")
      : required
        ? can(required)
        : false;
  const allAllowed =
    session?.user.role === "owner" &&
    (path === "/" || path.startsWith("/analytics"));
  return (
    <div className="workspace">
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      {open && (
        <button
          className="sidebar-shade"
          aria-label="Fermer la navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        id="workspace-navigation"
        className={`workspace-sidebar ${open ? "is-open" : ""}`}
        inert={drawer && !open}
        role={drawer && open ? "dialog" : undefined}
        aria-modal={drawer && open ? true : undefined}
        aria-label="Menu de navigation"
      >
        <Link className="brand" href={href("/")}>
          <span className="brand-mark">
            v<span>↗</span>
          </span>
          <span>
            vortex<span className="brand-sub">STOCK & FINANCE</span>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          onClick={() => setOpen(false)}
          aria-label="Fermer le menu"
        >
          <FiX />
        </button>
        <div className="organization-card">
          <div className="org-avatar">
            {session?.organization.name.slice(0, 1) ?? "V"}
          </div>
          <div>
            <strong>{session?.organization.name ?? "Votre entreprise"}</strong>
            <small>Espace professionnel</small>
          </div>
          {session && session.organizations.length > 1 ? (
            <select
              aria-label="Entreprise active"
              value={session.organization.id}
              onChange={(e) => setOrganization(e.target.value)}
            >
              {session.organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          ) : (
            <FiChevronDown />
          )}
        </div>
        <nav aria-label="Navigation principale">
          {navigation.map((section) => {
            const items = section.items.filter(
              (item) =>
                can(item.permission) ||
                (item.path === "/cash" && can("finance.read")),
            );
            if (!items.length) return null;
            return (
              <div className="nav-section" key={section.section}>
                <p>{section.section}</p>
                {items.map((item) => {
                  const Icon = icons[item.icon];
                  const active =
                    item.path === "/"
                      ? path === "/"
                      : path === item.path ||
                        path.startsWith(item.path + "/") ||
                        (item.path === "/stock" &&
                          path.startsWith("/products/"));
                  return (
                    <Link
                      key={item.path}
                      onClick={() => setOpen(false)}
                      href={href(item.path)}
                      className={`nav-item ${active ? "active" : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon />
                      <span>{item.label}</span>
                      {item.path === "/stock" && snapshot && (
                        <small>
                          {
                            snapshot.data.products.filter(
                              (p) =>
                                p.active &&
                                p.quantity <= p.threshold &&
                                (storeId === "all" || p.storeId === storeId),
                            ).length
                          }
                        </small>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <span className="status-dot" />{" "}
          {demo ? "Espace de démonstration" : "Connexion sécurisée"}
          <small>VORTEX · Version 1.0</small>
        </div>
      </aside>
      <div className="workspace-body" inert={drawer && open}>
        <header className="workspace-header">
          <div className="header-context">
            <button
              className="icon-button mobile-toggle"
              aria-label="Ouvrir le menu"
              aria-expanded={open}
              aria-controls="workspace-navigation"
              onClick={() => setOpen(true)}
            >
              <FiMenu />
            </button>
            <span className="breadcrumb">
              Espace de travail <span>/</span>{" "}
              <strong>
                {navigation
                  .flatMap((s) => s.items)
                  .find((i) =>
                    i.path === "/" ? path === "/" : path.startsWith(i.path),
                  )?.label ?? "Détail"}
              </strong>
            </span>
          </div>
          <div className="header-tools">
            {session && (
              <label className="store-switcher">
                <FiMapPin />
                <span className="sr-only">Boutique active</span>
                {session.stores.length > 1 ? (
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                  >
                    {allAllowed && (
                      <option value="all">Toutes les boutiques</option>
                    )}
                    {!allAllowed && storeId === "all" && (
                      <option value="all" disabled>
                        Choisir une boutique
                      </option>
                    )}
                    {session.stores
                      .filter((s) => s.active)
                      .map((s) => (
                        <option value={s.id} key={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  session.stores[0]?.name
                )}
              </label>
            )}
            <div className="header-divider" />
            <div className="user-avatar">
              {session?.user.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("") ?? "V"}
            </div>
            <div className="user-summary">
              <strong>{session?.user.name ?? "Mon compte"}</strong>
              <small>{session ? roleLabels[session.user.role] : ""}</small>
            </div>
            <button
              className="icon-button"
              title={demo ? "Quitter la démonstration" : "Se déconnecter"}
              aria-label="Se déconnecter"
              onClick={async () => {
                if (!confirmDiscard()) return;
                if (demo) location.assign("/login");
                else
                  try {
                    await api.auth("logout", {});
                    location.assign("/login");
                  } catch (e) {
                    setNotice((e as Error).message);
                  }
              }}
            >
              <FiLogOut />
            </button>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              <strong>Démonstration</strong> · Données fictives, réinitialisées
              au rechargement.
            </span>
            <label>
              Tester le rôle{" "}
              <select
                aria-label="Rôle de démonstration"
                value={session?.user.role ?? "owner"}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {Object.entries(roleLabels).map(([v, l]) => (
                  <option value={v} key={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <main id="main" className="workspace-main">
          {offline && (
            <Alert error>
              Vous êtes hors connexion. Les opérations réelles nécessitent une
              connexion.
            </Alert>
          )}
          {session &&
            storeId !== session.defaultStoreId &&
            storeId !== "all" && (
              <Alert>
                Vous travaillez dans la boutique{" "}
                {session.stores.find((s) => s.id === storeId)?.name}.
              </Alert>
            )}
          {storeId === "all" && !allAllowed && (
            <Alert error>
              Sélectionnez une boutique précise pour travailler sur cet écran.
            </Alert>
          )}
          {path !== "/" && (
            <nav className="page-return" aria-label="Retour">
              <button
                className="button secondary"
                onClick={goBack}
                aria-label="Revenir à la page précédente"
              >
                <FiArrowLeft />
                Retour
              </button>
            </nav>
          )}
          {loading ? (
            <Skeleton />
          ) : error ? (
            <div className="connection-error">
              <Alert error>{error}</Alert>
              <button className="button secondary" onClick={reload}>
                Réessayer
              </button>
              <Link className="button primary" href="/demo">
                Explorer la démonstration <FiArrowUpRight />
              </Link>
            </div>
          ) : !allowed ? (
            <div className="access-denied">
              <FiBookOpen />
              <h1>Accès réservé</h1>
              <p>Votre rôle ne permet pas de consulter cet écran.</p>
              <Link
                className="button primary"
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
            </div>
          ) : (
            <div
              key={`${pathname}-${locationKey}-${storeId}-${session?.organization.id}-${session?.user.role}`}
            >
              {children}
            </div>
          )}
        </main>
        <footer className="workspace-footer">
          <span>Vortex · Votre activité, en toute clarté.</span>
          <span>
            {session?.organization.currency ?? "FCFA"} ·{" "}
            {session?.organization.timezone ?? "Gestion Stock & Finance"}
          </span>
        </footer>
        <nav className="mobile-bottom" aria-label="Raccourcis">
          {[
            {
              path: "/pos",
              label: "Vendre",
              permission: "sales.create",
              icon: FiShoppingCart,
            },
            {
              path: "/stock",
              label: "Stock",
              permission: "stock.read",
              icon: FiPackage,
            },
            {
              path: "/trade",
              label: "Troc",
              permission: "trade.create",
              icon: FiRepeat,
            },
            {
              path: "/accounting",
              label: "Comptabilité",
              permission: "accounting.read",
              icon: FiBookOpen,
            },
          ]
            .filter((n) => can(n.permission as never))
            .slice(0, 3)
            .map((n) => (
              <Link
                key={n.path}
                href={href(n.path)}
                aria-current={
                  path === n.path ||
                  path.startsWith(n.path + "/") ||
                  (n.path === "/stock" && path.startsWith("/products/"))
                    ? "page"
                    : undefined
                }
              >
                <n.icon />
                {n.label}
              </Link>
            ))}
          <button
            aria-label="Ouvrir tous les menus"
            aria-controls="workspace-navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <FiMenu />
            Menu
          </button>
        </nav>
      </div>
      {notice && (
        <div className="notice" role="status">
          <FiCheck />
          {notice}
          <button
            className="icon-button"
            aria-label="Fermer la notification"
            onClick={() => setNotice("")}
          >
            <FiX />
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
