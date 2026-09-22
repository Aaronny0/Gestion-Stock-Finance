"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiArrowRight,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiBarChart2,
  FiPackage,
  FiShield,
} from "react-icons/fi";
import { api } from "./api";
import { Alert, Field } from "./ui";
export default function AuthPage() {
  const path = usePathname(),
    signup = path === "/signup",
    forgot = path === "/forgot-password",
    invite = path === "/invite/activate";
  const [step, setStep] = useState(0),
    [values, setValues] = useState<Record<string, string>>({
      country: "Bénin",
      currency: "XOF",
      timezone: "Africa/Porto-Novo",
    }),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [invitation, setInvitation] = useState<{
      organization?: string;
      role?: string;
    } | null>(null);
  const change = (key: string, value: string) =>
    setValues({ ...values, [key]: value });
  useEffect(() => {
    if (invite) {
      const token = new URLSearchParams(location.search).get("token");
      if (!token) {
        setError(
          "Lien d’invitation incomplet. Demandez un nouveau lien au propriétaire.",
        );
        return;
      }
      api
        .auth("invitation", { token })
        .then(setInvitation)
        .catch(() =>
          setError(
            "Invitation indisponible ou expirée. Demandez un nouveau lien au propriétaire.",
          ),
        );
    }
  }, [invite]);
  const title = signup
    ? [
        "Créons votre compte.",
        "Bienvenue dans votre entreprise.",
        "Votre premier point de vente.",
        "Tout est prêt pour démarrer.",
      ][step]
    : forgot
      ? "Retrouvez votre accès."
      : invite
        ? "Rejoignez votre équipe."
        : "Heureux de vous retrouver.";
  const input = (
    key: string,
    label: string,
    type = "text",
    required = true,
  ) => (
    <Field label={label} required={required}>
      <input
        name={key}
        type={type}
        required={required}
        autoComplete={
          key === "email"
            ? "email"
            : key === "password"
              ? signup || invite
                ? "new-password"
                : "current-password"
              : key === "name"
                ? "name"
                : undefined
        }
        minLength={key === "password" && (signup || invite) ? 10 : undefined}
        value={values[key] ?? ""}
        onChange={(e) => change(key, e.target.value)}
      />
    </Field>
  );
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <Link href="/login" className="brand">
          <span className="brand-mark">
            v<span>↗</span>
          </span>
          <span>
            vortex<span className="brand-sub">STOCK & FINANCE</span>
          </span>
        </Link>
        <div>
          <span className="eyebrow">L’ESPRIT LIBRE POUR ENTREPRENDRE</span>
          <h1>
            Votre commerce.
            <br />
            Vos ambitions.
            <br />
            <em>
              Une longueur
              <br />
              d’avance.
            </em>
          </h1>
          <p>
            Du premier article vendu à la vision d’ensemble, retrouvez toute
            votre activité au même endroit.
          </p>
          <div className="auth-features">
            <span>
              <FiPackage />
              Votre stock, maîtrisé.
            </span>
            <span>
              <FiBarChart2 />
              Vos chiffres, enfin clairs.
            </span>
            <span>
              <FiShield />
              Votre équipe, bien entourée.
            </span>
          </div>
        </div>
        <small>Gestion Stock & Finance · Vortex</small>
      </aside>
      <main className="auth-main">
        <div className="auth-form">
          <div className="auth-mobile-brand">vortex ↗</div>
          <span className="eyebrow">
            {signup
              ? "COMMENÇONS ENSEMBLE"
              : invite
                ? "INVITATION"
                : "VOTRE ESPACE PROFESSIONNEL"}
          </span>
          <h2>{title}</h2>
          <p>
            {signup
              ? "Quelques étapes pour organiser votre activité."
              : forgot
                ? "Un lien vous sera envoyé si un compte correspond à cet email."
                : invite
                  ? `${invitation?.organization ?? "Votre entreprise"} · ${invitation?.role ?? "Invitation sécurisée"}`
                  : "Connectez-vous pour retrouver votre activité."}
          </p>
          {signup && (
            <div className="steps">
              {["Compte", "Entreprise", "Boutique", "Prêt"].map((label, i) => (
                <span key={label} className={step === i ? "active" : ""}>
                  {i + 1}. {label}
                </span>
              ))}
            </div>
          )}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              if (signup && step < 3) {
                setStep(step + 1);
                return;
              }
              if (busy) return;
              setBusy(true);
              try {
                if (forgot) {
                  await api.auth("forgot-password", { email: values.email });
                  setSuccess(
                    "Si ce compte existe, un lien de réinitialisation a été envoyé.",
                  );
                } else if (signup) {
                  const result = await api.auth("signup", values);
                  setSuccess(
                    result.message ??
                      "Compte créé. Consultez votre email pour confirmer votre inscription.",
                  );
                } else if (invite) {
                  await api.auth("activate", {
                    token: new URLSearchParams(location.search).get("token"),
                    password: values.password,
                  });
                  location.assign("/");
                } else {
                  await api.auth("login", {
                    email: values.email,
                    password: values.password,
                  });
                  location.assign("/");
                }
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {signup ? (
              step === 0 ? (
                <>
                  {input("name", "Votre nom")}
                  {input("email", "Adresse email", "email")}
                  {input(
                    "password",
                    "Mot de passe (10 caractères minimum)",
                    "password",
                  )}
                </>
              ) : step === 1 ? (
                <>
                  {input("organizationName", "Nom commercial")}
                  {input("country", "Pays")}
                  <div className="form-grid">
                    <Field label="Devise">
                      <select
                        value={values.currency}
                        onChange={(e) => change("currency", e.target.value)}
                      >
                        {["XOF", "XAF", "EUR", "USD", "GNF"].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </Field>
                    {input("timezone", "Fuseau horaire")}
                  </div>
                </>
              ) : step === 2 ? (
                <>
                  {input("storeName", "Nom du point de vente")}
                  {input("city", "Ville / adresse", "text", false)}
                </>
              ) : (
                <>
                  <div className="onboarding-review">
                    <FiCheck />
                    <strong>{values.organizationName}</strong>
                    <span>
                      {values.storeName} · {values.country} · {values.currency}
                    </span>
                    <p>Commerce de téléphones et électronique</p>
                  </div>
                  <p>
                    Après activation : ajoutez votre stock, invitez votre équipe
                    et réalisez votre première vente.
                  </p>
                </>
              )
            ) : forgot ? (
              input("email", "Adresse email", "email")
            ) : invite ? (
              input(
                "password",
                "Définir votre mot de passe (10 caractères minimum)",
                "password",
              )
            ) : (
              <>
                {input("email", "Adresse email", "email")}
                <Field label="Mot de passe">
                  <div className="password-field">
                    <input
                      required
                      type={visible ? "text" : "password"}
                      autoComplete="current-password"
                      value={values.password ?? ""}
                      onChange={(e) => change("password", e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label={
                        visible
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      onClick={() => setVisible(!visible)}
                    >
                      {visible ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </Field>
                <div className="auth-form-link">
                  <Link href="/forgot-password">Mot de passe oublié ?</Link>
                </div>
              </>
            )}
            {error && <Alert error>{error}</Alert>}
            {success && <Alert>{success}</Alert>}
            <div className="auth-buttons">
              {signup && step > 0 && (
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() => setStep(step - 1)}
                >
                  Retour
                </button>
              )}
              <button
                className="button primary full"
                disabled={busy || (invite && !invitation)}
              >
                {busy
                  ? "Veuillez patienter…"
                  : signup
                    ? step < 3
                      ? "Continuer"
                      : "Créer mon espace"
                    : forgot
                      ? "Envoyer le lien"
                      : invite
                        ? "Activer mon compte"
                        : "Se connecter"}
                <FiArrowRight />
              </button>
            </div>
          </form>
          {path === "/login" ? (
            <>
              <p className="auth-signup">
                Vous démarrez votre activité ?{" "}
                <Link href="/signup">Créer mon espace</Link>
              </p>
              <div className="auth-demo">
                <span>Découvrez Vortex avant de commencer</span>
                <Link href="/demo">
                  Explorer la démonstration <FiArrowRight />
                </Link>
              </div>
            </>
          ) : (
            <p className="auth-signup">
              <Link href="/login">Retour à la connexion</Link>
            </p>
          )}
          <small className="auth-footer">
            Votre entreprise. Vos données. Votre tranquillité.
          </small>
        </div>
      </main>
    </div>
  );
}
