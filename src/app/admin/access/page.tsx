"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppLogo } from "@/components/layout/app-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Alert } from "@/frontend/ui";
import { useAuth } from "@/frontend/auth-provider";
import type { AccessStatus } from "@/lib/access-policy";
type Prospect = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  date: string;
  verified: boolean;
  status: AccessStatus;
  lastActivity?: string;
};
const labels: Record<AccessStatus, string> = {
  PENDING_EMAIL: "E-mail à confirmer",
  PENDING_APPROVAL: "À examiner",
  CONTACTED: "Contacté",
  APPROVED: "Approuvé",
  REJECTED: "Refusé",
  SUSPENDED: "Suspendu",
};
export default function AdminAccess() {
  const auth = useAuth();
  const [rows, setRows] = useState<Prospect[]>([]),
    [page, setPage] = useState(1),
    [hasMore, setHasMore] = useState(false),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<Prospect | null>(null),
    [status, setStatus] = useState("CONTACTED"),
    [reason, setReason] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/access-requests?page=${page}`, {
        cache: "no-store",
      });
      const body = await r.json();
      if (!r.ok) throw Error(body.error);
      setRows(body.users);
      setHasMore(body.hasMore);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [page]);
  useEffect(() => {
    if (auth.loading || !auth.user) return;
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [auth.loading, auth.user, load]);
  const filtered = rows.filter(
    (r) =>
      (!filter || r.status === filter) &&
      `${r.name} ${r.company} ${r.email}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  return (
    <div className="access-layout admin-access">
      <header>
        <AppLogo href="/" />
        <Link href="/app/dashboard">Application</Link>
      </header>
      <main>
        <div className="vortex-page-header">
          <span>Administration VORTEX</span>
          <h1>Demandes d’accès</h1>
          <p>
            Examinez les demandes et attribuez l’accès après votre échange avec
            le prospect.
          </p>
        </div>
        {!auth.user && !auth.loading ? (
          <Link className="button primary" href="/login">
            Se connecter
          </Link>
        ) : (
          <>
            <div className="admin-filters">
              <label>
                Rechercher sur cette page
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, entreprise, e-mail"
                />
              </label>
              <label>
                Statut
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  {Object.entries(labels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <Button variant="outline" disabled={busy} onClick={load}>
                Actualiser
              </Button>
            </div>
            {error && <Alert error>{error}</Alert>}
            {notice && <Alert>{notice}</Alert>}
            {busy ? (
              <p role="status">Chargement des demandes…</p>
            ) : (
              !error && (
                <div className="admin-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Prospect</th>
                        <th>Entreprise</th>
                        <th>Demande</th>
                        <th>Statut</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.name || "Nom non renseigné"}</strong>
                            <small>{r.email}</small>
                          </td>
                          <td>{r.company || "À préciser"}</td>
                          <td>
                            {new Date(r.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td>{labels[r.status]}</td>
                          <td>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelected(r);
                                setStatus("CONTACTED");
                                setReason("");
                              }}
                            >
                              Examiner
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filtered.length && (
                    <p>
                      Aucune demande sur cette page ne correspond aux filtres.
                    </p>
                  )}
                </div>
              )
            )}
            <div className="admin-pagination">
              <Button
                variant="outline"
                disabled={page === 1 || busy}
                onClick={() => setPage(page - 1)}
              >
                Précédente
              </Button>
              <span>Page {page}</span>
              <Button
                variant="outline"
                disabled={!hasMore || busy}
                onClick={() => setPage(page + 1)}
              >
                Suivante
              </Button>
            </div>
          </>
        )}
        <Dialog
          open={!!selected}
          onOpenChange={(open) => {
            if (!open && !busy) setSelected(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Examiner la demande</DialogTitle>
              <DialogDescription>
                {selected?.name} · {selected?.email}
              </DialogDescription>
            </DialogHeader>
            <dl className="review-list">
              <div>
                <dt>Entreprise</dt>
                <dd>{selected?.company || "À préciser"}</dd>
              </div>
              <div>
                <dt>Téléphone</dt>
                <dd>{selected?.phone || "Non renseigné"}</dd>
              </div>
              <div>
                <dt>Dernière connexion</dt>
                <dd>
                  {selected?.lastActivity
                    ? new Date(selected.lastActivity).toLocaleString("fr-FR")
                    : "Aucune"}
                </dd>
              </div>
            </dl>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selected || busy) return;
                setBusy(true);
                setError("");
                try {
                  const r = await fetch("/api/admin/access-requests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: selected.id, status, reason }),
                  });
                  const body = await r.json();
                  if (!r.ok) throw Error(body.error);
                  setNotice(
                    `${body.message} ${body.notification === "queued" ? "L’e-mail d’approbation est en file d’envoi." : body.notification === "unavailable" ? "L’e-mail n’a pas pu être mis en file. Réessayez l’approbation ou prévenez le prospect via votre canal habituel." : ""}`,
                  );
                  setSelected(null);
                  await load();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Field label="Décision">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="CONTACTED">Marquer comme contacté</option>
                  <option value="APPROVED" disabled={!selected?.verified}>
                    Approuver l’accès
                  </option>
                  <option value="REJECTED">Refuser la demande</option>
                  <option value="SUSPENDED">Suspendre l’accès</option>
                </select>
              </Field>
              <Field label="Motif de la décision">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  minLength={
                    ["REJECTED", "SUSPENDED"].includes(status) ? 5 : undefined
                  }
                  required={["REJECTED", "SUSPENDED"].includes(status)}
                />
              </Field>
              <p>
                {status === "APPROVED"
                  ? "Cette décision autorisera ce compte à configurer son entreprise et à accéder au produit."
                  : "La décision sera enregistrée avec votre identifiant administrateur."}
              </p>
              {error && <Alert error>{error}</Alert>}
              <Button disabled={busy}>
                {busy ? "Enregistrement…" : "Confirmer la décision"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
