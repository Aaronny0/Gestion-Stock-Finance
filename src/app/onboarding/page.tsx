"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/frontend/auth-provider";
import { request } from "@/frontend/api";
import { businessDestination, draftKey, readOnboarding, saveOnboarding } from "@/frontend/auth-flow";
import { Alert, Field } from "@/frontend/ui";
export default function Onboarding() {
  const auth = useAuth();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({ country: "Bénin", currency: "XOF", timezone: "Africa/Porto-Novo" });
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(true), [error, setError] = useState(""), [noMembership, setNoMembership] = useState(false);
  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) { location.replace("/login"); return; }
    const draft = readOnboarding() ?? auth.user.user_metadata.vortex_onboarding;
    const email = auth.user.email;
    let active = true;
    void businessDestination().then(destination => {
      if (!active) return;
      if (draft?.payload && draft.payload.email === email) setValues(draft.payload);
      if (!destination.startsWith("/onboarding")) { location.replace(destination); return; }
      else { setApproved(true); setValues(v => ({...v, name: auth.user?.user_metadata.name ?? v.name ?? "", organizationName: auth.user?.user_metadata.company ?? v.organizationName ?? ""})); setNoMembership(destination.includes("no_membership")); setBusy(false); }
    }).catch(e => { if (active) { setError(e.message); setBusy(false); } });
    return () => { active = false; };
  }, [auth.loading, auth.user]);
  return <main className="access-layout onboarding-layout"><div className="access-content"><Link href="/" className="onboarding-brand">VORTEX</Link><span className="onboarding-step">{approved ? "Accès validé · Configuration de votre entreprise" : "Configuration de votre entreprise"}</span><h1>{noMembership ? "Aucune équipe accessible" : "Créer votre espace VORTEX"}</h1>
    {!approved ? <p role="status">{error ? "Votre autorisation n’a pas pu être vérifiée. Réessayez." : "Vérification de votre autorisation…"}</p> : noMembership ? <p>Demandez une invitation ou la réactivation de votre accès à votre administrateur.</p> : <form className="onboarding-form" onSubmit={async e => {
      e.preventDefault(); if (busy || !auth.user || !approved) return; setBusy(true); setError("");
      try {
        const draft = saveOnboarding({ ...values, email: auth.user.email ?? "" });
        await request("onboarding", { method: "POST", headers: { "Idempotency-Key": draft.idempotencyKey }, body: JSON.stringify(draft.payload) });
        const destination = await businessDestination();
        if (destination !== "/app/dashboard") throw new Error("Votre espace n’est pas encore accessible. Réessayez.");
        sessionStorage.removeItem(draftKey); router.replace("/app/dashboard");
      } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
    }}>{[["name", "Votre nom"], ["organizationName", "Entreprise"], ["country", "Pays"], ["currency", "Devise"], ["timezone", "Fuseau horaire"], ["storeName", "Boutique"], ["city", "Ville"]].map(([key, label]) => <Field key={key} label={label}><input required value={values[key] ?? ""} onChange={e => setValues({ ...values, [key]: e.target.value })} /></Field>)}<button className="button primary" disabled={busy || auth.loading}>Créer mon espace</button></form>}
    {error && <Alert error>{error}</Alert>}
    <button className="button secondary" onClick={() => { setBusy(true); void businessDestination().then(destination => location.assign(destination)).catch(e => { setError(e.message); setBusy(false); }); }} disabled={busy}>Actualiser mon accès</button>
    <button className="button secondary" onClick={() => void auth.signOut().then(() => router.replace("/login")).catch(e => setError(e.message))}>Se déconnecter</button><Link href="/demo">Explorer la démonstration</Link>
  </div></main>;
}
