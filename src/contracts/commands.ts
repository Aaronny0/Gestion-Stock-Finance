// Fichier généré depuis vortex-backend/src/contracts. Ne pas modifier : lancer « bun run contracts:sync » dans vortex-backend.
import { z } from 'zod';
import { noNul } from './onboarding';

export const commandTypes = ['product.save', 'product.archive', 'stock.entry', 'stock.import', 'stock.adjust', 'stock.transfer'] as const;
export type CommandType = (typeof commandTypes)[number];

/** Entier sûr borné ; le message nomme le champ, en français. */
const int = (label: string, min: number, max = Number.MAX_SAFE_INTEGER) => {
  const message = `${label} : entier entre ${min} et ${max.toLocaleString('fr-FR')} requis.`;
  return z.number({ error: message }).int(message).min(min, message).max(max, message);
};
const quantity = int('Quantité', 1, 1_000_000);
const money = (label: string) => int(label, 0);

const text = (label: string, max = 120) =>
  z.string({ error: `${label} requis.` }).trim().max(max, `${label} : maximum ${max} caractères.`).refine(noNul, 'Caractère non autorisé.');
const required = (label: string, max = 120) => text(label, max).min(1, `${label} requis.`);
const reason = required('Motif', 500);
const optionalReason = text('Motif', 500).optional();

const id = (label: string) => z.uuid(`${label} invalide.`);
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (AAAA-MM-JJ).')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
  }, 'Date invalide (AAAA-MM-JJ).')
  .refine((value) => value >= '2000-01-01', 'Date invalide : à partir du 1er janvier 2000.');

const payload = <S extends z.ZodRawShape>(shape: S) =>
  z.strictObject({ organizationId: id('Entreprise'), date: dateString.optional(), ...shape });

export const productConditions = ['Neuf', 'Occasion', 'Reconditionné'] as const;

export const productSavePayloadSchema = payload({
  id: id('Produit').optional(),
  brand: required('Marque'),
  model: required('Modèle'),
  variant: text('Variante').default(''),
  condition: z.enum(productConditions, { error: 'État invalide.' }).default('Neuf'),
  price: money('Prix'),
  threshold: int('Seuil', 0, 1_000_000),
  reorderTarget: int('Stock cible', 1, 1_000_000).optional(),
  // Le formulaire envoie une chaîne vide quand aucun fournisseur n'est choisi.
  supplierId: z.preprocess((value) => (value === '' ? undefined : value), id('Fournisseur').optional()),
});
export const productArchivePayloadSchema = payload({ productId: id('Produit'), reason });
export const stockEntryPayloadSchema = payload({ productId: id('Produit'), quantity, cost: money('Coût'), reason: optionalReason, imei: z.string().trim().max(32).optional() });
export const stockImportRowSchema = z.strictObject({
  brand: required('Marque'),
  model: required('Modèle'),
  variant: text('Variante').default(''),
  quantity,
  cost: money('Coût'),
  price: money('Prix'),
});
export const stockImportPayloadSchema = payload({
  rows: z.array(stockImportRowSchema).min(1, 'Aucune ligne à importer.').max(2000, 'Un import contient au plus 2 000 lignes.'),
});
export const stockAdjustPayloadSchema = payload({ productId: id('Produit'), quantity: int('Quantité comptée', 0, 1_000_000), reason });
export const stockTransferPayloadSchema = payload({
  productId: id('Produit'),
  destination: id('Boutique de destination'),
  quantity,
  reason,
  imeis: z.array(z.string().trim().max(32)).max(1000).optional(),
});

export const payloadSchemas = {
  'product.save': productSavePayloadSchema,
  'product.archive': productArchivePayloadSchema,
  'stock.entry': stockEntryPayloadSchema,
  'stock.import': stockImportPayloadSchema,
  'stock.adjust': stockAdjustPayloadSchema,
  'stock.transfer': stockTransferPayloadSchema,
} as const satisfies Record<CommandType, z.ZodType>;

/** Enveloppe de POST /commands. Le payload est revalidé par le schéma de son type. */
export const commandEnvelopeSchema = z.strictObject({
  type: z.enum(commandTypes, { error: 'Commande inconnue.' }),
  storeId: id('Boutique'),
  idempotencyKey: z.uuid("Clé d'idempotence invalide."),
  payload: z.looseObject({ organizationId: id('Entreprise') }),
});
export type CommandEnvelope = z.infer<typeof commandEnvelopeSchema>;

export const commandResponseSchema = z.object({ reference: z.string() });
export type CommandResponse = z.infer<typeof commandResponseSchema>;

export type ProductSavePayload = z.infer<typeof productSavePayloadSchema>;
export type ProductArchivePayload = z.infer<typeof productArchivePayloadSchema>;
export type StockEntryPayload = z.infer<typeof stockEntryPayloadSchema>;
export type StockImportPayload = z.infer<typeof stockImportPayloadSchema>;
export type StockAdjustPayload = z.infer<typeof stockAdjustPayloadSchema>;
export type StockTransferPayload = z.infer<typeof stockTransferPayloadSchema>;
