// Fichier généré depuis vortex-backend/src/contracts. Ne pas modifier : lancer « bun run contracts:sync » dans vortex-backend.
import { z } from 'zod';

export const accessStatuses = ['PENDING_EMAIL', 'PENDING_APPROVAL', 'CONTACTED', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;
export const accessStatusSchema = z.enum(accessStatuses);
export type AccessStatus = z.infer<typeof accessStatusSchema>;

/** Réponse de GET /access : statut effectif de l'identité et page de destination. */
export const accessResponseSchema = z.object({ status: accessStatusSchema, destination: z.string() });
export type AccessResponse = z.infer<typeof accessResponseSchema>;

/** Décision d'un administrateur sur une demande d'accès. `decisionId` est conservé lors d'une reprise. */
export const accessDecisionInputSchema = z
  .object({
    id: z.uuid('Identifiant de demande invalide.'),
    decisionId: z.uuid('Référence de décision invalide.'),
    expectedStatus: accessStatusSchema,
    status: z.enum(['APPROVED', 'REJECTED', 'CONTACTED', 'SUSPENDED']),
    reason: z.string().trim().max(500, 'Le motif ne peut pas dépasser 500 caractères.').default(''),
  })
  .strict()
  .refine((data) => !['REJECTED', 'SUSPENDED'].includes(data.status) || data.reason.length > 0, {
    message: 'Indiquez le motif de la décision.',
    path: ['reason'],
  });
export type AccessDecisionInput = z.infer<typeof accessDecisionInputSchema>;
