import { getSupabase } from "@/lib/supabase/client";
import { supabaseConfig } from "@/lib/supabase/config";
import type { Command, Snapshot, Sale, Organization } from "./types";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields: Record<string, string> = {},
    public code?: string,
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
    if (!/^[a-z][a-z0-9/-]*(?:\?.*)?$/.test(path) || path.includes("..")) throw new ApiError(400, "Route invalide.");
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (supabaseConfig()) {
      const { data, error } = await getSupabase().auth.getSession();
      if (error) throw new ApiError(401, messages[401]);
      if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
      else headers.delete("Authorization");
    }
    const response = await fetch(`/api/v1/${path}`, {
      ...init,
      cache: "no-store",
      credentials: "same-origin",
      headers,
      signal: init.signal ?? AbortSignal.timeout(20000),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.status === 422 && typeof body.fields?._form === "string" ? body.fields._form : messages[response.status] ?? "L’opération a échoué. Réessayez.",
        body.fields ?? {},
        body.code,
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
  snapshot: async (storeId:string,start:string,end:string,signal?:AbortSignal,organizationId?:string):Promise<Snapshot> => {
    const base=`workspace?${storeId ? `storeId=${encodeURIComponent(storeId)}&` : ""}start=${start}&end=${end}${organizationId ? `&organizationId=${encodeURIComponent(organizationId)}` : ""}`;
    for(let attempt=0;attempt<3;attempt++) {
      try {
        const snapshot=await request<Snapshot>(base,{signal});
        while(snapshot.pagination?.hasMore) {
          const page=await request<Snapshot>(`${base}&page=${snapshot.pagination.page+1}&snapshotVersion=${encodeURIComponent(snapshot.pagination.snapshotVersion)}`,{signal});
          if(page.session.organization.id!==snapshot.session.organization.id) throw new ApiError(409,messages[409]);
          for(const key of Object.keys(snapshot.data) as (keyof Snapshot["data"])[]) (snapshot.data[key] as unknown[]).push(...page.data[key]);
          snapshot.pagination=page.pagination;
        }
        return snapshot;
      }catch(e){if(!(e instanceof ApiError)||e.status!==409||attempt===2)throw e;}
    }
    throw new ApiError(409,messages[409]);
  },
  command: (command: Command) =>
    request<{ reference?: string; sale?: Sale }>("commands", {
      method: "POST",
      headers: { "Idempotency-Key": command.idempotencyKey },
      body: JSON.stringify(command),
    }),
  auth: (action: string, payload: Record<string, unknown>) =>
    request<{ message?: string; organization?: Organization; role?: string }>(
      `auth/${action}`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
};
