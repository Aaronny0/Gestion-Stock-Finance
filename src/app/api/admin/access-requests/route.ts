import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { declaredAccess } from "@/lib/access-policy";
import { z } from "zod";
async function adminClient() {
  const client = await createSupabaseServer();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    return {
      response: NextResponse.json(
        { error: "Connexion requise." },
        { status: 401 },
      ),
    };
  if (data.user.app_metadata.vortex_admin !== true)
    return {
      response: NextResponse.json(
        { error: "Accès réservé à l’administration VORTEX." },
        { status: 403 },
      ),
    };
  const config = supabaseConfig(),
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !key)
    return {
      response: NextResponse.json(
        {
          error:
            "La gestion des demandes n’est pas encore configurée côté serveur.",
        },
        { status: 503 },
      ),
    };
  return {
    actor: data.user.id,
    token: (await client.auth.getSession()).data.session?.access_token,
    client: createClient(config.url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
  };
}
export async function GET(req: NextRequest) {
  try {
    const context = await adminClient();
    if (context.response) return context.response;
    const page = Math.max(
      1,
      Math.min(10000, Number(req.nextUrl.searchParams.get("page")) || 1),
    );
    const { data, error } = await context.client.auth.admin.listUsers({
      page,
      perPage: 50,
    });
    if (error) throw error;
    return NextResponse.json(
      {
        page,
        hasMore: data.users.length === 50,
        users: data.users
          .filter(
            (u) =>
              u.user_metadata.vortex_access_request ||
              declaredAccess(u.app_metadata),
          )
          .map((u) => ({
            id: u.id,
            name: String(
              u.user_metadata.name ?? u.user_metadata.full_name ?? "",
            ),
            company: String(u.user_metadata.company ?? ""),
            phone: String(u.user_metadata.phone ?? ""),
            email: u.email ?? "",
            date: u.created_at,
            verified: !!u.email_confirmed_at,
            status: !u.email_confirmed_at
              ? "PENDING_EMAIL"
              : (declaredAccess(u.app_metadata) ?? "PENDING_APPROVAL"),
            lastActivity: u.last_sign_in_at,
            updatedAt: u.updated_at,
          })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible de charger les demandes. Réessayez." },
      { status: 503 },
    );
  }
}
const update = z.object({
  id: z.string().uuid(),
  status: z.enum(["CONTACTED", "APPROVED", "REJECTED", "SUSPENDED"]),
  reason: z.string().trim().max(500).default(""),
});
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  try {
    const context = await adminClient();
    if (context.response) return context.response;
    const parsed = update.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Demande invalide." }, { status: 422 });
    const body = parsed.data;
    if (body.id === context.actor)
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre accès." },
        { status: 403 },
      );
    if (
      ["REJECTED", "SUSPENDED"].includes(body.status) &&
      body.reason.length < 5
    )
      return NextResponse.json(
        { error: "Précisez le motif de cette décision." },
        { status: 422 },
      );
    const { data, error } = await context.client.auth.admin.getUserById(
      body.id,
    );
    if (error || !data.user)
      return NextResponse.json(
        { error: "Compte introuvable." },
        { status: 404 },
      );
    if (!data.user.email_confirmed_at && body.status === "APPROVED")
      return NextResponse.json(
        { error: "L’adresse e-mail doit être confirmée avant approbation." },
        { status: 409 },
      );
    if (data.user.app_metadata.vortex_admin === true)
      return NextResponse.json(
        { error: "Les accès administrateurs se gèrent hors de ce parcours." },
        { status: 403 },
      );
    const decisionAt = new Date().toISOString();
    const result = await context.client.auth.admin.updateUserById(body.id, {
      app_metadata: {
        ...data.user.app_metadata,
        vortex_access_status: body.status,
        vortex_access_decision: {
          actor: context.actor,
          date: decisionAt,
          reason: body.reason,
        },
      },
    });
    if (result.error) throw result.error;
    let notification = "not_required";
    if (body.status === "APPROVED") {
      notification = "unavailable";
      const base = process.env.FRONTEND_API_URL;
      if (base && context.token) {
        try {
          const response = await fetch(
            new URL(
              "admin/access-notification",
              base.endsWith("/") ? base : base + "/",
            ),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${context.token}`,
                Origin: req.nextUrl.origin,
              },
              body: JSON.stringify({
                userId: body.id,
                email: data.user.email,
                decisionAt,
              }),
              cache: "no-store",
              redirect: "manual",
              signal: AbortSignal.timeout(15000),
            },
          );
          if (response.ok && (await response.json()).notification === "queued")
            notification = "queued";
        } catch {
          /* Approval remains recorded even when the mail queue is unavailable. */
        }
      }
    }
    return NextResponse.json(
      {
        status: body.status,
        message:
          "Décision enregistrée. Le statut sera vérifié lors du prochain accès.",
        notification,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "La décision n’a pas pu être enregistrée." },
      { status: 503 },
    );
  }
}
