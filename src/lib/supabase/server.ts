import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireConfig, authCookieOptions } from "./config";
export async function createSupabaseServer() {
  const config = requireConfig();
  const url = process.env.SUPABASE_INTERNAL_URL || config.url, key = config.key;
  const jar = await cookies();
  return createServerClient(url, key, { cookieOptions: authCookieOptions(), cookies: {
    getAll: () => jar.getAll(),
    setAll: (items) => { for (const { name, value, options } of items) jar.set(name, value, options); },
  } });
}
