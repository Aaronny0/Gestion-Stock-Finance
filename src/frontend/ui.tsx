"use client";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, Clock, Info, CircleMinus, ChevronLeft, ChevronRight, Download, Search, X, Inbox, CircleAlert } from "lucide-react";
import { money } from "./accounting";
import { useWorkspace, useViewState } from "./provider";
export function Money({ value }: { value: number }) {
  const { snapshot } = useWorkspace();
  return (
    <span className="money">
      {money(value, snapshot?.session.organization.currency)}
    </span>
  );
}
export function Badge({ value }: { value: string }) {
  const labels: Record<string, string> = {
    posted: "Postée",
    draft: "Brouillon",
    reversed: "Extournée",
    paid: "Payée",
    credit: "À crédit",
    refunded: "Remboursée",
    partially_refunded: "Retour partiel",
    open: "Ouverte",
    closed: "Clôturée",
    locked: "Verrouillée",
  };
  const warning =
    /credit|draft|attente|faible|échéance aujourd|à définir/i.test(value);
  const danger = /suspend|rupture|erreur|en retard/i.test(value);
  const success =
    /^(posted|paid|open|active|actif|validée?|soldée?|payée?|reçue?)$/i.test(
      value,
    );
  const info = /partially_refunded|à venir/i.test(value);
  const color = danger
    ? "red"
    : warning
      ? "amber"
      : success
        ? "green"
        : info
          ? "blue"
          : "neutral";
  const Icon = danger
    ? CircleAlert
    : warning
      ? Clock
      : success
        ? Check
        : info
          ? Info
          : CircleMinus;
  return (
    <span className={`badge ${color}`}>
      <Icon aria-hidden="true" />
      {labels[value] ?? value}
    </span>
  );
}
export function Alert({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`alert ${error ? "error" : ""}`}
      role={error ? "alert" : "status"}
    >
      <CircleAlert aria-hidden />
      {children}
    </div>
  );
}
export function EmptyState({
  title = "Aucun résultat",
  description = "Essayez de modifier vos filtres ou créez votre premier élément.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span>
        <Inbox />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Skeleton() {
  return (
    <div className="skeleton-grid" role="status" aria-label="Chargement">
      <div />
      <div />
      <div />
      <div />
      <div className="wide" />
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow ?? "ESPACE DE GESTION"}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{action}</div>
    </div>
  );
}
export function Field({
  label,
  children,
  error,
  hint,
  required,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <label className="field">
      <span>
        {label}
        {required && <b aria-hidden> *</b>}
      </span>
      {children}
      {hint && <small>{hint}</small>}
      {error && (
        <small id={id} className="field-error" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}
let modalLocks = 0;
let bodyOverflowBeforeModal = "";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    if (modalLocks++ === 0) {
      bodyOverflowBeforeModal = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (--modalLocks === 0)
        document.body.style.overflow = bodyOverflowBeforeModal;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby={titleId}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button className="icon-button" aria-label="Fermer" onClick={onClose}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ConfirmDialog({
  title,
  children,
  onClose,
  onConfirm,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onConfirm: () => unknown;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="modal-body">
        {children}
        <div className="modal-actions">
          <button className="button secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="button primary" onClick={onConfirm}>
            Confirmer
          </button>
        </div>
      </div>
    </Modal>
  );
}
function safeCell(value: unknown) {
  const s = String(value ?? "");
  return /^[=+@\-\t\r]/.test(s) ? `'${s}` : s;
}
export function downloadCsv(rows: Record<string, unknown>[], name: string) {
  const columns = Object.keys(rows[0] ?? {});
  const content =
    "\uFEFF" +
    [columns, ...rows.map((r) => columns.map((k) => safeCell(r[k])))]
      .map((row) =>
        row.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(";"),
      )
      .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ExportMenu({
  rows,
  name,
}: {
  rows: Record<string, unknown>[];
  name: string;
}) {
  const { can } = useWorkspace();
  const [error, setError] = useState("");
  if (!can("exports.create")) return null;
  return (
    <div>
      <details className="export-menu">
        <summary className="button secondary">
          <Download />
          Exporter
        </summary>
        <div>
          <button type="button" onClick={() => downloadCsv(rows, name)}>
            Fichier CSV
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const XLSX = await import("xlsx");
                const sheet = XLSX.utils.json_to_sheet(
                  rows.map((r) =>
                    Object.fromEntries(
                      Object.entries(r).map(([k, v]) => [
                        k,
                        typeof v === "string" ? safeCell(v) : v,
                      ]),
                    ),
                  ),
                );
                const book = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(book, sheet, "Données");
                XLSX.writeFile(book, `${name}.xlsx`);
              } catch {
                setError("Export indisponible. Réessayez.");
              }
            }}
          >
            Classeur Excel
          </button>
        </div>
      </details>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  value?: (row: T) => string | number;
}
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  name,
  emptyAction,
  filters,
  onRow,
}: {
  rows: T[];
  columns: Column<T>[];
  name: string;
  emptyAction?: ReactNode;
  filters?: ReactNode;
  onRow?: (row: T) => void;
}) {
  const { can } = useWorkspace();
  const selectable = can("exports.create");
  const [selection, setSelection] = useState<string[]>([]);
  const [query, setQuery] = useViewState(`${name}:query`, ""),
    [page, setPage] = useViewState(`${name}:page`, 1),
    [sort, setSort] = useViewState(`${name}:sort`, {
      key: "",
      ascending: true,
    });
  const result = useMemo(() => {
    const get = (r: T, c: Column<T>) =>
      c.value
        ? c.value(r)
        : String((r as Record<string, unknown>)[c.key] ?? "");
    const filtered = rows.filter((r) =>
      columns.some((c) =>
        String(get(r, c))
          .toLocaleLowerCase("fr")
          .includes(query.toLocaleLowerCase("fr")),
      ),
    );
    const column = columns.find((c) => c.key === sort.key);
    if (column)
      filtered.sort((a, b) => {
        const x = get(a, column),
          y = get(b, column);
        return (
          (typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x).localeCompare(String(y), "fr", { numeric: true })) *
          (sort.ascending ? 1 : -1)
        );
      });
    return filtered;
  }, [rows, columns, query, sort]);
  const pages = Math.max(1, Math.ceil(result.length / 8)),
    current = Math.min(page, pages);
  const selectedRows = result.filter((r) => selection.includes(r.id));
  const exportRows = (selectedRows.length ? selectedRows : result).map((r) =>
    Object.fromEntries(
      columns
        .filter((c) => c.key !== "actions")
        .map((c) => [
          c.label,
          c.value ? c.value(r) : ((r as Record<string, unknown>)[c.key] ?? ""),
        ]),
    ),
  );
  return (
    <section className="panel data-panel">
      <div className="table-toolbar">
        <label className="search-input">
          <Search />
          <input
            aria-label={`Rechercher dans ${name}`}
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <div className="table-filters">
          {filters}
          {selectedRows.length > 0 && (
            <span className="muted">{selectedRows.length} sélectionné(s)</span>
          )}
          <ExportMenu rows={exportRows} name={name} />
        </div>
      </div>
      <div className="mobile-table-sort">
        <label className="field">
          <span>Trier par</span>
          <select
            aria-label={`Trier ${name}`}
            value={sort.key}
            onChange={(e) => {
              setSort({ key: e.target.value, ascending: true });
              setPage(1);
            }}
          >
            <option value="">Ordre initial</option>
            {columns
              .filter((c) => !["action", "actions"].includes(c.key))
              .map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
          </select>
        </label>
        <button
          className="button secondary"
          disabled={!sort.key}
          aria-label={`Inverser le tri ${name}`}
          onClick={() => setSort({ ...sort, ascending: !sort.ascending })}
        >
          {sort.ascending ? "Croissant ↑" : "Décroissant ↓"}
        </button>
      </div>
      {!result.length ? (
        <EmptyState action={emptyAction} />
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {selectable && (
                  <th>
                    <input
                      type="checkbox"
                      aria-label={`Tout sélectionner dans ${name}`}
                      checked={
                        result.length > 0 &&
                        result.every((r) => selection.includes(r.id))
                      }
                      onChange={(e) =>
                        setSelection(
                          e.target.checked ? result.map((r) => r.id) : [],
                        )
                      }
                    />
                  </th>
                )}
                {columns.map((c) => (
                  <th
                    key={c.key}
                    aria-sort={
                      sort.key === c.key
                        ? sort.ascending
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSort({
                          key: c.key,
                          ascending:
                            sort.key === c.key ? !sort.ascending : true,
                        })
                      }
                    >
                      {c.label}
                      {sort.key === c.key ? (sort.ascending ? " ↑" : " ↓") : ""}
                    </button>
                  </th>
                ))}
                {onRow && <th>Détail</th>}
              </tr>
            </thead>
            <tbody>
              {result.slice((current - 1) * 8, current * 8).map((r) => (
                <tr key={r.id}>
                  {selectable && (
                    <td className="selection-cell" data-label="Sélection">
                      <input
                        type="checkbox"
                        aria-label={`Sélectionner ${r.id}`}
                        checked={selection.includes(r.id)}
                        onChange={(e) =>
                          setSelection(
                            e.target.checked
                              ? [...selection, r.id]
                              : selection.filter((id) => id !== r.id),
                          )
                        }
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td data-label={c.label} key={c.key}>
                      {c.render
                        ? c.render(r)
                        : String((r as Record<string, unknown>)[c.key] ?? "—")}
                    </td>
                  ))}
                  {onRow && (
                    <td data-label="Détail">
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => onRow(r)}
                        aria-label={`Ouvrir le détail ${r.id}`}
                      >
                        Voir <ChevronRight />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="table-footer">
        <span>
          {result.length} résultat{result.length > 1 ? "s" : ""} · Page{" "}
          {current} sur {pages}
        </span>
        <div>
          <button
            type="button"
            className="icon-button"
            aria-label="Page précédente"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Page suivante"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
export function DateRangePicker() {
  const { start, end, setDates } = useWorkspace();
  return (
    <div className="date-range">
      <select
        aria-label="Période prédéfinie"
        value=""
        onChange={(e) => {
          const b = new Date(),
            a = new Date();
          const n = Number(e.target.value);
          a.setDate(a.getDate() - n + 1);
          setDates(a.toISOString().slice(0, 10), b.toISOString().slice(0, 10));
        }}
      >
        <option value="" disabled>
          Période
        </option>
        <option value="1">Aujourd’hui</option>
        <option value="7">7 derniers jours</option>
        <option value="30">30 derniers jours</option>
        <option value="90">Trimestre</option>
        <option value="365">Année</option>
      </select>
      <input
        aria-label="Date de début"
        type="date"
        value={start}
        max={end}
        onChange={(e) => e.target.value && setDates(e.target.value, end)}
      />
      <span>—</span>
      <input
        aria-label="Date de fin"
        type="date"
        value={end}
        min={start}
        onChange={(e) => e.target.value && setDates(start, e.target.value)}
      />
    </div>
  );
}
