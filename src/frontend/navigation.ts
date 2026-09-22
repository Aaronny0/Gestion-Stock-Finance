import type { Permission } from "./types";
export const navigation: {
  section: string;
  items: {
    label: string;
    path: string;
    icon: string;
    permission: Permission;
  }[];
}[] = [
  {
    section: "PILOTAGE",
    items: [
      {
        label: "Vue d’ensemble",
        path: "/",
        icon: "home",
        permission: "dashboard.read",
      },
      {
        label: "Analyses & rapports",
        path: "/analytics",
        icon: "chart",
        permission: "analytics.read",
      },
    ],
  },
  {
    section: "OPÉRATIONS",
    items: [
      {
        label: "Caisse / Vendre",
        path: "/pos",
        icon: "cart",
        permission: "sales.create",
      },
      {
        label: "Ventes",
        path: "/sales",
        icon: "receipt",
        permission: "sales.read",
      },
      {
        label: "Stock & catalogue",
        path: "/stock",
        icon: "box",
        permission: "stock.read",
      },
      {
        label: "Troc & reprise",
        path: "/trade",
        icon: "repeat",
        permission: "trade.create",
      },
      {
        label: "Rachat client",
        path: "/buyback",
        icon: "phone",
        permission: "buyback.create",
      },
      {
        label: "Achats",
        path: "/purchases",
        icon: "bag",
        permission: "purchases.manage",
      },
      {
        label: "Fournisseurs",
        path: "/suppliers",
        icon: "truck",
        permission: "purchases.manage",
      },
      {
        label: "Clients",
        path: "/clients",
        icon: "users",
        permission: "sales.read",
      },
    ],
  },
  {
    section: "FINANCE",
    items: [
      {
        label: "Trésorerie & caisse",
        path: "/cash",
        icon: "wallet",
        permission: "cash.open_close",
      },
      {
        label: "Dépenses",
        path: "/expenses",
        icon: "out",
        permission: "finance.read",
      },
      {
        label: "Paiements",
        path: "/payments",
        icon: "card",
        permission: "finance.read",
      },
      {
        label: "Comptabilité",
        path: "/accounting",
        icon: "book",
        permission: "accounting.read",
      },
    ],
  },
  {
    section: "ADMINISTRATION",
    items: [
      {
        label: "Équipe & rôles",
        path: "/team",
        icon: "users",
        permission: "team.manage",
      },
      {
        label: "Historique & audit",
        path: "/audit",
        icon: "clock",
        permission: "audit.read",
      },
      {
        label: "Paramètres",
        path: "/settings",
        icon: "settings",
        permission: "settings.manage",
      },
    ],
  },
];
export const aliases: Record<string, string> = {
  "/dashboard": "/",
  "/ventes": "/sales",
  "/troc": "/trade",
  "/rachat": "/buyback",
  "/finance": "/cash",
  "/statistiques": "/analytics",
  "/historique": "/audit",
  "/roles": "/team",
};
export function canonical(path: string) {
  const value = path.replace(/^\/demo(?=\/|$)/, "") || "/";
  return aliases[value] ?? value;
}
export function routePermission(path: string): Permission | undefined {
  if (path.startsWith("/products/")) return "stock.read";
  return navigation
    .flatMap((s) => s.items)
    .find((n) =>
      n.path === "/"
        ? path === "/"
        : path === n.path || path.startsWith(n.path + "/"),
    )?.permission;
}

export function parentRoute(path: string) {
  if (path.startsWith("/products/")) return "/stock";
  const parts = path.split("/").filter(Boolean);
  return parts.length > 1 ? "/" + parts[0] : "/";
}
