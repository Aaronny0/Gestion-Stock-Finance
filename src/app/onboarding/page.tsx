"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/frontend/auth-provider";
import { request } from "@/frontend/api";
import { businessDestination, draftKey, parseOnboarding, readOnboarding, saveOnboarding } from "@/frontend/auth-flow";
import { AuthShell } from "@/frontend/auth-shell";
import { AuthField, AuthNotice } from "@/frontend/auth-fields";
import styles from "@/frontend/auth-design.module.css";
export default function Onboarding() {
  const auth = useAuth();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({ country: "Bénin", currency: "XOF", timezone: "Africa/Porto-Novo" });
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(true), [error, setError] = useState(""), [noMembership, setNoMembership] = useState(false);
  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) { location.replace("/login"); return; }
    const draft = readOnboarding() ?? parseOnboarding(auth.user.onboarding);
    const email = auth.user.email;
    let active = true;
    void businessDestination().then(destination => {
      if (!active) return;
      if (draft?.payload && draft.payload.email === email) setValues(draft.payload);
      if (!destination.startsWith("/onboarding")) { location.replace(destination); return; }
      else { setApproved(true); setValues(v => ({...v, name: auth.user?.name ?? v.name ?? "", organizationName: auth.user?.company ?? v.organizationName ?? ""})); setNoMembership(destination.includes("no_membership")); setBusy(false); }
    }).catch(e => { if (active) { setError(e.message); setBusy(false); } });
    return () => { active = false; };
  }, [auth.loading, auth.user]);
  const fields: [string, string, boolean][] = [["name", "Votre nom", true], ["organizationName", "Entreprise", true], ["country", "Pays", false], ["currency", "Devise", false], ["timezone", "Fuseau horaire", false], ["storeName", "Boutique", false], ["city", "Ville", true]];
  const refresh = () => { setBusy(true); void businessDestination().then(destination => location.assign(destination)).catch(e => { setError(e.message); setBusy(false); }); };
  return <AuthShell>
    <span className={styles.heroIcon}><Store size={22} /></span>
    <div className={styles.heading}>
      <span className={styles.eyebrow}>{approved ? "Accès validé · Configuration" : "Configuration"}</span>
      <h1>{noMembership ? "Aucune équipe accessible" : "Créer votre espace VORTEX"}</h1>
      <p>{noMembership ? "Demandez une invitation ou la réactivation de votre accès à votre administrateur." : approved ? "Renseignez votre entreprise et votre premier point de vente. Vous pourrez les modifier ensuite." : error ? "Votre autorisation n’a pas pu être vérifiée. Réessayez." : "Vérification de votre autorisation…"}</p>
    </div>
    {approved && !noMembership && <form className={styles.form} aria-busy={busy} onSubmit={async e => {
      e.preventDefault(); if (busy || !auth.user || !approved) return; setBusy(true); setError("");
      try {
        const draft = saveOnboarding({ ...values, email: auth.user.email ?? "" });
        await request("onboarding", { method: "POST", headers: { "Idempotency-Key": draft.idempotencyKey }, body: JSON.stringify(draft.payload) });
        const destination = await businessDestination();
        if (destination !== "/app/dashboard") throw new Error("Votre espace n’est pas encore accessible. Réessayez.");
        sessionStorage.removeItem(draftKey); router.replace("/app/dashboard");
      } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
    }}>
      <div className={styles.formGrid}>
        {fields.map(([key, label, wide]) => <div key={key} className={wide ? styles.wide : undefined}><AuthField name={key} label={label} value={values[key] ?? ""} onChange={value => setValues({ ...values, [key]: value })} disabled={busy} /></div>)}
      </div>
      <button className={styles.primary} disabled={busy || auth.loading}>{busy ? <><LoaderCircle size={16} className={styles.spinner} />Création en cours…</> : "Créer mon espace"}</button>
    </form>}
    {error && <AuthNotice error>{error}</AuthNotice>}
    <div className={styles.stack}>
      <button className={styles.secondary} onClick={refresh} disabled={busy}>Actualiser mon accès</button>
      <button className={styles.secondary} onClick={() => void auth.signOut().then(() => router.replace("/login")).catch(e => setError(e.message))}>Se déconnecter</button>
      <Link className={styles.textLink} href="/demo">Explorer la démonstration</Link>
    </div>
  </AuthShell>;
}
