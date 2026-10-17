// Fichier généré depuis vortex-backend/src/contracts. Ne pas modifier : lancer « bun run contracts:sync » dans vortex-backend.
import { z } from 'zod';

export const roleSchema = z.enum(['owner', 'manager', 'cashier', 'stock', 'accountant']);
export type Role = z.infer<typeof roleSchema>;

export const permissionSchema = z.enum([
  'dashboard.read', 'sales.read', 'sales.create', 'sales.refund', 'sales.sell_below_cost', 'sales.change_price',
  'sales.discount_above_limit', 'stock.read', 'stock.adjust', 'stock.transfer', 'stock.cost.read', 'buyback.create',
  'trade.create', 'purchases.manage', 'cash.open_close', 'cash.manual_movement', 'finance.read', 'accounting.read',
  'accounting.post', 'accounting.close_period', 'analytics.read', 'analytics.cost_margin_read', 'team.manage',
  'settings.manage', 'fiscal.manage', 'exports.create', 'audit.read',
]);
export type Permission = z.infer<typeof permissionSchema>;

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  currency: z.string(),
  timezone: z.string(),
  fiscalEnabled: z.boolean(),
  splitPayments: z.boolean(),
});
export type Organization = z.infer<typeof organizationSchema>;

export const storeSchema = z.object({ id: z.string(), name: z.string(), city: z.string(), active: z.boolean() });
export type Store = z.infer<typeof storeSchema>;

/** Contexte métier de l'utilisateur connecté : entreprise active, boutiques autorisées, permissions effectives. */
export const userSessionSchema = z.object({
  user: z.object({ id: z.string(), name: z.string(), role: roleSchema }),
  organization: organizationSchema,
  organizations: z.array(organizationSchema),
  stores: z.array(storeSchema),
  permissions: z.array(permissionSchema),
  defaultStoreId: z.string(),
});
export type UserSession = z.infer<typeof userSessionSchema>;
