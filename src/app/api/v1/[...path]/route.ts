import { NextRequest, NextResponse } from "next/server";
import { resolveAccess, AccessFailure } from "@/lib/supabase/access";
const allowed = new Set([
  "access",
  "onboarding",
  "session",
  "workspace",
  "commands",
  "sales/quote",
  "documents/upload-url",
  "documents/complete",
  "documents/download-url",
  "fiscal/test",
  "telemetry",
  "auth/invitation",
  "auth/activate",
  "auth/accept-invitation",
]);
async function forward(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const path = (await params).path.join("/");
  if (!allowed.has(path))
    return NextResponse.json({ error: "Route introuvable." }, { status: 404 });
  if (req.method !== "GET" && req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  // Public invitation inspection remains public; all business reads and writes require approval.
  if (!["auth/invitation", "auth/activate", "auth/accept-invitation", "telemetry"].includes(path)) {
    try {
      const access = await resolveAccess(req);
      if (path === "access") return NextResponse.json(access, { headers: { "Cache-Control": "no-store" } });
      if (access.status !== "APPROVED") return NextResponse.json({ code: access.status }, { status: 403, headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      return NextResponse.json({ code: error instanceof AccessFailure ? error.code : "ACCESS_UNAVAILABLE" }, { status: error instanceof AccessFailure ? error.status : 503, headers: { "Cache-Control": "no-store" } });
    }
  }
  const base = process.env.FRONTEND_API_URL;
  if (!base)
    return NextResponse.json(
      { error: "Service métier non configuré." },
      { status: 503 },
    );
  try {
    const target = new URL(path, base.endsWith("/") ? base : base + "/");
    target.search = req.nextUrl.search;
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    const origin = req.headers.get("Origin");
    if (origin) headers.set("Origin", origin);
    const authorization = req.headers.get("Authorization");
    if (authorization) headers.set("Authorization", authorization);
    headers.set("Content-Type", req.headers.get("Content-Type") ?? "application/json");
    const cookie = req.headers.get("cookie");
    if (cookie) headers.set("Cookie", cookie);
    const key = req.headers.get("Idempotency-Key");
    if (key) headers.set("Idempotency-Key", key);
    const body = req.method === "GET" ? undefined : await req.text();
    if (body && new TextEncoder().encode(body).byteLength > 2_000_000)
      return NextResponse.json(
        { error: "Requête trop volumineuse." },
        { status: 413 },
      );
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(18000),
    });
    if (upstream.status >= 300 && upstream.status < 400)
      return NextResponse.json(
        { error: "Réponse inattendue." },
        { status: 502 },
      );
    const text = await upstream.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { error: "Réponse indisponible." },
        { status: 502 },
      );
    }
    const response = NextResponse.json(
      upstream.ok
        ? data
        : {
            error: "L’opération ne peut pas être exécutée.",
            ...(typeof data === "object" && data !== null && "code" in data &&
              ["ONBOARDING_REQUIRED", "NO_MEMBERSHIP", "FORBIDDEN", "PENDING_APPROVAL", "PENDING_EMAIL", "CONTACTED", "REJECTED", "SUSPENDED"].includes(String(data.code)) ? { code: data.code } : {}),
            ...(upstream.status === 422 &&
            typeof data === "object" &&
            data !== null &&
            "fields" in data
              ? { fields: data.fields }
              : {}),
          },
      { status: upstream.status, headers: { "Cache-Control": "no-store" } },
    );
    for (const cookie of upstream.headers.getSetCookie())
      response.headers.append(
        "Set-Cookie",
        cookie
          .replace(/;\s*Domain=[^;]+/gi, "")
          .replace(/;\s*Path=[^;]+/gi, "; Path=/"),
      );
    return response;
  } catch {
    return NextResponse.json(
      { error: "Service indisponible." },
      { status: 503 },
    );
  }
}
export const GET = forward;
export const POST = forward;
