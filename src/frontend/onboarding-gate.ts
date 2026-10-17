/** Que faire quand le chargement du workspace échoue ? Une seule règle pour le chargement initial et le contrôle périodique. */
export type FailureAction =
  | { type: "onboarding-modal" }
  | { type: "redirect"; to: string }
  | { type: "error"; message: string }
  | { type: "ignore" };

type Failure = { code?: string; status?: number; name?: string; message?: string };

const pendingCodes = ["PENDING_APPROVAL", "CONTACTED", "REJECTED", "SUSPENDED"];

export function workspaceFailureAction(error: Failure): FailureAction {
  if (error.name === "AbortError") return { type: "ignore" };
  if (error.code && pendingCodes.includes(error.code)) return { type: "redirect", to: "/access-pending" };
  if (error.code === "PENDING_EMAIL") return { type: "redirect", to: "/verify-email" };
  // Accès approuvé sans entreprise : l'utilisateur reste sur le dashboard, un modal bloquant lui fait créer son espace.
  if (error.code === "ONBOARDING_REQUIRED") return { type: "onboarding-modal" };
  if (error.code === "NO_MEMBERSHIP") return { type: "redirect", to: "/onboarding?state=no_membership" };
  if (error.status === 401) return { type: "redirect", to: "/login?expired=1" };
  return { type: "error", message: error.message ?? "" };
}

const keys = ["name", "organizationName", "country", "currency", "timezone", "storeName", "city"] as const;
export type OnboardingValues = Record<(typeof keys)[number], string>;

/** Valeurs initiales du modal : brouillon de l'inscription > compte (nom, entreprise) > défauts du Bénin. L'email n'en fait jamais partie. */
export function onboardingDefaults(
  user: { name?: string | null; company?: string | null },
  draft: { payload: Record<string, string | undefined> } | null,
): OnboardingValues {
  const values: OnboardingValues = {
    name: user.name ?? "",
    organizationName: user.company ?? "",
    country: "Bénin",
    currency: "XOF",
    timezone: "Africa/Porto-Novo",
    storeName: "",
    city: "",
  };
  for (const key of keys) {
    const saved = draft?.payload[key]?.trim();
    if (saved) values[key] = saved;
  }
  return values;
}
