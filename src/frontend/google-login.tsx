"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, LoaderCircle, ArrowUpRight } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import { authError, businessDestination } from "./auth-flow";
import styles from "./google-login.module.css";

export default function GoogleLogin() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastUsed, setLastUsed] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState("");

  useEffect(() => {
    setLastUsed(document.cookie.split("; ").find(value => value.startsWith("vortex_last_login="))?.split("=")[1] ?? "");
    if (new URLSearchParams(location.search).has("error")) {
      setError("La connexion n’a pas abouti. Veuillez réessayer.");
    }
  }, []);

  useEffect(() => {
    if (!auth.loading && auth.user) {
      void businessDestination()
        .then(destination => location.replace(destination))
        .catch(e => setError(e.message));
    }
  }, [auth.loading, auth.user]);

  async function connect() {
    if (busy) return;
    setBusy(true);
    setMethod("google");
    setError("");
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}/auth/callback?next=/access-pending` },
      });
      if (error) throw new Error(authError(error));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion indisponible. Réessayez.");
      setBusy(false);
    }
  }

  async function connectEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMethod("email"); setError("");
    try {
      const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) {
        if (error.code === "email_not_confirmed") { location.assign("/verify-email"); return; }
        throw new Error(authError(error));
      }
      if (!data.session) throw new Error("Session indisponible. Réessayez.");
      document.cookie = `vortex_last_login=email; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      setLastUsed("email");
      location.assign(await businessDestination());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion indisponible. Réessayez.");
      setBusy(false);
    }
  }

  return <div className={styles.page}>
    <Link href="/" className={styles.home}><ChevronLeft size={15} aria-hidden="true" />Accueil</Link>
    <Link href="/demo" className={styles.demo}>Voir la démonstration <ArrowUpRight size={16} aria-hidden="true" /></Link>
    <main className={styles.content}>
      <Link href="/" className={styles.logo} aria-label="VORTEX — accueil">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M3 6h8l6 13 5-13h7L17 29 3 6Z" fill="currentColor"/><path d="m3 6 14 13L11 6H3Z" fill="white" opacity=".4"/></svg>
      </Link>
      <h1>Accéder à VORTEX</h1>
      <p className={styles.subtitle}>Pas encore de compte ? <Link href="/signup">Demander un accès.</Link></p>
      <div className={styles.action}>
        {lastUsed === "google" && <span className={styles.badge}>Last used</span>}
        <button type="button" onClick={connect} disabled={busy || auth.loading || !!auth.user} className={styles.google}>
          {busy || auth.loading || auth.user ? <LoaderCircle className={styles.spinner} size={18} aria-hidden="true"/> : <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36ZM12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.61 0-4.82-1.76-5.61-4.12H3.05v2.59A10 10 0 0 0 12 22ZM6.39 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.48H3.05A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.52l3.34-2.59ZM12 5.95c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.48l3.34 2.59A5.99 5.99 0 0 1 12 5.95Z"/></svg>}
          {busy && method === "google" ? "Connexion à Google…" : auth.user ? "Ouverture de votre espace…" : "Continuer avec Google"}
        </button>
      </div>
      <div className={styles.divider}><span>ou avec votre e-mail</span></div>
      <form className={styles.form} onSubmit={connectEmail}>
        <label htmlFor="login-email">Adresse e-mail</label>
        <input id="login-email" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@entreprise.com" />
        <div className={styles.passwordLabel}><label htmlFor="login-password">Mot de passe</label><Link href="/forgot-password">Mot de passe oublié ?</Link></div>
        <input id="login-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
        <div className={styles.emailAction}>
          {lastUsed === "email" && <span className={styles.badge}>Last used</span>}
          <button className={styles.submit} disabled={busy || auth.loading || !!auth.user}>{busy && method === "email" ? "Connexion en cours…" : "Se connecter par e-mail"}</button>
        </div>
      </form>
      {(error || auth.error) && <p role="alert" className={styles.error}>{error || auth.error}</p>}
      <p className={styles.note}>Votre espace vous attend.<br/>L’accès à VORTEX est réservé aux comptes approuvés.</p>
    </main>
  </div>;
}
