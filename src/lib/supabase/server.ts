import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireConfig } from "./config";
export async function createSupabaseServer() {
  const { url, key } = requireConfig();
  const jar = await cookies();
  return createServerClient(url, key, { cookies: {
    getAll: () => jar.getAll(),
    setAll: (items) => { for (const { name, value, options } of items) jar.set(name, value, options); },
  } });
}
