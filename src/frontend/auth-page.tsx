"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, KeyRound, LoaderCircle, LockKeyhole, MailCheck } from "lucide-react";
import { api } from "./api";
import { useAuth } from "./auth-provider";
import { getSupabase } from "@/lib/supabase/client";
import { supabaseConfig } from "@/lib/supabase/config";
import { authError, businessDestination, saveOnboarding, readOnboarding } from "./auth-flow";
import { roleLabels, type Role } from "./types";
import { AuthShell } from "./auth-shell";
import { AuthField, AuthNotice } from "./auth-fields";
import styles from "./auth-design.module.css";

type Invitation = { organization?: { name: string }; role?: string };
// Client-only notification survives the workspace remount on sign-out. No credentials retained.
let passwordUpdatedAt = 0;
const passwordUpdatedMessage = "Mot de passe enregistré. Reconnectez-vous.";
const steps = ["Compte", "Entreprise", "Boutique", "Récapitulatif"];
const accountFields = ["name", "email", "password"];
const companyFields = ["organizationName", "country", "currency", "timezone"];
const storeFields = ["storeName", "city"];

export default function AuthPage() {
  const path = usePathname();
  // Remount between routes so passwords and success states never leak to another form.
  return <AuthScreen key={path} path={path} />;
}

export function AuthScreen({ path }: { path: string }) {
  const auth = useAuth();
  const router = useRouter();
  const signup = path === "/signup", forgot = path === "/forgot-password", invite = path === "/invite/activate", reset = path === "/reset-password", verify = path === "/verify-email";
  const login = !signup && !forgot && !invite && !reset && !verify;
  const [values, setValues] = useState<Record<string, string>>({ country: "Bénin", currency: "XOF", timezone: "Africa/Porto-Novo", newAccount: "yes" });
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [success, setSuccess] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [lastUsed, setLastUsed] = useState("");
  const [invalidLink, setInvalidLink] = useState(false);
  const [resolvingLink, setResolvingLink] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busyAction, setBusyAction] = useState<"form" | "google" | null>(null);
  const submitting = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const change = (key: string, value: string) => { setValues(v => ({ ...v, [key]: value })); setErrors(e => ({ ...e, [key]: "" })); setSuccess(""); };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has("error") || new URLSearchParams(location.hash.slice(1)).has("error")) {
      setInvalidLink(true);
      setError(reset || verify ? "Lien invalide ou expiré. Demandez un nouveau lien." : "La connexion n’a pas abouti. Veuillez réessayer.");
      return;
    }
    // The workspace shell remounts public pages when the identity changes on sign-out.
    // Consume a short-lived, memory-only notice; storage availability cannot block password changes.
    if (reset && passwordUpdatedAt && Date.now() - passwordUpdatedAt < 60_000) {
      passwordUpdatedAt = 0;
      setSuccess(passwordUpdatedMessage);
    }
    if (verify) {
      const draft = readOnboarding();
      if (draft?.payload.email) setValues(v => ({ ...v, email: draft.payload.email }));
    }
    // Supabase's existing server handlers validate tokens and write secure session cookies.
    if (reset || verify) {
      const hash = params.get("token_hash");
      const code = params.get("code");
      if (hash) {
        setResolvingLink(true);
        location.replace(`/auth/confirm?${new URLSearchParams({ token_hash: hash, type: reset ? "recovery" : params.get("type") === "email" ? "email" : "signup", next: reset ? "/reset-password" : "/verify-email" })}`);
      } else if (code) {
        setResolvingLink(true);
        location.replace(`/auth/callback?${new URLSearchParams({ code, next: reset ? "/reset-password" : "/verify-email" })}`);
      }
    }
    setLastUsed(document.cookie.split("; ").find(v => v.startsWith("vortex_last_login="))?.split("=")[1] ?? "");
  }, [reset, verify]);

  useEffect(() => {
    if (!login) return;
    const config = supabaseConfig();
    if (!config) return;
    const controller = new AbortController();
    // Public Auth settings are the source of truth; no optimistic Google button.
    fetch(`${config.url}/auth/v1/settings`, { headers: { apikey: config.key }, signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(settings => { if (!controller.signal.aborted) setGoogleEnabled(settings?.external?.google === true); })
      .catch(() => { /* Email remains available if provider discovery fails. */ });
    return () => controller.abort();
  }, [login]);

  useEffect(() => {
    if (!invite) return;
    const token = new URLSearchParams(location.search).get("token");
    if (!token) { setError("Lien d’invitation incomplet. Demandez un nouveau lien au propriétaire."); return; }
    let active = true;
    api.auth("invitation", { token }).then(data => { if (active) setInvitation(data); }).catch(() => { if (active) setError("Invitation indisponible ou expirée. Demandez un nouveau lien au propriétaire."); });
    return () => { active = false; };
  }, [invite]);

  useEffect(() => {
    if (auth.loading || !auth.user || busy || resolvingLink) return;
    let active = true;
    if (login) void businessDestination().then(destination => { if (active) location.replace(destination); }).catch(e => { if (active) setError(e.message); });
    if (verify && !invalidLink && auth.user.email_confirmed_at) setConfirmed(true);
    return () => { active = false; };
  }, [auth.loading, auth.user, login, verify, busy, invalidLink, resolvingLink]);

  function validate() {
    const next: Record<string, string> = {};
    const fields = signup ? step === 0 ? accountFields : step === 1 ? companyFields : step === 2 ? storeFields : [...accountFields, ...companyFields, ...storeFields] : reset ? ["password", "confirmation"] : invite && auth.user ? [] : forgot || verify ? ["email"] : ["email", "password"];
    for (const key of fields) if (!values[key]?.trim()) next[key] = "Ce champ est requis.";
    if (fields.includes("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email ?? "")) next.email = "Saisissez une adresse email valide.";
    if ((signup || reset || (invite && values.newAccount === "yes" && !auth.user)) && (values.password?.length ?? 0) < 12) next.password = "Utilisez au moins 12 caractères.";
    if (reset && values.password !== values.confirmation) next.confirmation = "Les mots de passe ne correspondent pas.";
    if (signup && step >= 1) {
      if (!/^[A-Z]{3}$/.test(values.currency ?? "")) next.currency = "Utilisez un code de devise de 3 lettres (ex. XOF).";
      try { new Intl.DateTimeFormat("fr", { timeZone: values.timezone }); } catch { next.timezone = "Indiquez un fuseau valide (ex. Africa/Porto-Novo)."; }
    }
    setErrors(next);
    if (Object.keys(next).length) {
      setError("Vérifiez les champs du formulaire.");
      requestAnimationFrame(() => document.getElementById(`auth-${Object.keys(next)[0]}`)?.focus());
      return false;
    }
    return true;
  }

  async function google() {
    if (submitting.current || !googleEnabled) return;
    submitting.current = true; setBusyAction("google"); setBusy(true); setError("");
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback?next=/access-pending` } });
      if (error) throw new Error(authError(error));
    } catch (e) { setError((e as Error).message); setBusy(false); setBusyAction(null); submitting.current = false; }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || resolvingLink) return;
    setError(""); setSuccess("");
    if (!validate()) return;
    if (signup && step < 3) { setStep(s => s + 1); requestAnimationFrame(() => heading.current?.focus()); return; }
    if (invite && !invitation) return;
    if (reset && (invalidLink || !auth.user)) return;
    submitting.current = true; setBusyAction("form"); setBusy(true);
    try {
      const client = getSupabase();
      const email = values.email?.trim();
      if (forgot) {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` });
        if (error) throw new Error(authError(error));
        setSuccess("Si ce compte existe, un lien de réinitialisation a été envoyé.");
      } else if (signup) {
        // This is a draft, never an authorization claim or premature workspace creation.
        const draft = saveOnboarding({ ...values, email, name: values.name.trim(), organizationName: values.organizationName.trim() });
        const { data, error } = await client.auth.signUp({ email, password: values.password, options: {
          data: { name: values.name.trim(), company: values.organizationName.trim(), phone: values.phone?.trim() ?? "", vortex_access_request: true, vortex_onboarding: draft },
          emailRedirectTo: `${location.origin}/auth/callback?next=/verify-email`,
        } });
        if (error) throw new Error(authError(error));
        location.assign(data.session ? "/access-pending" : "/verify-email");
      } else if (verify) {
        const { error } = await client.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${location.origin}/auth/callback?next=/verify-email` } });
        if (error) throw new Error(authError(error));
        setSuccess("Si une confirmation est en attente, un nouveau lien vous a été envoyé.");
      } else if (reset) {
        const { error } = await client.auth.updateUser({ password: values.password });
        if (error) throw new Error("Lien expiré ou mot de passe refusé. Demandez un nouveau lien.");
        passwordUpdatedAt = Date.now();
        await auth.signOut();
        setSuccess(passwordUpdatedMessage);
      } else if (invite) {
        const token = new URLSearchParams(location.search).get("token");
        if (!auth.user) {
          const next = `/invite/activate?token=${encodeURIComponent(token ?? "")}`;
          const result = values.newAccount === "yes" ? await client.auth.signUp({ email, password: values.password, options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` } }) : await client.auth.signInWithPassword({ email, password: values.password });
          if (result.error) throw new Error(authError(result.error));
          if (!result.data.session) { setSuccess("Confirmez votre adresse email pour reprendre cette invitation."); return; }
        }
        await api.auth("activate", { token });
        location.assign(await businessDestination());
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password: values.password });
        if (error) {
          if (error.code === "email_not_confirmed") { router.replace("/verify-email"); return; }
          throw new Error(authError(error));
        }
        if (!data.session) throw new Error("Session indisponible. Réessayez.");
        document.cookie = `vortex_last_login=email; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
        location.assign(await businessDestination());
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Service indisponible. Réessayez."); }
    finally { setBusy(false); setBusyAction(null); submitting.current = false; }
  }

  const field = (name: string, label: string, options: Partial<React.ComponentProps<typeof AuthField>> = {}) => <AuthField key={name} name={name} label={label} value={values[name] ?? ""} onChange={v => change(name, v)} error={errors[name]} disabled={busy} {...options} />;
  const passwordOptions = { type: "password", autoComplete: signup || reset || (invite && values.newAccount === "yes") ? "new-password" : "current-password", minLength: signup || reset || (invite && values.newAccount === "yes") ? 12 : undefined, maxLength: 128, strength: signup || reset || (invite && values.newAccount === "yes"), placeholder: signup || reset ? "12 caractères minimum" : undefined };
  const title = signup ? ["Créons votre compte.", "Votre entreprise.", "Votre premier point de vente.", "Vérifiez votre demande."][step] : forgot ? "Retrouvez votre accès." : invite ? "Rejoignez votre équipe." : reset ? "Nouveau mot de passe." : verify ? "Confirmez votre adresse email." : "Accéder à VORTEX";
  const subtitle = signup ? ["Quelques minutes pour organiser votre activité.", "Préparez les informations de votre entreprise.", "Vous pourrez en ajouter d’autres après validation.", "Votre espace sera configuré après approbation de votre accès."][step] : forgot ? "Un lien vous sera envoyé si un compte correspond à cette adresse." : invite ? "Connectez-vous ou créez votre compte pour accepter l’invitation." : reset ? "Utilisez au moins 12 caractères. Évitez de réutiliser un ancien mot de passe." : verify ? "Ouvrez le lien reçu par email. Votre demande sera ensuite examinée par notre équipe." : "Heureux de vous revoir. Retrouvez votre activité là où vous l’avez laissée.";
  const resetInvalid = reset && !success && (invalidLink || (!auth.loading && !auth.user && !resolvingLink));
  const verified = confirmed && !invalidLink;
  const showForm = !resolvingLink && !resetInvalid && !(reset && success) && !(verify && verified);
  const label = signup ? step < 3 ? "Continuer" : "Envoyer ma demande" : forgot ? "Envoyer le lien" : reset ? "Enregistrer le mot de passe" : verify ? "Renvoyer le lien" : invite ? "Activer mon compte" : "Se connecter par e-mail";

  return <AuthShell login={login} signup={signup} forgot={forgot}>
    {signup && <ol className={styles.progress} aria-label="Étapes d’inscription">{steps.map((name, i) => <li key={name} data-complete={i <= step} aria-current={i === step ? "step" : undefined}>{name}</li>)}</ol>}
    {(forgot || reset || verify) && <span className={`${styles.heroIcon} ${verify ? styles.heroInfo : ""}`}>{forgot ? <KeyRound size={22} /> : reset ? <LockKeyhole size={22} /> : <MailCheck size={22} />}</span>}
    <div className={styles.heading}><h1 ref={heading} tabIndex={-1}>{title}</h1><p>{subtitle}</p></div>
    {invite && invitation && <div className={styles.invitation}><div><strong>{invitation.organization?.name ?? "Votre entreprise"}</strong><small>Invitation à rejoindre cette équipe</small></div>{invitation.role && <span>{roleLabels[invitation.role as Role] ?? invitation.role}</span>}</div>}
    {invite && !invitation && !error && <p role="status">Chargement de votre invitation…</p>}
    {login && googleEnabled && <><button type="button" className={`${styles.secondary} ${styles.google}`} disabled={busy || auth.loading || !!auth.user} onClick={google} aria-busy={busyAction === "google"}>{busyAction !== "google" && <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285f4" d="M44 24c0-1.4-.1-2.7-.4-4H24v8h11.3a10 10 0 0 1-4.1 5.6l6.2 4.8C41.6 34.5 44 29.6 44 24Z"/><path fill="#34a853" d="M24 44c5.4 0 10-1.8 13.4-5.6l-6.2-4.8C29.3 35.1 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9L6.2 33C9.5 39.5 16.2 44 24 44Z"/><path fill="#fbbc05" d="M12.7 28.1a12 12 0 0 1 0-8.2L6.2 15a20 20 0 0 0 0 18Z"/><path fill="#ea4335" d="M24 12c3.2 0 6.1 1.1 8.3 3.3l6-6A20 20 0 0 0 6.2 15l6.5 4.9A12 12 0 0 1 24 12Z"/></svg>}{busyAction === "google" ? <><LoaderCircle size={16} className={styles.spinner} />Redirection vers Google…</> : "Continuer avec Google"}{lastUsed === "google" && <span className={styles.lastUsed}>Dernière connexion</span>}</button><div className={styles.divider}>ou avec votre e-mail</div></>}
    {login && auth.user && <p role="status">Ouverture de votre espace…</p>}
    {resolvingLink && <p role="status">Vérification du lien…</p>}
    {resetInvalid && <AuthNotice error>Lien invalide ou expiré. Demandez un nouveau lien.</AuthNotice>}
    {verify && verified && <><AuthNotice>Adresse email confirmée. L’accès reste soumis à l’approbation de notre équipe.</AuthNotice><Link className={styles.primary} href="/access-pending">Consulter mon accès<ArrowRight size={16} /></Link></>}
    {showForm && <form key={signup ? step : path} className={styles.form} onSubmit={submit} noValidate aria-busy={busy}>
      <fieldset disabled={busy || (invite && !invitation)} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: "contents" }}>
      {signup ? <>
        {step === 0 && <>{field("name", "Votre nom", { autoComplete: "name", placeholder: "Alex Morgan" })}{field("email", "Adresse email", { type: "email", autoComplete: "email", maxLength: 254, placeholder: "vous@boutique.bj" })}{field("password", "Mot de passe", passwordOptions)}</>}
        {step === 1 && <>{field("organizationName", "Nom commercial", { autoComplete: "organization", placeholder: "Maison Mobile" })}{field("country", "Pays", { autoComplete: "country-name" })}{field("currency", "Devise", { maxLength: 3 })}{field("timezone", "Fuseau horaire")}{field("phone", "Téléphone (facultatif)", { type: "tel", autoComplete: "tel", maxLength: 40, required: false })}</>}
        {step === 2 && <>{field("storeName", "Nom du point de vente", { placeholder: "Cotonou · Principal" })}{field("city", "Ville / adresse", { autoComplete: "address-level2", placeholder: "Cotonou, Ganhi" })}</>}
        {step === 3 && <div className={styles.recap}><dl>{[["Entreprise", values.organizationName], ["Point de vente", values.storeName], ["Ville / adresse", values.city], ["Pays · devise", `${values.country} · ${values.currency}`], ["Fuseau horaire", values.timezone], ["Administrateur", `${values.name} · ${values.email}`]].map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p>Après confirmation de votre email, notre équipe examinera votre demande. La création de votre entreprise nécessite son approbation.</p></div>}
      </> : reset ? <>{field("password", "Nouveau mot de passe", passwordOptions)}{field("confirmation", "Confirmer le mot de passe", { type: "password", autoComplete: "new-password", maxLength: 128, minLength: 12 })}</> : invite && auth.user ? <><p>Connecté avec {auth.user.email}. Validez pour rejoindre cette équipe.</p><button className={styles.secondary} type="button" onClick={() => { setBusy(true); void auth.signOut().catch(e => setError(e.message)).finally(() => setBusy(false)); }}>Utiliser un autre compte</button></> : <>
        {invite && <div className={styles.field}><label htmlFor="auth-account">Votre compte</label><select id="auth-account" value={values.newAccount} onChange={e => change("newAccount", e.target.value)}><option value="yes">Créer un compte</option><option value="no">J’ai déjà un compte</option></select></div>}
        {invite && <p className={styles.help}>Utilisez l’adresse email qui a reçu l’invitation.</p>}
        {field("email", "Adresse email", { type: "email", autoComplete: "email", maxLength: 254, placeholder: "vous@boutique.bj" })}
        {!forgot && !verify && field("password", "Mot de passe", { ...passwordOptions, aside: login ? <Link href="/forgot-password">Mot de passe oublié ?</Link> : undefined })}
      </>}
      {(error || auth.error) && <AuthNotice error>{error || auth.error}</AuthNotice>}{success && <AuthNotice>{success}</AuthNotice>}
      <div className={styles.actions}>{signup && step > 0 && <button type="button" className={styles.secondary} disabled={busy} onClick={() => { setStep(s => s - 1); setError(""); setErrors({}); requestAnimationFrame(() => heading.current?.focus()); }}>Retour</button>}<button className={styles.primary} disabled={busy || auth.loading || (login && !!auth.user) || (invite && !invitation)}>{busy ? <><LoaderCircle size={16} className={styles.spinner} />Veuillez patienter…</> : <>{label}<ArrowRight size={16} /></>}</button></div>
      </fieldset>
    </form>}
    {!showForm && error && !resetInvalid && <AuthNotice error>{error}</AuthNotice>}
    {!showForm && success && <AuthNotice>{success}</AuthNotice>}
    {reset && <Link href={success ? "/login" : "/forgot-password"}>{success ? "Retour à la connexion" : "Demander un nouveau lien"}</Link>}
    {signup && <p className={styles.help}>Aucun accès immédiat n’est créé. Les informations de votre entreprise préparent sa configuration après validation.</p>}
    {verify && <Link href="/login">Retour à la connexion</Link>}
  </AuthShell>;
}
