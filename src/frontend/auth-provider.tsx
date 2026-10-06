"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { supabaseConfig } from "@/lib/supabase/config";
type Identity = { session: Session | null; user: User | null; accessToken: string | null; loading: boolean; error: string; signOut: () => Promise<void> };
const Context = createContext<Identity | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!supabaseConfig()) { setError("Authentification non configurée."); setLoading(false); return; }
    const client = getSupabase();
    let active = true, eventSeen = false;
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      eventSeen = true;
      if (active) { setSession(next); setLoading(false); setError(""); }
    });
    void client.auth.getSession().then(({ data, error }) => {
      if (!active || eventSeen) return;
      setSession(data.session); setLoading(false);
      if (error) setError("Impossible de charger votre session.");
    }).catch(() => { if (active) { setLoading(false); setError("Connexion indisponible."); } });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  async function signOut() {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw new Error("Déconnexion impossible. Réessayez.");
    setSession(null);
    sessionStorage.removeItem("vortex:onboarding");
  }
  return <Context.Provider value={{ session, user: session?.user ?? null, accessToken: session?.access_token ?? null, loading, error, signOut }}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider requis");
  return value;
}
