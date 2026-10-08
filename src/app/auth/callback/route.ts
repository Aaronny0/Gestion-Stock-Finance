import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { authDestination, authFailureDestination } from "@/lib/supabase/redirect";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = authDestination(request.nextUrl.searchParams.get("next"));
  if (!request.nextUrl.searchParams.has("error") && code) {
    try {
      const client = await createSupabaseServer();
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (!error) {
        const response = NextResponse.redirect(new URL(next, request.nextUrl.origin), { headers: { "Cache-Control": "no-store" } });
        // Display preference only; never used to grant product access.
        if (data?.user) response.cookies.set("vortex_last_login", data.user.app_metadata?.provider === "google" ? "google" : "email", {
          path: "/", maxAge: 60 * 60 * 24 * 180, sameSite: "lax", secure: request.nextUrl.protocol === "https:", httpOnly: false,
        });
        return response;
      }
    } catch { /* Configuration/network errors use the same safe public message. */ }
  }
  const failure = authFailureDestination(next);
  return NextResponse.redirect(new URL(failure, request.nextUrl.origin), { headers: { "Cache-Control": "no-store" } });
}
