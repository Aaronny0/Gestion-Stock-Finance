"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock3, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { AppLogo } from "@/components/layout/app-logo";
import { useAuth } from "./auth-provider";
import { request } from "./api";
import { getSupabase } from "@/lib/supabase/client";
import type { AccessDecision } from "@/lib/access-policy";
export default function AccessPage({ verify = false }: { verify?: boolean }) {
  const auth = useAuth();
  const router = useRouter();
  const [decision, setDecision] = useState<AccessDecision | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const needsRequest =
    !!auth.user &&
    !verify &&
    !auth.user.user_metadata.vortex_access_request &&
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
  return (
    <div className="access-layout">
      <header>
        <AppLogo href="/" />
        <Link href="/demo">Explorer la démo</Link>
      </header>
      <main className="access-content">
        <span className="access-symbol">
          {verify ? <Mail /> : restricted ? <ShieldCheck /> : <Clock3 />}
        </span>
        <h1>
          {verify
            ? "Vérifiez votre adresse e-mail."
            : restricted
              ? decision.status === "SUSPENDED"
                ? "Votre accès est suspendu."
                : "Votre demande n’a pas été retenue."
              : "Votre demande suit son cours."}
        </h1>
        <p>
          {verify
            ? "Ouvrez le lien reçu par e-mail pour confirmer votre identité. Votre demande sera ensuite examinée par notre équipe."
            : restricted
              ? "Rapprochez-vous de votre interlocuteur VORTEX pour connaître la suite à donner."
              : auth.user
                ? "La confirmation de votre e-mail est une étape. L’accès à VORTEX nécessite ensuite la validation de notre équipe."
                : "Connectez-vous pour consulter l’état de votre demande. Un e-mail confirmé ne donne pas automatiquement accès au produit."}
        </p>
        {!restricted && (
          <ol className="access-timeline">
            <li className="done">
              <Check />
              <span>
                Compte créé<small>Votre identité VORTEX</small>
              </span>
            </li>
            <li className={verify ? "current" : "done"}>
              <Mail />
              <span>
                Confirmation e-mail<small>Vérifier votre adresse</small>
              </span>
            </li>
            <li className={!verify ? "current" : ""}>
              <Clock3 />
              <span>
                Validation de votre accès
                <small>Examen par l’équipe VORTEX</small>
              </span>
            </li>
            <li>
              <ArrowRight />
              <span>
                Configuration de votre entreprise
                <small>Après approbation uniquement</small>
              </span>
            </li>
          </ol>
        )}
        {needsRequest && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fields = new FormData(e.currentTarget);
              setBusy(true);
              setError("");
              try {
                const { error: failure } = await getSupabase().auth.updateUser({
                  data: {
                    name: String(fields.get("name")).trim(),
                    company: String(fields.get("company")).trim(),
                    phone: String(fields.get("phone")).trim(),
                    vortex_access_request: true,
                  },
                });
                if (failure)
                  throw new Error(
                    "Votre demande n’a pas pu être enregistrée. Réessayez.",
                  );
                setSubmitted(true);
                setMessage(
                  "Votre demande est enregistrée. Notre équipe va l’examiner.",
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <h2>Complétez votre demande</h2>
            <p>
              Ces informations permettent à notre équipe de vous recontacter.
            </p>
            <label>
              Votre nom
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={120}
                defaultValue={auth.user?.user_metadata.full_name ?? ""}
              />
            </label>
            <label>
              Entreprise
              <input
                name="company"
                autoComplete="organization"
                required
                maxLength={160}
              />
            </label>
            <label>
              Téléphone (facultatif)
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={40}
              />
            </label>
            <button className="button primary" disabled={busy}>
              {busy ? "Enregistrement…" : "Envoyer ma demande"}
            </button>
          </form>
        )}
        {error && (
          <p role="alert" className="access-error">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        {verify && !auth.user && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const { error } = await getSupabase().auth.resend({
                  type: "signup",
                  email,
                  options: {
                    emailRedirectTo: `${location.origin}/auth/callback?next=/access-pending`,
                  },
                });
                if (error)
                  throw Error(
                    "Impossible de renvoyer le lien. Patientez avant de réessayer.",
                  );
                setMessage(
                  "Si une confirmation est en attente, un nouveau lien vous a été envoyé.",
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Adresse e-mail
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button className="button secondary" disabled={busy}>
              Renvoyer le lien
            </button>
          </form>
        )}
        <div className="access-actions">
          {auth.user ? (
            <>
              <button
                className="button primary"
                disabled={busy}
                onClick={check}
              >
                {busy ? "Vérification…" : "Actualiser mon accès"}
              </button>
              <button
                className="button secondary"
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
            <Link className="button primary" href="/login">
              Se connecter
            </Link>
          )}
          <Link href="/">Retourner sur VORTEX</Link>
        </div>
      </main>
    </div>
  );
}
