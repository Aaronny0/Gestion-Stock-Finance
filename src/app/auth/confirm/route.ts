import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { authDestination, authFailureDestination } from "@/lib/supabase/redirect";
export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const recovery = type === "recovery";
  const next = recovery ? "/reset-password" : authDestination(request.nextUrl.searchParams.get("next"), request.nextUrl.origin);
  if (token_hash && (type === "email" || type === "signup" || recovery)) {
    try {
      const client = await createSupabaseServer();
      const { error } = await client.auth.verifyOtp({ token_hash, type });
      if (!error) return NextResponse.redirect(new URL(next, request.nextUrl.origin), { headers: { "Cache-Control": "no-store" } });
    } catch { /* Safe error below. */ }
  }
  return NextResponse.redirect(new URL(authFailureDestination(next), request.nextUrl.origin), { headers: { "Cache-Control": "no-store" } });
}
