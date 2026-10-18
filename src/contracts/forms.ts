// Fichier généré depuis vortex-backend/src/contracts. Ne pas modifier : lancer « bun run contracts:sync » dans vortex-backend.
import { z } from 'zod';
import { noNul } from './onboarding';

const MIN_PASSWORD = 12;

export const emailSchema = z.email('Saisissez une adresse email valide.');
export const passwordSchema = z
  .string({ error: 'Saisissez un mot de passe.' })
  .min(MIN_PASSWORD, `Utilisez au moins ${MIN_PASSWORD} caractères.`)
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères.');

/** Demande d'accès : identité + informations qui aideront l'administrateur à la qualifier. */
export const signupFormSchema = z.object({
  name: z.string().trim().min(1, 'Indiquez votre nom.').max(120, 'Maximum 120 caractères.'),
  email: emailSchema,
  password: passwordSchema,
  company: z.string().trim().max(120, 'Maximum 120 caractères.').optional(),
  phone: z.string().trim().max(40, 'Maximum 40 caractères.').optional(),
  activity: z.string().trim().max(200, 'Maximum 200 caractères.').optional(),
});
export type SignupForm = z.infer<typeof signupFormSchema>;

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Saisissez votre mot de passe.'),
});
export type LoginForm = z.infer<typeof loginFormSchema>;

/** Mot de passe oublié et renvoi du lien de confirmation. */
export const emailFormSchema = z.object({ email: emailSchema });
export type EmailForm = z.infer<typeof emailFormSchema>;

export const resetPasswordFormSchema = z
  .object({ password: passwordSchema, confirmation: z.string() })
  .refine((form) => form.password === form.confirmation, {
    path: ['confirmation'],
    message: 'Les mots de passe ne correspondent pas.',
  });
export type ResetPasswordForm = z.infer<typeof resetPasswordFormSchema>;

/**
 * Champs de profil acceptés par Better Auth à l'inscription et à la mise à jour du compte. Le serveur les borne lui-même :
 * `signupFormSchema` ne s'applique que dans le navigateur.
 */
export const profileFieldsSchema = z.looseObject({
  name: z.string().max(120, 'Maximum 120 caractères.').refine(noNul, 'Caractère non autorisé.').optional(),
  company: z.string().max(120, 'Maximum 120 caractères.').refine(noNul, 'Caractère non autorisé.').optional(),
  phone: z.string().max(40, 'Maximum 40 caractères.').refine(noNul, 'Caractère non autorisé.').optional(),
  activity: z.string().max(200, 'Maximum 200 caractères.').refine(noNul, 'Caractère non autorisé.').optional(),
  onboarding: z.string().max(8192, 'Brouillon trop volumineux.').refine(noNul, 'Caractère non autorisé.').optional(),
});
export type ProfileFields = z.infer<typeof profileFieldsSchema>;
