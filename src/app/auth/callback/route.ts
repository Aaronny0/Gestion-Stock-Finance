import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { authDestination } from "@/lib/supabase/redirect";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = authDestination(request.nextUrl.searchParams.get("next"));
  if (!request.nextUrl.searchParams.has("error") && code) {
    try {
      const client = await createSupabaseServer();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, request.nextUrl.origin), { headers: { "Cache-Control": "no-store" } });
    } catch { /* Configuration/network errors use the same safe public message. */ }
  }
  const failure = next === "/reset-password" ? "/reset-password?error=invalid_link"
    : next.startsWith("/invite/activate?") ? `${next}&error=auth_callback` : "/login?error=auth_callback";
  return NextResponse.redirect(new URL(failure, request.nextUrl.origin), { headers: { "Cache-Control": "no-store" } });
}
