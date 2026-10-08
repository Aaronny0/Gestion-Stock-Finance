"use client";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { useWorkspace } from "@/frontend/provider";
import styles from "./dashboard.module.css";
export function DashboardPeriodFilter() {
  const { start, end, setDates, snapshot } = useWorkspace();
  const [expanded, setExpanded] = useState(false);
  const range = (count: number) => {
    const last = new Intl.DateTimeFormat("en-CA", {
      timeZone: snapshot!.session.organization.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const first = new Date(last + "T12:00:00Z");
    first.setUTCDate(first.getUTCDate() - count + 1);
    return [first.toISOString().slice(0, 10), last] as const;
  };
  const preset = (count: number) => setDates(...range(count));
  const active = (count: number) => {
    const [first, last] = range(count);
    return start === first && end === last;
  };
  return (
    <div className={styles.period}>
      <div className={styles.presets}>
        {[7, 30].map((days) => (
          <button
            key={days}
            type="button"
            aria-pressed={active(days)}
            onClick={() => preset(days)}
          >
            {days} derniers jours
          </button>
        ))}
      </div>
      <button
        className={styles.dateToggle}
        type="button"
        aria-expanded={expanded}
        aria-controls="dashboard-dates"
        aria-label="Choisir une période personnalisée"
        onClick={() => setExpanded(!expanded)}
      >
        <CalendarDays size={16} />
        <span>
          {start.split("-").reverse().join("/")} —{" "}
          {end.split("-").reverse().join("/")}
        </span>
      </button>
      {expanded && (
        <div className={styles.dateFields} id="dashboard-dates">
          <label>
            Date de début
            <input
              type="date"
              value={start}
              max={end}
              onChange={(event) =>
                event.target.value &&
                event.target.validity.valid &&
                setDates(event.target.value, end)
              }
            />
          </label>
          <label>
            Date de fin
            <input
              type="date"
              value={end}
              min={start}
              onChange={(event) =>
                event.target.value &&
                event.target.validity.valid &&
                setDates(start, event.target.value)
              }
            />
          </label>
          <button type="button" onClick={() => setExpanded(false)}>
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
