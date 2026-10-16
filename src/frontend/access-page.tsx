"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock3, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { AuthShell } from "./auth-shell";
import { AuthField, AuthNotice } from "./auth-fields";
import styles from "./auth-design.module.css";
import { useAuth } from "./auth-provider";
import { request } from "./api";
import { getAuthClient } from "@/lib/auth/client";
import type { AccessDecision } from "@/lib/access-policy";
export default function AccessPage({ verify = false }: { verify?: boolean }) {
  const auth = useAuth();
  const router = useRouter();
  const [decision, setDecision] = useState<AccessDecision | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ name: "", company: "", phone: "" });
  const accountName = auth.user?.name ?? "";
  useEffect(() => { if (accountName) setForm(f => (f.name ? f : { ...f, name: accountName })); }, [accountName]);
  const [submitted, setSubmitted] = useState(false);
  const needsRequest =
    !!auth.user &&
    !verify &&
    !auth.user.accessRequest &&
    decision?.status === "PENDING_APPROVAL" &&
    !submitted;
  async function check() {
    setBusy(true);
    setError("");
    try {
      const next = await request<AccessDecision>("access");
      setDecision(next);
      if (next.status === "APPROVED" || next.destination === "/verify-email")
        location.replace(next.destination);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (auth.loading || !auth.user) return;
    let active = true;
    request<AccessDecision>("access")
      .then((next) => {
        if (!active) return;
        setDecision(next);
        if (
          next.status === "APPROVED" ||
          (verify && next.status !== "PENDING_EMAIL") ||
          (!verify && next.destination === "/verify-email")
        )
          location.replace(next.destination);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [auth.loading, auth.user, verify]);
  const restricted =
    decision?.status === "SUSPENDED" || decision?.status === "REJECTED";
  const Icon = verify ? Mail : restricted ? ShieldCheck : Clock3;
  const title = verify
    ? "Vérifiez votre adresse e-mail."
    : restricted
      ? decision?.status === "SUSPENDED"
        ? "Votre accès est suspendu."
        : "Votre demande n’a pas été retenue."
      : "Votre demande suit son cours.";
  const subtitle = verify
    ? "Ouvrez le lien reçu par e-mail pour confirmer votre identité. Votre demande sera ensuite examinée par notre équipe."
    : restricted
      ? "Rapprochez-vous de votre interlocuteur VORTEX pour connaître la suite à donner."
      : auth.user
        ? "La confirmation de votre e-mail est une étape. L’accès à VORTEX nécessite ensuite la validation de notre équipe."
        : "Connectez-vous pour consulter l’état de votre demande. Un e-mail confirmé ne donne pas automatiquement accès au produit.";
  const steps = [
    { icon: Check, label: "Compte créé", hint: "Votre identité VORTEX", state: "done" },
    { icon: Mail, label: "Confirmation e-mail", hint: "Vérifier votre adresse", state: verify ? "current" : "done" },
    { icon: Clock3, label: "Validation de votre accès", hint: "Examen par l’équipe VORTEX", state: verify ? "" : "current" },
    { icon: ArrowRight, label: "Configuration de votre entreprise", hint: "Après approbation uniquement", state: "" },
  ];
  return (
    <AuthShell>
      <span className={styles.heroIcon}><Icon size={22} /></span>
      <div className={styles.heading}>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {!restricted && (
        <ol className={styles.steps} aria-label="Étapes de votre demande">
          {steps.map(({ icon: StepIcon, label, hint, state }) => (
            <li key={label} data-state={state} aria-current={state === "current" ? "step" : undefined}>
              <StepIcon size={16} />
              <span>{label}<small>{hint}</small></span>
            </li>
          ))}
        </ol>
      )}
      {needsRequest && (
        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const { error: failure } = await getAuthClient().updateUser({
                name: form.name.trim(),
                company: form.company.trim(),
                phone: form.phone.trim(),
                accessRequest: true,
              });
              if (failure)
                throw new Error("Votre demande n’a pas pu être enregistrée. Réessayez.");
              setSubmitted(true);
              setMessage("Votre demande est enregistrée. Notre équipe va l’examiner.");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className={styles.heading}>
            <h2 className={styles.eyebrow}>Complétez votre demande</h2>
            <p>Ces informations permettent à notre équipe de vous recontacter.</p>
          </div>
          <AuthField name="name" label="Votre nom" autoComplete="name" maxLength={120} value={form.name} onChange={(name) => setForm({ ...form, name })} disabled={busy} />
          <AuthField name="company" label="Entreprise" autoComplete="organization" value={form.company} onChange={(company) => setForm({ ...form, company })} disabled={busy} />
          <AuthField name="phone" label="Téléphone (facultatif)" type="tel" autoComplete="tel" maxLength={40} required={false} value={form.phone} onChange={(phone) => setForm({ ...form, phone })} disabled={busy} />
          <button className={styles.primary} disabled={busy}>
            {busy ? <><LoaderCircle size={16} className={styles.spinner} />Enregistrement…</> : "Envoyer ma demande"}
          </button>
        </form>
      )}
      {error && <AuthNotice error>{error}</AuthNotice>}
      {message && <AuthNotice>{message}</AuthNotice>}
      {verify && !auth.user && (
        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const { error } = await getAuthClient().sendVerificationEmail({ email, callbackURL: "/access-pending" });
              if (error) throw Error("Impossible de renvoyer le lien. Patientez avant de réessayer.");
              setMessage("Si une confirmation est en attente, un nouveau lien vous a été envoyé.");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <AuthField name="email" label="Adresse e-mail" type="email" autoComplete="email" value={email} onChange={setEmail} disabled={busy} />
          <button className={styles.secondary} disabled={busy}>Renvoyer le lien</button>
        </form>
      )}
      <div className={styles.stack}>
        {auth.user ? (
          <>
            <button className={needsRequest ? styles.secondary : styles.primary} disabled={busy} onClick={check}>
              {busy ? <><LoaderCircle size={16} className={styles.spinner} />Vérification…</> : "Actualiser mon accès"}
            </button>
            <button
              className={styles.secondary}
              onClick={() =>
                void auth
                  .signOut()
                  .then(() => router.replace("/login"))
                  .catch((e) => setError(e.message))
              }
            >
              Se déconnecter
            </button>
          </>
        ) : (
          <Link className={styles.primary} href="/login">Se connecter</Link>
        )}
        <Link className={styles.textLink} href="/">Retourner sur VORTEX</Link>
      </div>
    </AuthShell>
  );
}
