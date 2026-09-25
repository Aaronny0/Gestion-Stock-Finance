"use client";
import { salePosition } from "./operations";
import { useState, useRef } from "react";
import Link from "next/link";
import { Plus, Trash2, CheckCircle, ArrowRight, Lock } from "lucide-react";
import {
  balance,
  decimals,
  ledger,
  minor,
  trialBalance,
  validateEntry,
} from "./accounting";
import { useWorkspace, useUnsavedChanges, useViewState } from "./provider";
import { ActionForm } from "./forms";
import {
  Alert,
  Badge,
  ConfirmDialog,
  DataTable,
  DateRangePicker,
  Field,
  Modal,
  Money,
  PageHeading,
} from "./ui";
import type { AccountingEntry, AccountingLine } from "./types";
export function EntryDetail({
  entry,
  onClose,
}: {
  entry: AccountingEntry;
  onClose: () => void;
}) {
  const { href, can, command } = useWorkspace();
  const [action, setAction] = useState("");
  const [postingError, setPostingError] = useState("");
  if (action === "edit")
    return <EntryEditor initial={entry} onClose={onClose} />;
  return (
    <Modal title={entry.reference} onClose={onClose}>
      <div className="modal-body">
        <p>{entry.label}</p>
        <div className="context-note">
          {entry.journal} · {entry.date} <Badge value={entry.status} />
        </div>
        <DataTable
          name="écriture"
          rows={entry.lines.map((l, i) => ({ ...l, id: String(i) }))}
          columns={[
            { key: "account", label: "Compte" },
            { key: "label", label: "Libellé" },
            {
              key: "debit",
              label: "Débit",
              render: (l) => <Money value={l.debit} />,
            },
            {
              key: "credit",
              label: "Crédit",
              render: (l) => <Money value={l.credit} />,
            },
          ]}
        />
        {entry.sourceId && entry.sourceType && (
          <Link
            className="text-button"
            href={
              href(
                "/" +
                  ({
                    entries: "accounting",
                    trades: "trade",
                    buybacks: "buyback",
                  }[entry.sourceType] ?? entry.sourceType),
              ) +
              "/" +
              entry.sourceId
            }
          >
            Voir la transaction source <ArrowRight />
          </Link>
        )}
        {postingError && <Alert error>{postingError}</Alert>}
        {action === "reverse" && (
          <ActionForm
            type="entry.reverse"
            title="Extourner l’écriture"
            initial={{ id: entry.id }}
            onClose={() => {
              setAction("");
              onClose();
            }}
          />
        )}
      </div>
      <div className="modal-foot">
        {can("accounting.post") && entry.status === "posted" && (
          <button
            className="button secondary"
            onClick={() => setAction("reverse")}
          >
            Extourner
          </button>
        )}
        {can("accounting.post") && entry.status === "draft" && (
          <button
            className="button secondary"
            onClick={() => setAction("edit")}
          >
            Modifier le brouillon
          </button>
        )}
        {can("accounting.post") && entry.status === "draft" && (
          <button
            className="button primary"
            onClick={async () => {
              try {
                await command("entry.post", { id: entry.id });
                onClose();
              } catch (e) {
                setAction("");
                setPostingError((e as Error).message);
              }
            }}
          >
            Poster définitivement
          </button>
        )}
        <button className="button secondary" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Modal>
  );
}
function EntryEditor({
  onClose,
  initial,
}: {
  onClose: () => void;
  initial?: AccountingEntry;
}) {
  const { snapshot, command } = useWorkspace();
  const [date, setDate] = useState(
      initial?.date ?? new Date().toISOString().slice(0, 10),
    ),
    [journal, setJournal] = useState(initial?.journal ?? "Opérations diverses"),
    [label, setLabel] = useState(initial?.label ?? ""),
    [lines, setLines] = useState<AccountingLine[]>(
      initial?.lines ?? [
        { account: "571", label: "", debit: 0, credit: 0 },
        { account: "701", label: "", debit: 0, credit: 0 },
      ],
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const signature = JSON.stringify({ date, journal, label, lines });
  const original = useRef(signature);
  const discard = useUnsavedChanges(
    signature !== original.current,
    "Écriture comptable",
  );
  const close = () => {
    if (!busy && discard()) onClose();
  };
  const result = balance(lines),
    currency = snapshot!.session.organization.currency;
  const change = (
    i: number,
    key: keyof AccountingLine,
    value: string | number,
  ) =>
    setLines(
      lines.map((l, j) =>
        i === j
          ? {
              ...l,
              [key]: value,
              ...(key === "debit" && Number(value) > 0 ? { credit: 0 } : {}),
              ...(key === "credit" && Number(value) > 0 ? { debit: 0 } : {}),
            }
          : l,
      ),
    );
  return (
    <Modal
      title="Saisir une écriture comptable"
      onClose={() => {
        close();
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setError("");
          try {
            validateEntry(
              { date, lines },
              snapshot!.data.accounts,
              snapshot!.data.periods,
            );
            setBusy(true);
            await command("entry.save", {
              date,
              journal,
              label,
              lines,
              id: initial?.id,
            });
            onClose();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-body">
          <div className="form-grid">
            <Field label="Journal">
              <select
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
              >
                {[
                  "Ventes",
                  "Achats",
                  "Caisse",
                  "Banque",
                  "Opérations diverses",
                ].map((j) => (
                  <option key={j}>{j}</option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Libellé de l’écriture" required>
            <input
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </Field>
          <div className="entry-lines">
            {lines.map((l, i) => (
              <fieldset key={i}>
                <legend>Ligne {i + 1}</legend>
                <div className="form-grid">
                  <Field label="Compte">
                    <select
                      aria-label={`Compte ligne ${i + 1}`}
                      value={l.account}
                      onChange={(e) => change(i, "account", e.target.value)}
                    >
                      {snapshot!.data.accounts
                        .filter((a) => a.active)
                        .map((a) => (
                          <option key={a.id} value={a.number}>
                            {a.number} · {a.name}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="Libellé">
                    <input
                      value={l.label}
                      onChange={(e) => change(i, "label", e.target.value)}
                    />
                  </Field>
                  <Field label={`Débit (${currency})`}>
                    <input
                      aria-label={`Débit ligne ${i + 1}`}
                      type="number"
                      min="0"
                      step={1 / 10 ** decimals(currency)}
                      value={l.debit / 10 ** decimals(currency)}
                      onChange={(e) =>
                        change(i, "debit", minor(e.target.value, currency))
                      }
                    />
                  </Field>
                  <Field label={`Crédit (${currency})`}>
                    <input
                      aria-label={`Crédit ligne ${i + 1}`}
                      type="number"
                      min="0"
                      step={1 / 10 ** decimals(currency)}
                      value={l.credit / 10 ** decimals(currency)}
                      onChange={(e) =>
                        change(i, "credit", minor(e.target.value, currency))
                      }
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  className="text-button danger"
                  disabled={lines.length <= 2}
                  onClick={() => setLines(lines.filter((_, j) => i !== j))}
                >
                  <Trash2 />
                  Retirer cette ligne
                </button>
              </fieldset>
            ))}
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              setLines([
                ...lines,
                {
                  account: snapshot!.data.accounts[0].number,
                  label: "",
                  debit: 0,
                  credit: 0,
                },
              ])
            }
          >
            <Plus />
            Ajouter une ligne
          </button>
          <div className="impact-summary">
            <span>
              Total débit
              <strong>
                <Money value={result.debit} />
              </strong>
            </span>
            <span>
              Total crédit
              <strong>
                <Money value={result.credit} />
              </strong>
            </span>
            <span>
              Écart
              <strong>
                <Money value={result.difference} />
              </strong>
            </span>
          </div>
          <Alert error={!result.balanced}>
            {result.balanced
              ? "L’écriture est équilibrée."
              : "Le total débit doit être égal au total crédit."}
          </Alert>
          {error && <Alert error>{error}</Alert>}
        </div>
        <div className="modal-foot">
          <button
            type="button"
            className="button secondary"
            onClick={close}
            disabled={busy}
          >
            Annuler
          </button>
          <button
            className="button primary"
            disabled={busy || !result.balanced}
          >
            {busy ? "Enregistrement…" : "Enregistrer le brouillon"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function AccountingPage({ path }: { path: string }) {
  const { snapshot, storeId, start, end, href, can, command } = useWorkspace();
  const db = snapshot!.data;
  const tab = path.split("/")[2] || "journals";
  const [account, setAccount] = useViewState("account", ""),
    [journal, setJournal] = useViewState("journal", ""),
    [editor, setEditor] = useState(false),
    [selected, setSelected] = useState<AccountingEntry | null>(null),
    [action, setAction] = useState(""),
    [confirm, setConfirm] = useState<{ type: string; id: string } | null>(null);
  const entries = db.entries.filter(
    (e) =>
      (storeId === "all" || e.storeId === storeId) &&
      (!journal || e.journal === journal),
  );
  const inPeriod = entries.filter(
    (e) => e.date.slice(0, 10) >= start && e.date.slice(0, 10) <= end,
  );
  const trial = trialBalance(entries, db.accounts, start, end),
    rows = ledger(entries, account, start, end);
  const totals = trial.reduce(
    (a, l) => ({ debit: a.debit + l.debit, credit: a.credit + l.credit }),
    { debit: 0, credit: 0 },
  );
  const statements = trial.reduce(
    (a, l) => {
      a[l.type] =
        (a[l.type] ?? 0) +
        (["liability", "equity", "income"].includes(l.type)
          ? -l.closing
          : l.closing);
      return a;
    },
    {} as Record<string, number>,
  );
  const profit = trial
    .filter((a) => a.type === "income" || a.type === "expense")
    .reduce((s, a) => s + a.credit - a.debit, 0);
  const tabs = [
    ["journals", "Journaux"],
    ["accounts", "Plan comptable"],
    ["ledger", "Grand livre"],
    ["trial-balance", "Balance"],
    ["statements", "États financiers"],
    ["periods", "Exercices & clôtures"],
  ];
  return (
    <>
      <PageHeading
        eyebrow="COMPTABILITÉ GÉNÉRALE"
        title="Des comptes en équilibre."
        description="Contrôlez vos écritures, suivez vos comptes et préparez vos clôtures."
        action={
          can("accounting.post") && (
            <button className="button primary" onClick={() => setEditor(true)}>
              <Plus />
              Nouvelle écriture
            </button>
          )
        }
      />
      <div className="tabs page-tabs">
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            className={tab === key ? "active" : ""}
            href={href("/accounting/" + key)}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="overview-toolbar">
        <div className="section-title">
          <CheckCircle />
          Contrôle des écritures
        </div>
        <DateRangePicker />
      </div>
      {(tab === "journals" || !tabs.some(([key]) => key === tab)) && (
        <DataTable
          name="journaux"
          rows={inPeriod}
          columns={[
            { key: "reference", label: "Référence" },
            { key: "date", label: "Date" },
            { key: "journal", label: "Journal" },
            { key: "label", label: "Libellé" },
            {
              key: "debit",
              label: "Débit",
              value: (e) => balance(e.lines).debit,
              render: (e) => <Money value={balance(e.lines).debit} />,
            },
            {
              key: "credit",
              label: "Crédit",
              value: (e) => balance(e.lines).credit,
              render: (e) => <Money value={balance(e.lines).credit} />,
            },
            {
              key: "status",
              label: "Statut",
              render: (e) => <Badge value={e.status} />,
            },
          ]}
          filters={
            <select
              aria-label="Filtrer par journal"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
            >
              <option value="">Tous les journaux</option>
              {[
                "Ventes",
                "Achats",
                "Caisse",
                "Banque",
                "Opérations diverses",
              ].map((j) => (
                <option key={j}>{j}</option>
              ))}
            </select>
          }
          onRow={setSelected}
        />
      )}
      {tab === "accounts" && (
        <>
          <div className="action-toolbar">
            {can("accounting.post") && (
              <button
                className="button secondary"
                onClick={() => setAction("account.save")}
              >
                <Plus />
                Ajouter un sous-compte
              </button>
            )}
          </div>
          <DataTable
            name="plan-comptable"
            rows={db.accounts}
            columns={[
              { key: "number", label: "Numéro" },
              { key: "name", label: "Compte" },
              { key: "type", label: "Type" },
              {
                key: "normal",
                label: "Sens normal",
                render: (a) => (a.normal === "debit" ? "Débit" : "Crédit"),
              },
              {
                key: "active",
                label: "Statut",
                render: (a) => <Badge value={a.active ? "Actif" : "Inactif"} />,
              },
              ...(can("accounting.post")
                ? [
                    {
                      key: "actions",
                      label: "Action",
                      render: (a: (typeof db.accounts)[number]) => (
                        <button
                          className="text-button"
                          onClick={() =>
                            setConfirm({ type: "account.toggle", id: a.id })
                          }
                        >
                          {a.active ? "Désactiver" : "Activer"}
                        </button>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </>
      )}
      {tab === "ledger" && (
        <>
          <Alert>
            Choisissez un compte pour consulter son solde cumulatif. Cliquez sur
            une ligne pour retrouver l’écriture source.
          </Alert>
          <DataTable
            name="grand-livre"
            rows={rows.map((r, i) => ({ ...r, id: String(i) }))}
            filters={
              <select
                aria-label="Compte du grand livre"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              >
                <option value="">Tous les comptes</option>
                {db.accounts.map((a) => (
                  <option key={a.id} value={a.number}>
                    {a.number} · {a.name}
                  </option>
                ))}
              </select>
            }
            columns={[
              {
                key: "date",
                label: "Date",
                value: (r) => r.entry.date,
                render: (r) => r.entry.date,
              },
              {
                key: "reference",
                label: "Référence",
                value: (r) => r.entry.reference,
                render: (r) => r.entry.reference,
              },
              {
                key: "account",
                label: "Compte",
                value: (r) => r.line.account,
                render: (r) => r.line.account,
              },
              {
                key: "label",
                label: "Libellé",
                value: (r) => r.line.label,
                render: (r) => r.line.label,
              },
              {
                key: "debit",
                label: "Débit",
                value: (r) => r.line.debit,
                render: (r) => <Money value={r.line.debit} />,
              },
              {
                key: "credit",
                label: "Crédit",
                value: (r) => r.line.credit,
                render: (r) => <Money value={r.line.credit} />,
              },
              ...(account
                ? [
                    {
                      key: "running",
                      label: "Solde cumulatif",
                      render: (r: (typeof rows)[number]) => (
                        <Money value={r.running} />
                      ),
                    },
                  ]
                : []),
            ]}
            onRow={(r) => setSelected(r.entry)}
          />
        </>
      )}
      {tab === "trial-balance" && (
        <>
          <div className="impact-summary">
            <span>
              Mouvements débit
              <strong>
                <Money value={totals.debit} />
              </strong>
            </span>
            <span>
              Mouvements crédit
              <strong>
                <Money value={totals.credit} />
              </strong>
            </span>
            <Badge
              value={
                totals.debit === totals.credit
                  ? "Balance équilibrée"
                  : "Balance déséquilibrée"
              }
            />
          </div>
          <DataTable
            name="balance"
            rows={trial}
            columns={[
              { key: "number", label: "Compte" },
              { key: "name", label: "Libellé" },
              {
                key: "opening",
                label: "Ouverture",
                render: (r) => <Money value={r.opening} />,
              },
              {
                key: "debit",
                label: "Débit",
                render: (r) => <Money value={r.debit} />,
              },
              {
                key: "credit",
                label: "Crédit",
                render: (r) => <Money value={r.credit} />,
              },
              {
                key: "closing",
                label: "Solde final",
                render: (r) => <Money value={r.closing} />,
              },
            ]}
          />
        </>
      )}
      {tab === "statements" && (
        <>
          <div className="statement-grid">
            <section className="panel statement">
              <h2>Compte de résultat</h2>
              <p>
                Du {start} au {end} · écritures postées
              </p>
              {trial
                .filter((a) => a.type === "income" || a.type === "expense")
                .map((a) => (
                  <div key={a.id}>
                    <span>{a.name}</span>
                    <Money
                      value={
                        a.type === "income"
                          ? a.credit - a.debit
                          : a.debit - a.credit
                      }
                    />
                  </div>
                ))}
              <div className="statement-total">
                <strong>Résultat de la période</strong>
                <Money value={profit} />
              </div>
            </section>
            <section className="panel statement">
              <h2>Bilan</h2>
              <p>Situation au {end}</p>
              <div>
                <span>Actif</span>
                <Money value={statements.asset ?? 0} />
              </div>
              <div>
                <span>Passif</span>
                <Money value={statements.liability ?? 0} />
              </div>
              <div>
                <span>Capitaux propres</span>
                <Money value={statements.equity ?? 0} />
              </div>
              <div>
                <span>Résultat cumulé</span>
                <Money
                  value={(statements.income ?? 0) - (statements.expense ?? 0)}
                />
              </div>
              <div className="statement-total">
                <strong>Total passif et capitaux propres</strong>
                <Money
                  value={
                    (statements.liability ?? 0) +
                    (statements.equity ?? 0) +
                    (statements.income ?? 0) -
                    (statements.expense ?? 0)
                  }
                />
              </div>
            </section>
          </div>
          <section className="panel statement">
            <h2>Flux de trésorerie</h2>
            {["in", "out"].map((direction) => (
              <div key={direction}>
                <span>
                  {direction === "in" ? "Encaissements" : "Décaissements"}
                </span>
                <Money
                  value={db.payments
                    .filter(
                      (p) =>
                        (storeId === "all" || p.storeId === storeId) &&
                        p.date.slice(0, 10) >= start &&
                        p.date.slice(0, 10) <= end &&
                        p.direction === direction,
                    )
                    .reduce((s, p) => s + p.amount, 0)}
                />
              </div>
            ))}
          </section>
          <div className="statement-grid">
            {["clients", "fournisseurs"].map((kind) => (
              <section className="panel statement" key={kind}>
                <h2>
                  Ancienneté ·{" "}
                  {kind === "clients"
                    ? "créances clients"
                    : "dettes fournisseurs"}
                </h2>
                {[
                  [0, 30],
                  [31, 60],
                  [61, 90],
                  [91, 99999],
                ].map(([min, max]) => {
                  const items =
                    kind === "clients"
                      ? db.sales
                          .filter((s) => salePosition(s).due > 0)
                          .map((s) => ({
                            date: s.dueDate || s.date,
                            amount: salePosition(s).due,
                            storeId: s.storeId,
                          }))
                      : db.purchases.map((p) => ({
                          date: String(p.dueDate || p.date),
                          amount: (p.amount ?? 0) - (p.paid ?? 0),
                          storeId: p.storeId,
                        }));
                  const total = items
                    .filter((v) => {
                      const age = Math.max(
                        0,
                        Math.floor(
                          (new Date(end).getTime() -
                            new Date(v.date).getTime()) /
                            86400000,
                        ),
                      );
                      return (
                        (storeId === "all" || v.storeId === storeId) &&
                        age >= min &&
                        age <= max
                      );
                    })
                    .reduce((s, v) => s + v.amount, 0);
                  return (
                    <div key={min}>
                      <span>
                        {max > 90 ? "Plus de 90 jours" : `${min}–${max} jours`}
                      </span>
                      <Money value={total} />
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        </>
      )}
      {tab === "periods" && (
        <>
          <Alert>
            Une période verrouillée ne peut plus être modifiée. Les corrections
            se font par extourne dans une période ouverte.
          </Alert>
          <DataTable
            name="exercices"
            rows={db.periods}
            columns={[
              { key: "name", label: "Exercice / période" },
              { key: "start", label: "Début" },
              { key: "end", label: "Fin" },
              {
                key: "status",
                label: "Statut",
                render: (p) => <Badge value={p.status} />,
              },
              ...(can("accounting.close_period")
                ? [
                    {
                      key: "actions",
                      label: "Action",
                      render: (p: (typeof db.periods)[number]) =>
                        p.status === "open" ? (
                          <button
                            className="text-button"
                            onClick={() =>
                              setConfirm({ type: "period.lock", id: p.id })
                            }
                          >
                            <Lock />
                            Verrouiller
                          </button>
                        ) : null,
                    },
                  ]
                : []),
            ]}
          />
        </>
      )}
      {editor && <EntryEditor onClose={() => setEditor(false)} />}{" "}
      {selected && (
        <EntryDetail
          entry={db.entries.find((e) => e.id === selected.id) ?? selected}
          onClose={() => setSelected(null)}
        />
      )}{" "}
      {action && (
        <ActionForm
          type={action}
          title="Ajouter un compte"
          onClose={() => setAction("")}
        />
      )}{" "}
      {confirm && (
        <ConfirmDialog
          title={
            confirm.type === "period.lock"
              ? "Verrouiller cette période ?"
              : "Modifier le statut du compte ?"
          }
          onClose={() => setConfirm(null)}
          onConfirm={() => command(confirm.type, { id: confirm.id })}
        >
          <p>
            {confirm.type === "period.lock"
              ? "Vérifiez que les rapprochements sont terminés. Aucune nouvelle écriture ne pourra être postée dans cette période."
              : "Les écritures existantes seront conservées. Un compte désactivé ne sera plus proposé à la saisie."}
          </p>
        </ConfirmDialog>
      )}
    </>
  );
}
