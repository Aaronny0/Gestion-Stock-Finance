import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "./config";
export async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = supabaseConfig();
  if (!config || request.nextUrl.pathname.startsWith("/demo")) return response;
  const client = createServerClient(config.url, config.key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: (items) => {
      for (const { name, value } of items) request.cookies.set(name, value);
      response = NextResponse.next({ request });
      for (const { name, value, options } of items) response.cookies.set(name, value, options);
    },
  } });
  await client.auth.getClaims();
  return response;
}
