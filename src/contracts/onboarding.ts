// Fichier généré depuis vortex-backend/src/contracts. Ne pas modifier : lancer « bun run contracts:sync » dans vortex-backend.
import { z } from 'zod';

const text = (message: string) => z.string({ error: message }).trim().min(1, message).max(120, 'Maximum 120 caractères.');

const CURRENCY = 'Utilisez un code de devise de 3 lettres (ex. XOF).';
const TIMEZONE = 'Indiquez un fuseau valide (ex. Africa/Porto-Novo).';

const knownTimezone = (value: string) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

/** Champs de l'entreprise, non stricts : les formulaires par étapes en extraient des sous-ensembles avec `.pick`. */
export const onboardingFieldsSchema = z.object({
  name: text('Indiquez votre nom.'),
  organizationName: text("Indiquez le nom de l'entreprise."),
  country: text('Indiquez le pays.'),
  currency: z.string({ error: CURRENCY }).regex(/^[A-Z]{3}$/, CURRENCY),
  timezone: text('Indiquez le fuseau horaire.').refine(knownTimezone, TIMEZONE),
  storeName: text('Indiquez le nom de la boutique.'),
  city: text('Indiquez la ville.'),
});
/** Corps de POST /onboarding. L'identité (et donc l'email) vient exclusivement de la session. */
export const onboardingInputSchema = onboardingFieldsSchema.strict();
export type OnboardingInput = z.infer<typeof onboardingInputSchema>;

export const idempotencyKeySchema = z.uuid("Clé d'idempotence invalide.");
