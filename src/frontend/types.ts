export type Role = "owner" | "manager" | "cashier" | "stock" | "accountant";
export type Permission =
  | "dashboard.read"
  | "sales.read"
  | "sales.create"
  | "sales.refund"
  | "sales.sell_below_cost"
  | "sales.change_price"
  | "sales.discount_above_limit"
  | "stock.read"
  | "stock.adjust"
  | "stock.transfer"
  | "stock.cost.read"
  | "buyback.create"
  | "trade.create"
  | "purchases.manage"
  | "cash.open_close"
  | "cash.manual_movement"
  | "finance.read"
  | "accounting.read"
  | "accounting.post"
  | "accounting.close_period"
  | "analytics.read"
  | "analytics.cost_margin_read"
  | "team.manage"
  | "settings.manage"
  | "fiscal.manage"
  | "exports.create"
  | "audit.read";
export interface Organization {
  id: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  fiscalEnabled: boolean;
  splitPayments: boolean;
}
export interface Store {
  id: string;
  name: string;
  city: string;
  active: boolean;
}
export interface UserSession {
  user: { id: string; name: string; role: Role };
  organization: Organization;
  organizations: Organization[];
  stores: Store[];
  permissions: Permission[];
  defaultStoreId: string;
}
export interface Product {
  id: string;
  brand: string;
  model: string;
  variant: string;
  condition: string;
  price: number;
  cost?: number;
  quantity: number;
  threshold: number;
  storeId: string;
  active: boolean;
  imei?: string;
  createdAt: string;
  supplierId?: string;
  reorderTarget?: number;
}
export interface Payment {
  id: string;
  sourceId: string;
  storeId: string;
  date: string;
  direction: "in" | "out";
  method: string;
  amount: number;
  label: string;
}
export interface SaleLine {
  productId: string;
  label: string;
  brand: string;
  quantity: number;
  price: number;
  cost?: number;
  imei?: string;
}
export interface Sale {
  id: string;
  reference: string;
  storeId: string;
  date: string;
  clientId?: string;
  seller: string;
  lines: SaleLine[];
  total: number;
  discount: number;
  paid: number;
  status: string;
  dueDate?: string;
  tradeValue?: number;
  cashTendered?: number;
  cashChange?: number;
  priceOverrideReason?: string;
  returns?: SaleReturn[];
}
export interface SaleReturnLine {
  lineIndex: number;
  quantity: number;
  restock: boolean;
  value: number;
  cost: number;
}
export interface SaleReturn {
  id: string;
  date: string;
  reason: string;
  amount: number;
  cashRefund: number;
  creditReduction: number;
  method: string;
  lines: SaleReturnLine[];
}
export interface AccountingLine {
  account: string;
  label: string;
  debit: number;
  credit: number;
}
export interface AccountingEntry {
  id: string;
  reference: string;
  date: string;
  journal: string;
  label: string;
  storeId: string;
  sourceId?: string;
  sourceType?: string;
  status: "draft" | "posted" | "reversed";
  lines: AccountingLine[];
}
export interface Account {
  id: string;
  number: string;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
  active: boolean;
  normal: "debit" | "credit";
}
export interface Period {
  id: string;
  name: string;
  start: string;
  end: string;
  status: "open" | "locked" | "closed";
}
export interface RecordRow {
  id: string;
  storeId?: string;
  date: string;
  label: string;
  status: string;
  amount?: number;
  paid?: number;
  [key: string]: unknown;
}
export interface Database {
  products: Product[];
  sales: Sale[];
  payments: Payment[];
  entries: AccountingEntry[];
  accounts: Account[];
  periods: Period[];
  purchases: RecordRow[];
  suppliers: RecordRow[];
  expenses: RecordRow[];
  trades: RecordRow[];
  buybacks: RecordRow[];
  transfers: RecordRow[];
  stockEntries: RecordRow[];
  team: RecordRow[];
  clients: RecordRow[];
  cash: RecordRow[];
  audit: RecordRow[];
}
export interface Snapshot {
  reporting?: DashboardReporting;
  session: UserSession;
  data: Database;
}
export type Command = {
  type: string;
  payload: Record<string, unknown>;
  storeId: string;
  idempotencyKey: string;
};
export const permissions: Permission[] = [
  "dashboard.read",
  "sales.read",
  "sales.create",
  "sales.refund",
  "sales.sell_below_cost",
  "sales.change_price",
  "sales.discount_above_limit",
  "stock.read",
  "stock.adjust",
  "stock.transfer",
  "stock.cost.read",
  "buyback.create",
  "trade.create",
  "purchases.manage",
  "cash.open_close",
  "cash.manual_movement",
  "finance.read",
  "accounting.read",
  "accounting.post",
  "accounting.close_period",
  "analytics.read",
  "analytics.cost_margin_read",
  "team.manage",
  "settings.manage",
  "fiscal.manage",
  "exports.create",
  "audit.read",
];
export const rolePermissions: Record<Role, Permission[]> = {
  owner: permissions,
  manager: permissions.filter(
    (p) =>
      ![
        "settings.manage",
        "team.manage",
        "fiscal.manage",
        "accounting.close_period",
        "audit.read",
      ].includes(p),
  ),
  cashier: [
    "sales.read",
    "sales.create",
    "stock.read",
    "trade.create",
    "buyback.create",
    "cash.open_close",
  ],
  stock: [
    "stock.read",
    "stock.adjust",
    "stock.transfer",
    "stock.cost.read",
    "purchases.manage",
    "exports.create",
  ],
  accountant: [
    "purchases.manage",
    "finance.read",
    "accounting.read",
    "accounting.post",
    "accounting.close_period",
    "exports.create",
  ],
};
export const roleLabels: Record<Role, string> = {
  owner: "Propriétaire",
  manager: "Responsable",
  cashier: "Caissier / vendeur",
  stock: "Gestionnaire de stock",
  accountant: "Comptable",
};
export const paymentMethods = [
  "Espèces",
  "Mobile Money",
  "Carte",
  "Virement",
  "Autre",
];
/** Optional server aggregates, calculated over the full authorized result set. */
export interface DashboardReporting {
  kpis: {
    revenue: number;
    incoming: number;
    outgoing: number;
    cashflow: number;
    margin: number;
    result: number;
    count: number;
    units: number;
    average: number;
  };
  daily: { date: string; revenue: number; margin: number }[];
  topProducts: { label: string; quantity: number; amount: number }[];
  paymentBreakdown: [string, number][];
}
