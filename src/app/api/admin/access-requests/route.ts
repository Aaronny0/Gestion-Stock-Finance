import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// Transport only: NestJS owns authorization, decisions and all privileged keys.
async function forward(req: NextRequest) {
  if (req.method === "POST" && req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  try {
    const client = await createSupabaseServer();
    const { data } = await client.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    const base = process.env.FRONTEND_API_URL;
    if (!base) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });
    const target = new URL("admin/access-requests", base.endsWith("/") ? base : base + "/");
    target.search = req.nextUrl.search;
    const response = await fetch(target, {
      method: req.method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Origin: req.nextUrl.origin },
      ...(req.method === "POST" ? { body: JSON.stringify(await req.json()) } : {}),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(18000),
    });
    return NextResponse.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Service indisponible. Réessayez." }, { status: 503 });
  }
}
export const GET = forward;
export const POST = forward;
