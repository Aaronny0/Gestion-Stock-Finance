"use client";
import { useEffect } from "react";
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch("/api/v1/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "ui_error",
        digest: error.digest ?? "unknown",
      }),
      keepalive: true,
    }).catch(() => {});
  }, [error]);
  return (
    <div className="connection-error" role="alert">
      <h1>Cette page n’a pas pu s’afficher.</h1>
      <p>Vos opérations déjà validées sont conservées.</p>
      <button className="button primary" onClick={reset}>
        Réessayer
      </button>
    </div>
  );
}
