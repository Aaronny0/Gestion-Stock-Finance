import { request } from "./api";
import type { AccessDecision } from "@/lib/access-policy";
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
  const decision = await request<AccessDecision>("access");
  return decision.destination;
}
export function authError(error: { code?: string; message?: string }) {
  switch (error.code) {
    case "invalid_credentials": return "Email ou mot de passe incorrect.";
    case "email_not_confirmed": return "Confirmez votre adresse email avant de vous connecter.";
    case "user_already_exists": return "Un compte existe déjà. Connectez-vous ou réinitialisez votre mot de passe.";
    case "weak_password": return "Choisissez un mot de passe plus robuste.";
    case "over_email_send_rate_limit": return "Veuillez patienter avant de demander un nouveau lien.";
    default: return "Connexion indisponible ou demande refusée. Réessayez.";
  }
}
