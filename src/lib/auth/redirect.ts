/** Only explicit local auth destinations are accepted; never forward arbitrary URLs. */
export function authDestination(value: string | null) {
  if (value === "/reset-password" || value === "/access-pending" || value === "/verify-email") return value;
  if (value?.startsWith("/invite/activate?")) {
    const token = new URL(value, "https://local.invalid").searchParams.get("token");
    if (token) return `/invite/activate?token=${encodeURIComponent(token)}`;
  }
  return "/access-pending";
}

/** Errors stay in the relevant auth flow; destinations must already be allowlisted. */
export function authFailureDestination(next: string) {
  if (next === "/reset-password" || next === "/verify-email") return `${next}?error=invalid_link`;
  if (next.startsWith("/invite/activate?")) return `${next}&error=auth_callback`;
  return "/login?error=auth_callback";
}
