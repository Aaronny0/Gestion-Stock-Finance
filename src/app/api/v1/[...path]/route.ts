import { NextRequest, NextResponse } from "next/server";
const allowed = new Set([
  "session",
  "workspace",
  "commands",
  "sales/quote",
  "documents/upload-url",
  "fiscal/test",
  "telemetry",
  "auth/login",
  "auth/signup",
  "auth/logout",
  "auth/forgot-password",
  "auth/invitation",
  "auth/activate",
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
    const cookie = req.headers.get("cookie");
    if (cookie) headers.set("Cookie", cookie);
    const key = req.headers.get("Idempotency-Key");
    if (key) headers.set("Idempotency-Key", key);
    const body = req.method === "GET" ? undefined : await req.text();
    if (body && body.length > 2_000_000)
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
