// Fichier généré depuis vortex-backend/src/contracts. Ne pas modifier : lancer « bun run contracts:sync » dans vortex-backend.
import { z } from 'zod';

const text = (message: string) => z.string({ error: message }).trim().min(1, message).max(120, 'Maximum 120 caractères.');

const knownTimezone = (value: string) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

/** Corps de POST /onboarding. L'identité (et donc l'email) vient exclusivement de la session. */
export const onboardingInputSchema = z
  .object({
    name: text('Indiquez votre nom.'),
    organizationName: text("Indiquez le nom de l'entreprise."),
    country: text('Indiquez le pays.'),
    currency: z.string({ error: 'Devise invalide.' }).regex(/^[A-Z]{3}$/, 'Devise invalide.'),
    timezone: text('Indiquez le fuseau horaire.').refine(knownTimezone, 'Fuseau horaire invalide.'),
    storeName: text('Indiquez le nom de la boutique.'),
    city: text('Indiquez la ville.'),
  })
  .strict();
export type OnboardingInput = z.infer<typeof onboardingInputSchema>;

export const idempotencyKeySchema = z.uuid("Clé d'idempotence invalide.");
