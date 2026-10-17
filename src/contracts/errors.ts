// Fichier généré depuis vortex-backend/src/contracts. Ne pas modifier : lancer « bun run contracts:sync » dans vortex-backend.
import { z } from 'zod';

/** Forme unique de toutes les erreurs HTTP de l'API. `fields` : nom du champ → message en français. */
export const errorBodySchema = z.object({
  code: z.string(),
  error: z.string(),
  fields: z.record(z.string(), z.string()).optional(),
});
export type ErrorBody = z.infer<typeof errorBodySchema>;
