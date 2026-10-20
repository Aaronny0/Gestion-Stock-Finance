import { request } from "./api";
import type { AccessDecision } from "@/lib/access-policy";
import { accessResponseSchema } from "@vortex/contracts";
export const draftKey = "vortex:onboarding";
export function saveOnboarding(values: Record<string, string>) {
  const fields = ["name", "email", "organizationName", "country", "currency", "timezone", "storeName", "city"];
  const payload = Object.fromEntries(fields.map(key => [key, values[key] ?? ""]));
  const previous = readOnboarding();
  const idempotencyKey = previous && JSON.stringify(previous.payload) === JSON.stringify(payload) ? previous.idempotencyKey : crypto.randomUUID();
  sessionStorage.setItem(draftKey, JSON.stringify({ payload, idempotencyKey }));
  return { payload, idempotencyKey };
}
export function readOnboarding(): { payload: Record<string, string>; idempotencyKey: string } | null {
  try {
    const draft = JSON.parse(sessionStorage.getItem(draftKey) || "null");
    return draft && typeof draft.idempotencyKey === "string" && draft.payload && typeof draft.payload === "object" ? draft : null;
  } catch { return null; }
}
export async function businessDestination() {
  const decision = accessResponseSchema.safeParse(await request<AccessDecision>("access"));
  if (!decision.success) throw new Error("Réponse d’accès inattendue. Réessayez.");
  return decision.data.destination;
}
/** Maps Better Auth error codes (and the HTTP status for rate limits) to safe French messages. */
export function authError(error: { code?: string; message?: string; status?: number }) {
  const code = error.code ?? "";
  if (error.status === 429) return "Veuillez patienter avant de demander un nouveau lien.";
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD": return "Email ou mot de passe incorrect.";
    case "EMAIL_NOT_VERIFIED": return "Confirmez votre adresse email avant de vous connecter.";
    case "PASSWORD_TOO_SHORT": case "PASSWORD_TOO_LONG": return "Choisissez un mot de passe plus robuste.";
    default:
      if (code.startsWith("USER_ALREADY_EXISTS")) return "Un compte existe déjà. Connectez-vous ou réinitialisez votre mot de passe.";
      return "Connexion indisponible ou demande refusée. Réessayez.";
  }
}
/** Better Auth refuses unverified logins with 403 EMAIL_NOT_VERIFIED. */
export const emailNotVerified = (error: { code?: string; status?: number }) => error.code === "EMAIL_NOT_VERIFIED";
/** The onboarding draft stored on the user at sign-up is a JSON string. */
export function parseOnboarding(value: string | null | undefined): { payload: Record<string, string>; idempotencyKey: string } | null {
  try {
    const draft = JSON.parse(value || "null");
    return draft && typeof draft.idempotencyKey === "string" && draft.payload && typeof draft.payload === "object" ? draft : null;
  } catch { return null; }
}
/** A login page reached after the API answered 401 explains why the user is asked to sign in again. */
export const expiredNotice = (search: string) =>
  new URLSearchParams(search).get("expired") === "1" ? "Votre session a expiré. Connectez-vous à nouveau." : "";
