import "server-only";
import type { NextRequest } from "next/server";
import { createSupabaseServer } from "./server";
import {
  accessDecision,
  declaredAccess,
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
export async function resolveAccess(req: NextRequest): Promise<AccessDecision> {
  const client = await createSupabaseServer();
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new AccessFailure(401, "UNAUTHENTICATED");
  const user = data.user;
  const declared = declaredAccess(user.app_metadata);
  if (!user.email_confirmed_at || (declared && declared !== "APPROVED"))
    return accessDecision(!!user.email_confirmed_at, declared, false);
  const base = process.env.FRONTEND_API_URL;
  if (!base) throw new AccessFailure(503, "ACCESS_UNAVAILABLE");
  const sessionToken =
    token ?? (await client.auth.getSession()).data.session?.access_token;
  const session = await fetch(
    new URL("session", base.endsWith("/") ? base : base + "/"),
    {
      headers: { Authorization: `Bearer ${sessionToken}` },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    },
  );
  const body = await session.json().catch(() => ({}));
  if (session.ok)
    return accessDecision(
      true,
      declared,
      Array.isArray(body.stores) && body.stores.length > 0,
    );
  if (
    session.status === 403 &&
    ["ONBOARDING_REQUIRED", "NO_MEMBERSHIP"].includes(body.code)
  ) {
    const decision = accessDecision(true, declared, false);
    return body.code === "NO_MEMBERSHIP" && decision.status === "APPROVED"
      ? { ...decision, destination: "/onboarding?state=no_membership" }
      : decision;
  }
  if (session.status === 401) throw new AccessFailure(401, "UNAUTHENTICATED");
  if (session.status === 403) return accessDecision(true, "SUSPENDED", false);
  throw new AccessFailure(503, "ACCESS_UNAVAILABLE");
}
