import "server-only";
import type { NextRequest } from "next/server";
import {
  accessDecision,
  parseAccessStatus,
  type AccessDecision,
} from "@/lib/access-policy";
export class AccessFailure extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
function endpoint(path: string) {
  const base = process.env.FRONTEND_API_URL;
  if (!base) throw new AccessFailure(503, "ACCESS_UNAVAILABLE");
  return new URL(path, base.endsWith("/") ? base : base + "/");
}
function call(path: string, cookie: string) {
  return fetch(endpoint(path), {
    headers: { Cookie: cookie, Accept: "application/json" },
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
  }).catch(() => {
    throw new AccessFailure(503, "ACCESS_UNAVAILABLE");
  });
}
/** The Elysia backend owns the Better Auth session and the approval status; Next.js only relays the cookie. */
export async function resolveAccess(req: NextRequest): Promise<AccessDecision> {
  const cookie = req.headers.get("cookie");
  if (!cookie) throw new AccessFailure(401, "UNAUTHENTICATED");
  const access = await call("access", cookie);
  // A backend outage does not invalidate the user's session: 401 means invalid, anything else is 503.
  if (access.status === 401) throw new AccessFailure(401, "UNAUTHENTICATED");
  if (!access.ok) throw new AccessFailure(503, "ACCESS_UNAVAILABLE");
  const declared = (await access.json().catch(() => ({}))) as { status?: unknown };
  const status = parseAccessStatus(declared.status);
  if (status !== "APPROVED")
    return accessDecision(status !== "PENDING_EMAIL", status);
  const session = await call("session", cookie);
  const body = await session.json().catch(() => ({}));
  if (session.ok)
    return accessDecision(true, status);
  if (
    session.status === 403 &&
    ["ONBOARDING_REQUIRED", "NO_MEMBERSHIP"].includes(body.code)
  ) {
    const decision = accessDecision(true, status);
    return body.code === "NO_MEMBERSHIP" && decision.status === "APPROVED"
      ? { ...decision, destination: "/onboarding?state=no_membership" }
      : decision;
  }
  if (session.status === 401) throw new AccessFailure(401, "UNAUTHENTICATED");
  if (session.status === 403) return accessDecision(true, "SUSPENDED");
  throw new AccessFailure(503, "ACCESS_UNAVAILABLE");
}
