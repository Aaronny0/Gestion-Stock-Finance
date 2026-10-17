"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { LoaderCircle, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/frontend/auth-provider";
import { businessDestination } from "@/frontend/auth-flow";
import { AuthShell } from "@/frontend/auth-shell";
import { AuthNotice } from "@/frontend/auth-fields";
import styles from "@/frontend/auth-design.module.css";

/**
 * Creating a workspace now happens in a blocking modal on the dashboard. This page only remains for an approved
 * account whose memberships were all removed (?state=no_membership); any other visit goes to the dashboard.
 */
export default function Onboarding() {
  const auth = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const noMembership = useSyncExternalStore(() => () => undefined, () => new URLSearchParams(location.search).get("state") === "no_membership", () => false);
  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) location.replace("/login");
    else if (!noMembership) location.replace("/app/dashboard");
  }, [auth.loading, auth.user, noMembership]);
  const refresh = () => { setBusy(true); setError(""); void businessDestination().then(destination => location.assign(destination)).catch(e => { setError(e.message); setBusy(false); }); };
  return <AuthShell>
    <span className={styles.heroIcon}><Store size={22} /></span>
    <div className={styles.heading}>
      <h1>{noMembership ? "Aucune équipe accessible" : "Ouverture de votre espace…"}</h1>
      <p>{noMembership ? "Demandez une invitation ou la réactivation de votre accès à votre administrateur." : "Redirection vers votre tableau de bord."}</p>
    </div>
    {!noMembership && <LoaderCircle className={styles.spinner} aria-label="Chargement" />}
    {error && <AuthNotice error>{error}</AuthNotice>}
    {noMembership && <div className={styles.stack}>
      <button className={styles.secondary} onClick={refresh} disabled={busy}>Actualiser mon accès</button>
      <button className={styles.secondary} onClick={() => void auth.signOut().then(() => router.replace("/login")).catch(e => setError(e.message))}>Se déconnecter</button>
      <Link className={styles.textLink} href="/demo">Explorer la démonstration</Link>
    </div>}
  </AuthShell>;
}
