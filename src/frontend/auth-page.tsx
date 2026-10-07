"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { AppLogo } from "@/components/layout/app-logo";
import { api } from "./api";
import { useAuth } from "./auth-provider";
import { getSupabase } from "@/lib/supabase/client";
import { authError, businessDestination } from "./auth-flow";
import { Alert, Field } from "./ui";
export default function AuthPage() {
  const auth = useAuth();
  const router = useRouter();
  const path = usePathname(), signup = path === "/signup", forgot = path === "/forgot-password", invite = path === "/invite/activate";
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [success, setSuccess] = useState("");
  const [invitation, setInvitation] = useState<{ organization?: { name: string }; role?: string } | null>(null);
  const change = (key: string, value: string) => setValues(v => ({ ...v, [key]: value }));
  useEffect(() => {
    if (!invite) return;
    const token = new URLSearchParams(location.search).get("token");
    if (!token) { setError("Lien d’invitation incomplet. Demandez un nouveau lien au propriétaire."); return; }
    api.auth("invitation", { token }).then(setInvitation).catch(() => setError("Invitation indisponible ou expirée. Demandez un nouveau lien au propriétaire."));
  }, [invite]);
  useEffect(() => {
    if (new URLSearchParams(location.search).has("error")) setError("Lien invalide ou expiré. Recommencez la connexion.");
    if (path === "/login" && !auth.loading && auth.user) void businessDestination().then(destination => location.replace(destination)).catch(e => setError(e.message));
  }, [path, auth.loading, auth.user]);
  const input = (key: string, label: string, type = "text", required = true) => <Field label={label} required={required}><input name={key} type={type} required={required} maxLength={key === "password" ? 128 : 160} minLength={key === "password" && (signup || invite) ? 10 : undefined} autoComplete={key === "email" ? "email" : key === "password" ? signup || invite ? "new-password" : "current-password" : key === "name" ? "name" : key === "phone" ? "tel" : key === "company" ? "organization" : undefined} value={values[key] ?? ""} onChange={e => change(key, e.target.value)} /></Field>;
  async function google() {
    setBusy(true); setError("");
    try {
      const next = invite ? `/invite/activate?token=${encodeURIComponent(new URLSearchParams(location.search).get("token") ?? "")}` : "/access-pending";
      const { error } = await getSupabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
      if (error) throw new Error(authError(error));
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }
  return <div className="access-layout"><header><AppLogo href="/"/><Link href="/demo">Découvrir la démonstration</Link></header>
    <main className="access-content auth-content"><div className="auth-intro"><span>{signup ? "Demande d’accès" : invite ? "Invitation à rejoindre une équipe" : "Votre espace professionnel"}</span><h1>{signup ? "Faisons place à votre activité." : forgot ? "Retrouvez votre accès." : invite ? "Rejoignez votre équipe." : "Accéder à VORTEX"}</h1><p>{signup ? "Présentez-nous votre entreprise. Après confirmation de votre e-mail, notre équipe examinera votre demande." : forgot ? "Recevez un lien pour choisir un nouveau mot de passe." : invite ? `${invitation?.organization?.name ?? "Votre entreprise"} vous invite dans son espace.` : "Retrouvez vos opérations, votre équipe et vos chiffres."}</p></div>
    {!forgot && !signup && (!invite || !auth.user) && <><button type="button" className="button secondary full google-button" disabled={busy || auth.loading} onClick={google}><span aria-hidden="true">G</span> Continuer avec Google</button><div className="auth-divider"><span>ou avec votre e-mail</span></div></>}
    <form onSubmit={async e => {
      e.preventDefault(); if (busy) return; setBusy(true); setError(""); setSuccess("");
      try {
        const client = getSupabase();
        if (forgot) {
          const { error } = await client.auth.resetPasswordForEmail(values.email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` });
          if (error) throw new Error(authError(error));
          setSuccess("Si ce compte existe, un lien de réinitialisation a été envoyé.");
        } else if (signup) {
          const { data, error } = await client.auth.signUp({ email: values.email, password: values.password, options: {
            data: { name: values.name, company: values.company, phone: values.phone, vortex_access_request: true },
            emailRedirectTo: `${location.origin}/auth/callback?next=/access-pending`,
          } });
          if (error) throw new Error(authError(error));
          location.assign(data.session ? "/access-pending" : "/verify-email");
        } else if (invite) {
          if (!auth.user) {
            const next = `/invite/activate?token=${encodeURIComponent(new URLSearchParams(location.search).get("token") ?? "")}`;
            const result = values.newAccount === "yes" ? await client.auth.signUp({ email: values.email, password: values.password, options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` } }) : await client.auth.signInWithPassword({ email: values.email, password: values.password });
            if (result.error) throw new Error(authError(result.error));
            if (!result.data.session) { setSuccess("Confirmez votre adresse email pour reprendre cette invitation."); return; }
          }
          await api.auth("activate", { token: new URLSearchParams(location.search).get("token") });
          location.assign(await businessDestination());
        } else {
          const { data, error } = await client.auth.signInWithPassword({ email: values.email, password: values.password });
          if (error) { if(error.code === "email_not_confirmed") { router.replace("/verify-email"); return; } throw new Error(authError(error)); }
          if (!data.session) throw new Error("Session indisponible. Réessayez.");
          location.assign(await businessDestination());
        }
      } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
    }}>
      {signup ? <><div className="auth-field-pair">{input("name","Nom complet")}{input("company","Entreprise")}</div>{input("email","Adresse e-mail","email")}{input("phone","Téléphone","tel",false)}{input("password","Mot de passe (10 caractères minimum)","password")}</> : forgot ? input("email","Adresse e-mail","email") : invite ? auth.user ? <p>Connecté avec {auth.user.email}. Validez pour rejoindre cette équipe.</p> : <>{input("email","Adresse e-mail","email")}{input("password","Mot de passe","password")}<Field label="Votre compte"><select value={values.newAccount ?? "no"} onChange={e=>change("newAccount",e.target.value)}><option value="no">J’ai déjà un compte</option><option value="yes">Créer un compte</option></select></Field></> : <>{input("email","Adresse e-mail","email")}<Field label="Mot de passe"><div className="password-field"><input name="password" required type={visible ? "text" : "password"} autoComplete="current-password" value={values.password ?? ""} onChange={e=>change("password",e.target.value)}/><button type="button" aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"} onClick={()=>setVisible(!visible)}>{visible ? <EyeOff/> : <Eye/>}</button></div></Field><div className="auth-form-link"><Link href="/forgot-password">Mot de passe oublié ?</Link></div></>}
      {error && <Alert error>{error}</Alert>}{success && <Alert>{success}</Alert>}
      <button className="button primary full" disabled={busy || auth.loading || (invite && !invitation)}>{busy ? "Veuillez patienter…" : signup ? "Envoyer ma demande" : forgot ? "Envoyer le lien" : invite ? "Rejoindre l’équipe" : "Se connecter"}<ArrowRight/></button>
    </form>
    {signup && <p className="auth-help">Aucun accès immédiat n’est créé. La configuration de votre entreprise commence après validation.</p>}
    <div className="auth-bottom">{path === "/login" ? <><span>Vous souhaitez utiliser VORTEX ?</span><Link href="/signup">Demander un accès</Link></> : <Link href="/login">Retour à la connexion</Link>}</div>
    </main><footer className="access-footer">VORTEX <span>Votre activité, en toute clarté.</span></footer></div>;
}
