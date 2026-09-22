import type { Command, Snapshot, Sale } from "./types";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
const messages: Record<number, string> = {
  401: "Votre session a expiré. Reconnectez-vous.",
  403: "Vous ne disposez pas de cette permission.",
  409: "Les données ont changé. Actualisez puis vérifiez votre opération.",
  422: "Vérifiez les champs du formulaire.",
  503: "Le service métier n’est pas encore configuré. Vous pouvez explorer la démonstration.",
};
export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  try {
    const response = await fetch(`/api/v1/${path}`, {
      ...init,
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...init.headers },
      signal: init.signal ?? AbortSignal.timeout(20000),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (
        response.status === 401 &&
        !path.startsWith("auth/") &&
        typeof window !== "undefined" &&
        location.pathname !== "/login"
      )
        location.assign("/login?expired=1");
      throw new ApiError(
        response.status,
        messages[response.status] ?? "L’opération a échoué. Réessayez.",
        body.fields ?? {},
      );
    }
    return body as T;
  } catch (error) {
    if (
      error instanceof ApiError ||
      (error instanceof Error && error.name === "AbortError")
    )
      throw error;
    throw new ApiError(
      0,
      "Connexion indisponible. Vérifiez votre réseau et réessayez.",
    );
  }
}
export const api = {
  snapshot: (
    storeId: string,
    start: string,
    end: string,
    signal?: AbortSignal,
    organizationId?: string,
  ) =>
    request<Snapshot>(
      `workspace?storeId=${encodeURIComponent(storeId)}&start=${start}&end=${end}${organizationId ? `&organizationId=${encodeURIComponent(organizationId)}` : ""}`,
      { signal },
    ),
  command: (command: Command) =>
    request<{ reference?: string; sale?: Sale }>("commands", {
      method: "POST",
      headers: { "Idempotency-Key": command.idempotencyKey },
      body: JSON.stringify(command),
    }),
  auth: (action: string, payload: Record<string, unknown>) =>
    request<{ message?: string; organization?: string; role?: string }>(
      `auth/${action}`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
};
