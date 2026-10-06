"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/frontend/auth-provider";
import { getSupabase } from "@/lib/supabase/client";
import { Alert, Field } from "@/frontend/ui";
export default function ResetPassword() {
  const auth = useAuth();
  const [password, setPassword] = useState(""), [confirmation, setConfirmation] = useState("");
  const [invalid, setInvalid] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [success, setSuccess] = useState(false);
  useEffect(() => { if (new URLSearchParams(location.search).has("error")) queueMicrotask(() => setInvalid(true)); }, []);
  return <main className="auth-main"><div className="auth-form"><h1>Choisissez votre nouveau mot de passe</h1>
    {invalid || (!auth.loading && !auth.user) ? <Alert error>Lien invalide ou expiré. Demandez un nouveau lien.</Alert> : success ? <Alert>Mot de passe enregistré. Reconnectez-vous.</Alert> : <form onSubmit={async e => {
      e.preventDefault(); if (busy) return;
      if (password !== confirmation) { setError("Les mots de passe ne correspondent pas."); return; }
      setBusy(true); setError("");
      try {
        const { error } = await getSupabase().auth.updateUser({ password });
        if (error) throw new Error("Lien expiré ou mot de passe refusé. Demandez un nouveau lien.");
        await auth.signOut(); setSuccess(true);
      } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
    }}><Field label="Nouveau mot de passe"><input required minLength={10} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></Field><Field label="Confirmer le mot de passe"><input required minLength={10} type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} /></Field>{error && <Alert error>{error}</Alert>}<button className="button primary" disabled={busy || auth.loading || !auth.user}>Enregistrer le mot de passe</button></form>}
    <Link href="/forgot-password">Demander un nouveau lien</Link><Link href="/login">Retour à la connexion</Link>
  </div></main>;
}
