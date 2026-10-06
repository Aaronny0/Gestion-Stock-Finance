"use client";
import { useEffect } from "react";
import { request } from "@/frontend/api";
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    request("telemetry", {
      method: "POST",
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
