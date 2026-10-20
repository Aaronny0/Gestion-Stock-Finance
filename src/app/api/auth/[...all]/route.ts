import { NextRequest, NextResponse } from "next/server";

// Transport only: Better Auth runs in the Elysia backend under /api/auth/*.
// The browser talks to this origin; session cookies come back untouched (Domain included).
const forwardedRequestHeaders = ["content-type", "cookie", "origin", "user-agent"];

function blocked(segments: string[]) {
  const [first] = segments;
  return first === "admin" || first === "email-otp";
}

async function forward(
  req: NextRequest,
  { params }: { params: Promise<{ all: string[] }> },
) {
  if (req.method !== "GET" && req.method !== "POST")
    return NextResponse.json({ error: "Méthode refusée." }, { status: 405 });
  const segments = (await params).all;
  // Admin endpoints and one-time codes are reserved for the admin application.
  if (blocked(segments))
    return NextResponse.json({ error: "Route introuvable." }, { status: 404 });
  const base = process.env.AUTH_API_URL || "http://vortex-api:3001";
  try {
    const target = new URL("/api/auth/" + segments.map(encodeURIComponent).join("/"), base);
    target.search = req.nextUrl.search;
    const headers = new Headers();
    for (const name of forwardedRequestHeaders) {
      const value = req.headers.get(name);
      if (value) headers.set(name, value);
    }
    // Better Auth rate-limits and audits by client address.
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    if (ip) headers.set("x-forwarded-for", ip);
    const body = req.method === "POST" ? await req.text() : undefined;
    if (body && new TextEncoder().encode(body).byteLength > 1_000_000)
      return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
    const response = new NextResponse(
      [204, 205, 304].includes(upstream.status) || (upstream.status >= 300 && upstream.status < 400)
        ? null
        : await upstream.arrayBuffer(),
      { status: upstream.status },
    );
    const type = upstream.headers.get("content-type");
    if (type) response.headers.set("Content-Type", type);
    const location = upstream.headers.get("location");
    if (location) response.headers.set("Location", location);
    response.headers.set("Cache-Control", "no-store");
    for (const cookie of upstream.headers.getSetCookie())
      response.headers.append("Set-Cookie", cookie);
    return response;
  } catch {
    return NextResponse.json({ error: "Service indisponible." }, { status: 503 });
  }
}
export const GET = forward;
export const POST = forward;
