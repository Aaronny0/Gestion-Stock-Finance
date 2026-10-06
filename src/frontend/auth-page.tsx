"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  BarChart2,
  Package,
  Shield,
} from "lucide-react";
import { api, ApiError } from "./api";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  signupSchema,
  loginSchema,
  emailSchema,
  resetSchema,
  tokenSchema,
} from "./auth.schemas";
import { useUnsavedChanges } from "./provider";
import { Alert, Field } from "./ui";
export default function AuthPage() {
  const path = usePathname(),
    signup = path === "/signup",
    forgot = path === "/forgot-password",
    invite = path === "/invite/activate",
    verify = path === "/verify-email",
    resetPassword = path === "/reset-password";
  const schema = signup
    ? signupSchema
    : forgot
      ? emailSchema
      : invite || resetPassword
        ? resetSchema
        : verify
          ? tokenSchema
          : loginSchema;
  const defaults: Record<string, string> = signup
    ? {
        name: "",
        email: "",
        password: "",
        organizationName: "",
        country: "Bénin",
        currency: "XOF",
        timezone: "Africa/Porto-Novo",
        storeName: "",
        city: "",
      }
    : verify
      ? { token: "" }
      : invite || resetPassword
        ? { token: "", password: "" }
        : forgot
          ? { email: "" }
          : { email: "", password: "" };
  const form = useForm<Record<string, string>>({
    resolver: zodResolver(schema) as unknown as Resolver<
      Record<string, string>
    >,
    defaultValues: defaults,
  });
  const {
    register,
    handleSubmit,
    trigger,
    watch,
    reset,
    setError: setFieldError,
    formState: { errors, isDirty },
  } = form;
  const values = watch();
  const [step, setStep] = useState(0),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [invitation, setInvitation] = useState<{
      organization?: string;
      role?: string;
    } | null>(null);
  useUnsavedChanges(isDirty && !success, "Formulaire de connexion");
  useEffect(() => {
    setStep(0);
    setError("");
    setSuccess("");
    setInvitation(null);
    const token = new URLSearchParams(location.search).get("token") ?? "";
    reset(
      invite || verify || resetPassword
        ? { token, ...(verify ? {} : { password: "" }) }
        : signup
          ? {
              name: "",
              email: "",
              password: "",
              organizationName: "",
              country: "Bénin",
              currency: "XOF",
              timezone: "Africa/Porto-Novo",
              storeName: "",
              city: "",
            }
          : forgot
            ? { email: "" }
            : { email: "", password: "" },
    );
    if ((verify || resetPassword) && !token)
      setError("Lien incomplet. Demandez un nouvel email.");
    if (invite) {
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
  }, [invite, verify, resetPassword, signup, forgot, reset]);
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
        : verify
          ? "Confirmez votre adresse email."
          : resetPassword
            ? "Choisissez un nouveau mot de passe."
            : "Heureux de vous retrouver.";
  const input = (
    key: string,
    label: string,
    type = "text",
    required = true,
  ) => (
    <Field label={label} required={required} error={errors[key]?.message}>
      <input
        {...register(key)}
        type={type}
        required={required}
        autoComplete={
          key === "email"
            ? "email"
            : key === "password"
              ? signup || invite || resetPassword
                ? "new-password"
                : "current-password"
              : key === "name"
                ? "name"
                : undefined
        }
        aria-invalid={Boolean(errors[key])}
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
              <Package />
              Votre stock, maîtrisé.
            </span>
            <span>
              <BarChart2 />
              Vos chiffres, enfin clairs.
            </span>
            <span>
              <Shield />
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
                  : verify
                    ? "Cette confirmation protège l’accès à votre compte."
                    : resetPassword
                      ? "Utilisez au moins 12 caractères pour votre nouveau mot de passe."
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
            noValidate
            onChange={() => {
              if (success) setSuccess("");
            }}
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              if (signup && step < 3) {
                const fields = [
                  ["name", "email", "password"],
                  ["organizationName", "country", "currency", "timezone"],
                  ["storeName", "city"],
                ][step];
                if (await trigger(fields, { shouldFocus: true }))
                  setStep(step + 1);
                return;
              }
              if (busy) return;
              await handleSubmit(async (data) => {
                setBusy(true);
                try {
                  if (forgot) {
                    await api.auth("forgot-password", { email: data.email });
                    setSuccess(
                      "Si ce compte existe, un lien de réinitialisation a été envoyé.",
                    );
                  } else if (signup) {
                    const result = await api.auth("signup", data);
                    setSuccess(
                      result.message ??
                        "Compte créé. Consultez votre email pour confirmer votre inscription.",
                    );
                  } else if (invite) {
                    await api.auth("activate", {
                      token: data.token,
                      password: data.password,
                    });
                    reset(data);
                    setSuccess("Compte activé. Vous pouvez vous connecter.");
                    window.setTimeout(() => location.assign("/login"), 0);
                  } else if (verify) {
                    await api.auth("verify-email", { token: data.token });
                    setSuccess(
                      "Adresse email confirmée. Vous pouvez vous connecter.",
                    );
                  } else if (resetPassword) {
                    await api.auth("reset-password", data);
                    setSuccess(
                      "Mot de passe modifié. Vous pouvez vous connecter.",
                    );
                  } else {
                    await api.auth("login", {
                      email: data.email,
                      password: data.password,
                    });
                    reset(data);
                    setSuccess("Connexion réussie.");
                    window.setTimeout(() => location.assign("/account"), 0);
                  }
                  reset(data);
                } catch (e) {
                  if (e instanceof ApiError)
                    for (const [field, message] of Object.entries(e.fields))
                      setFieldError(field, { type: "server", message });
                  setError(
                    e instanceof ApiError &&
                      e.status === 403 &&
                      !signup &&
                      !forgot &&
                      !invite &&
                      !verify &&
                      !resetPassword
                      ? "Vérifiez votre adresse email avant de vous connecter. Vous pouvez demander un nouvel email ci-dessous."
                      : (e as Error).message,
                  );
                } finally {
                  setBusy(false);
                }
              })(e);
            }}
          >
            {signup ? (
              step === 0 ? (
                <>
                  {input("name", "Votre nom")}
                  {input("email", "Adresse email", "email")}
                  {input(
                    "password",
                    "Mot de passe (12 caractères minimum)",
                    "password",
                  )}
                </>
              ) : step === 1 ? (
                <>
                  {input("organizationName", "Nom commercial")}
                  {input("country", "Pays")}
                  <div className="form-grid">
                    <Field label="Devise" error={errors.currency?.message}>
                      <select {...register("currency")}>
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
                  {input("city", "Ville / adresse")}
                </>
              ) : (
                <>
                  <div className="onboarding-review">
                    <Check />
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
            ) : verify ? (
              <p>
                Confirmez votre adresse en cliquant sur le bouton ci-dessous. Ce
                lien ne peut être utilisé qu’une fois.
              </p>
            ) : invite || resetPassword ? (
              input(
                "password",
                "Définir votre mot de passe (12 caractères minimum)",
                "password",
              )
            ) : (
              <>
                {input("email", "Adresse email", "email")}
                <Field label="Mot de passe" error={errors.password?.message}>
                  <div className="password-field">
                    <input
                      required
                      type={visible ? "text" : "password"}
                      autoComplete="current-password"
                      {...register("password")}
                      aria-invalid={Boolean(errors.password)}
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
                      {visible ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </Field>
                <div className="auth-form-link">
                  <Link href="/forgot-password">Mot de passe oublié ?</Link>
                </div>
              </>
            )}
            {errors.token && <Alert error>{errors.token.message}</Alert>}
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
                disabled={
                  busy ||
                  (Boolean(success) && path !== "/login") ||
                  (!verify && !isDirty) ||
                  ((invite || verify || resetPassword) && !values.token) ||
                  (invite && !invitation)
                }
              >
                {busy
                  ? "Veuillez patienter…"
                  : signup
                    ? step < 3
                      ? "Continuer"
                      : "Créer mon espace"
                    : forgot
                      ? "Envoyer le lien"
                      : verify
                        ? "Confirmer mon email"
                        : resetPassword
                          ? "Enregistrer mon mot de passe"
                          : invite
                            ? "Activer mon compte"
                            : "Se connecter"}
                <ArrowRight />
              </button>
            </div>
          </form>
          {path === "/login" && (
            <button
              type="button"
              className="button secondary full"
              disabled={busy || !values.email}
              onClick={async () => {
                if (!(await trigger("email", { shouldFocus: true }))) return;
                setBusy(true);
                setError("");
                try {
                  await api.auth("resend-verification", {
                    email: values.email,
                  });
                  setSuccess(
                    "Si votre compte le permet, un nouvel email de vérification vous sera envoyé.",
                  );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Renvoyer l’email de vérification
            </button>
          )}
          {path === "/login" ? (
            <>
              <p className="auth-signup">
                Vous démarrez votre activité ?{" "}
                <Link href="/signup">Créer mon espace</Link>
              </p>
              <div className="auth-demo">
                <span>Découvrez Vortex avant de commencer</span>
                <Link href="/demo">
                  Explorer la démonstration <ArrowRight />
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
