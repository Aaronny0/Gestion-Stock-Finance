/** Only explicit local auth destinations are accepted; never forward arbitrary URLs. */
export function authDestination(value: string | null, origin?: string) {
  // Email templates may preserve Supabase RedirectTo as a complete callback URL.
  // Unwrap exactly one callback on our own origin, then apply the local allowlist.
  if (origin && value && /^https?:\/\//.test(value)) {
    try {
      const callback = new URL(value);
      value = callback.origin === origin && callback.pathname === "/auth/callback" && !callback.username && !callback.password
        ? callback.searchParams.get("next") : null;
    } catch { value = null; }
  }
  if (value === "/reset-password" || value === "/onboarding") return value;
  if (value?.startsWith("/invite/activate?")) {
    const token = new URL(value, "https://local.invalid").searchParams.get("token");
    if (token) return `/invite/activate?token=${encodeURIComponent(token)}`;
  }
  return "/onboarding";
}
