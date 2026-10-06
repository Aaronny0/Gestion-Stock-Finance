"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, request } from "@/frontend/api";
import { Alert } from "@/frontend/ui";
import type { UserSession } from "@/frontend/types";

export default function AccountPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    request<UserSession>("session", { signal: abort.signal })
      .then(setSession)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => abort.abort();
  }, []);
  return (
    <main className="auth-main">
      <div className="auth-form">
        <span className="eyebrow">VOTRE COMPTE VORTEX</span>
        <h1>
          {session ? `Bienvenue, ${session.user.name}.` : "Votre session"}
        </h1>
        {!session && !error && <p role="status">Chargement de votre compte…</p>}
        {error && <Alert error>{error}</Alert>}
        {session && (
          <>
            <p>
              Vous êtes connecté à <strong>{session.organization.name}</strong>.
            </p>
            <h2>Vos boutiques</h2>
            <ul>
              {session.stores.map((store) => (
                <li key={store.id}>
                  {store.name}
                  {store.city ? ` · ${store.city}` : ""}
                </li>
              ))}
            </ul>
            <p>
              L’authentification est disponible. Les fonctionnalités de gestion
              sont en cours de raccordement.
            </p>
            <button
              className="button secondary full"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await api.auth("logout", {});
                  location.assign("/login");
                } catch (e) {
                  setError((e as Error).message);
                  setBusy(false);
                }
              }}
            >
              {busy ? "Déconnexion…" : "Se déconnecter"}
            </button>
          </>
        )}
        <p>
          <Link href="/demo">Explorer la démonstration</Link>
        </p>
        {!session && <Link href="/login">Retour à la connexion</Link>}
      </div>
    </main>
  );
}
