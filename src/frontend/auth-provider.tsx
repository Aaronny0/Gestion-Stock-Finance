"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getAuthClient, type AuthUser } from "@/lib/auth/client";
type Identity = { user: AuthUser | null; loading: boolean; error: string; signOut: () => Promise<void> };
const Context = createContext<Identity | null>(null);
export const pendingLoginKey = "vortex:pending-login";
// Display preference only; never used to grant product access.
function rememberLogin() {
  try {
    const provider = sessionStorage.getItem(pendingLoginKey);
    if (!provider) return;
    sessionStorage.removeItem(pendingLoginKey);
    document.cookie = `vortex_last_login=${provider}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  } catch { /* Storage can be unavailable; the preference is optional. */ }
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const demo = pathname === "/demo" || pathname.startsWith("/demo/");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (demo) { setUser(null); setLoading(false); setError(""); return; }
    let active = true;
    getAuthClient().getSession().then(({ data, error: failure }) => {
      if (!active) return;
      setUser((data?.user as AuthUser | undefined) ?? null);
      setLoading(false);
      setError(failure && failure.status !== 401 ? "Impossible de charger votre session." : "");
      if (data?.user) rememberLogin();
    }).catch(() => { if (active) { setLoading(false); setError("Connexion indisponible."); } });
    return () => { active = false; };
  }, [demo]);
  async function signOut() {
    const { error: failure } = await getAuthClient().signOut();
    if (failure) throw new Error("Déconnexion impossible. Réessayez.");
    setUser(null);
    sessionStorage.removeItem("vortex:onboarding");
  }
  return <Context.Provider value={{ user, loading, error, signOut }}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider requis");
  return value;
}
