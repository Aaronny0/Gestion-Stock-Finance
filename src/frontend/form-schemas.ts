import type { ZodType } from "zod";
import {
  emailFormSchema,
  loginFormSchema,
  onboardingFieldsSchema,
  resetPasswordFormSchema,
  signupFormSchema,
} from "../contracts";

export type AuthMode = "login" | "signup" | "forgot" | "reset" | "verify" | "invite";

const account = signupFormSchema.pick({ name: true, email: true, password: true });
const company = onboardingFieldsSchema.pick({ organizationName: true, country: true, currency: true, timezone: true });
const store = onboardingFieldsSchema.pick({ storeName: true, city: true });
const everything = account.extend(company.shape).extend(store.shape);
const inviteNewAccount = signupFormSchema.pick({ email: true, password: true });

/** Schéma Zod partagé qui valide l'écran d'authentification courant ; null quand rien n'est à saisir. */
export function authFormSchema(options: { mode: AuthMode; step?: number; newAccount?: boolean; signedIn?: boolean }): ZodType | null {
  switch (options.mode) {
    case "signup":
      return [account, company, store][options.step ?? 0] ?? everything;
    case "reset":
      return resetPasswordFormSchema;
    case "forgot":
    case "verify":
      return emailFormSchema;
    case "invite":
      return options.signedIn ? null : options.newAccount ? inviteNewAccount : loginFormSchema;
    default:
      return loginFormSchema;
  }
}

/** Champ → premier message d'erreur, en français (les messages viennent des contrats). */
export function fieldErrors(schema: ZodType, values: Record<string, unknown>): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) errors[String(issue.path[0] ?? "_")] ??= issue.message;
  return errors;
}

const onboardingKeys = ["name", "organizationName", "country", "currency", "timezone", "storeName", "city"] as const;

/** Corps de POST /onboarding : uniquement les champs du contrat. L'identité vient de la session, jamais du corps. */
export function buildOnboardingBody(values: Record<string, string | undefined>) {
  return Object.fromEntries(onboardingKeys.map((key) => [key, values[key]?.trim() ?? ""])) as Record<(typeof onboardingKeys)[number], string>;
}
