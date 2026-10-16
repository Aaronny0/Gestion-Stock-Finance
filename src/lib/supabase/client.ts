"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { requireConfig, authCookieOptions } from "./config";
let client: SupabaseClient | undefined;
export function getSupabase() {
  const { url, key } = requireConfig();
  return client ??= createBrowserClient(url, key, { cookieOptions: authCookieOptions() });
}
