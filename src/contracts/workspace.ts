// Fichier généré depuis vortex-backend/src/contracts. Ne pas modifier : lancer « bun run contracts:sync » dans vortex-backend.
import { z } from 'zod';
import { userSessionSchema } from './session';

const MAX_DAYS = 366;
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (AAAA-MM-JJ).').refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}, 'Date invalide (AAAA-MM-JJ).');

/** Paramètres de GET /workspace. L'entreprise et la boutique ne sont que des filtres : le serveur vérifie l'appartenance. */
export const workspaceQuerySchema = z
  .object({
    storeId: z.union([z.uuid('Boutique invalide.'), z.literal('all')]).optional(),
    organizationId: z.uuid('Entreprise invalide.').optional(),
    start: date,
    end: date,
  })
  .superRefine((query, ctx) => {
    if (!query.start || !query.end) return;
    const days = (Date.parse(query.end) - Date.parse(query.start)) / 86_400_000;
    if (days < 0) ctx.addIssue({ code: 'custom', path: ['start'], message: 'La date de début doit précéder la date de fin.' });
    else if (days + 1 > MAX_DAYS) ctx.addIssue({ code: 'custom', path: ['end'], message: `La période ne peut pas dépasser ${MAX_DAYS} jours.` });
  });
export type WorkspaceQuery = z.infer<typeof workspaceQuerySchema>;

export const dashboardReportingSchema = z.object({
  kpis: z.object({
    revenue: z.number().int(), incoming: z.number().int(), outgoing: z.number().int(), cashflow: z.number().int(),
    margin: z.number().int(), result: z.number().int(), count: z.number().int(), units: z.number().int(), average: z.number().int(),
  }),
  daily: z.array(z.object({ date: z.string(), revenue: z.number().int(), margin: z.number().int() })),
  topProducts: z.array(z.object({ label: z.string(), quantity: z.number().int(), amount: z.number().int() })),
  paymentBreakdown: z.array(z.tuple([z.string(), z.number().int()])),
});
export type DashboardReporting = z.infer<typeof dashboardReportingSchema>;

/**
 * Éléments de collection : seul l'identifiant est contractuel pour l'instant. Chaque tranche métier
 * (stock, ventes, caisse, comptabilité…) remplacera son schéma par le détail complet.
 */
export const recordSchema = z.looseObject({ id: z.string() });
const collection = z.array(recordSchema);

export const databaseSchema = z.object({
  products: collection, sales: collection, payments: collection, entries: collection, accounts: collection,
  periods: collection, purchases: collection, suppliers: collection, expenses: collection, trades: collection,
  buybacks: collection, transfers: collection, stockEntries: collection, team: collection, clients: collection,
  cash: collection, audit: collection,
});
export type Database = z.infer<typeof databaseSchema>;
export const collectionNames = Object.keys(databaseSchema.shape) as (keyof Database)[];

export const snapshotSchema = z.object({
  pagination: z.object({ page: z.number().int(), pageSize: z.number().int(), hasMore: z.boolean(), snapshotVersion: z.string() }).optional(),
  reporting: dashboardReportingSchema.optional(),
  session: userSessionSchema,
  data: databaseSchema,
});
export type Snapshot = z.infer<typeof snapshotSchema>;
