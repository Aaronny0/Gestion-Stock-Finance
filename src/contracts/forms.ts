// Fichier généré depuis vortex-backend/src/contracts. Ne pas modifier : lancer « bun run contracts:sync » dans vortex-backend.
import { z } from 'zod';

const email = z.email('Adresse email invalide.');
const newPassword = z
  .string({ error: 'Saisissez un mot de passe.' })
  .min(10, 'Le mot de passe doit contenir au moins 10 caractères.')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères.');

/** Demande d'accès : identité + informations qui aideront l'administrateur à la qualifier. */
export const signupFormSchema = z.object({
  name: z.string().trim().min(1, 'Indiquez votre nom.').max(120, 'Maximum 120 caractères.'),
  email,
  password: newPassword,
  company: z.string().trim().max(120, 'Maximum 120 caractères.').optional(),
  phone: z.string().trim().max(40, 'Maximum 40 caractères.').optional(),
  activity: z.string().trim().max(200, 'Maximum 200 caractères.').optional(),
});
export type SignupForm = z.infer<typeof signupFormSchema>;

export const loginFormSchema = z.object({
  email,
  password: z.string().min(1, 'Saisissez votre mot de passe.'),
});
export type LoginForm = z.infer<typeof loginFormSchema>;
