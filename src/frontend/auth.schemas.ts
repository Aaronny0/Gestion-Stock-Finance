// Synchroniser avec backend/src/auth/auth.schemas.ts.
import { z } from "zod";
const label = z
  .string({ error: "Champ requis." })
  .trim()
  .min(1, "Champ requis.")
  .max(160, "Champ trop long.");
export const email = z
  .string({ error: "Email requis." })
  .trim()
  .toLowerCase()
  .email("Adresse email invalide.")
  .max(254, "Adresse trop longue.");
export const password = z
  .string({ error: "Mot de passe requis." })
  .min(12, "Utilisez au moins 12 caractères.")
  .max(128, "Utilisez au maximum 128 caractères.");
export const loginSchema = z.strictObject({
  email,
  password: z
    .string()
    .min(1, "Mot de passe requis.")
    .max(128, "Mot de passe trop long."),
});
export const workspaceSignupSchema = z.strictObject({
  organizationName: label,
  country: label,
  currency: z.string().regex(/^[A-Z]{3}$/, "Devise invalide."),
  timezone: z.string().refine((v) => {
    try {
      new Intl.DateTimeFormat("fr", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }, "Fuseau horaire invalide."),
  storeName: label,
  city: label,
});
export const signupSchema = workspaceSignupSchema.extend({
  name: label,
  email,
  password,
});
export const emailSchema = z.strictObject({ email });
export const tokenSchema = z.strictObject({
  token: z.string().min(1, "Jeton requis.").max(4096, "Jeton invalide."),
});
export const resetSchema = tokenSchema.extend({ password });
export const googleSchema = z
  .strictObject({
    intent: z
      .enum(["login", "signup", "link", "activate"], {
        error: "Intention invalide.",
      })
      .default("login"),
    workspace: workspaceSignupSchema.optional(),
    invitationToken: z.string().min(1).max(4096).optional(),
  })
  .superRefine((v, c) => {
    if (v.intent === "signup" && !v.workspace)
      c.addIssue({
        code: "custom",
        path: ["workspace"],
        message: "Entreprise et boutique requises.",
      });
    if ((v.intent === "activate") !== Boolean(v.invitationToken))
      c.addIssue({
        code: "custom",
        path: ["invitationToken"],
        message: "Jeton réservé à l’activation Google.",
      });
    if (v.intent !== "signup" && v.workspace)
      c.addIssue({
        code: "custom",
        path: ["workspace"],
        message: "Contexte non autorisé.",
      });
  });
export type WorkspaceSignup = z.infer<typeof workspaceSignupSchema>;
