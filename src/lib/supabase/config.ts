export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}
export function requireConfig() {
  const config = supabaseConfig();
  if (!config) throw new Error("Authentification non configurée. Contactez l’administrateur.");
  return config;
}
