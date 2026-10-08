"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Money } from "@/components/data-display/money";
import styles from "./dashboard.module.css";

type Day = { date: string; revenue: number; margin: number };
export function DashboardChart({
  rows,
  currency,
  showMargin,
  salesHref,
  analyticsHref,
}: {
  rows: Day[];
  currency: string;
  showMargin: boolean;
  salesHref: (date: string) => string;
  analyticsHref?: string;
}) {
  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  });
  const units = 10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 0);
  const [selected, setSelected] = useState<string | null>(null);
  const active = rows.find((row) => row.date === selected);
  const max = Math.max(
    1,
    ...rows.map((row) => Math.max(row.revenue, showMargin ? row.margin : 0)),
  );
  const ceiling = 10 ** Math.floor(Math.log10(max));
  const top = Math.ceil(max / ceiling) * ceiling;
  const minimum = Math.min(
    0,
    ...rows.flatMap((row) => [row.revenue, showMargin ? row.margin : 0]),
  );
  const bottom =
    minimum < 0 ? -Math.ceil(Math.abs(minimum) / ceiling) * ceiling : 0;
  const range = top - bottom;
  const ticks = [top, top - range / 3, top - (range * 2) / 3, bottom];
  const barStyle = (value: number) => ({
    height: `${(Math.abs(value) / range) * 100}%`,
    bottom: `${((Math.min(0, value) - bottom) / range) * 100}%`,
  });
  return (
    <section className={styles.card} aria-labelledby="activity-title">
      <div className={styles.cardHeading}>
        <h2 id="activity-title">Activité</h2>
        {analyticsHref && (
          <Link href={analyticsHref}>
            Analyses <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
      <div className={styles.legend}>
        <span>
          <i />
          Chiffre d’affaires
        </span>
        {showMargin && (
          <span>
            <i className={styles.marginDot} />
            Marge brute
          </span>
        )}
        <small>{currency}</small>
      </div>
      <div className={styles.readout} aria-live="polite">
        {active
          ? new Date(active.date + "T12:00:00").toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })
          : "Total de la période"}
        <strong>
          <Money
            value={
              active?.revenue ?? rows.reduce((sum, row) => sum + row.revenue, 0)
            }
            currency={currency}
          />
        </strong>
        {showMargin && (
          <span>
            · marge{" "}
            <Money
              value={
                active?.margin ?? rows.reduce((sum, row) => sum + row.margin, 0)
              }
              currency={currency}
            />
          </span>
        )}
      </div>
      {rows.some(
        (row) => row.revenue !== 0 || (showMargin && row.margin !== 0),
      ) ? (
        <div className={styles.chart}>
          <div className={styles.axis} aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick}>
                {new Intl.NumberFormat("fr-FR", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(tick / units)}
              </span>
            ))}
          </div>
          <div className={styles.plot}>
            <div className={styles.grid} aria-hidden="true">
              {ticks.map((tick) => (
                <i key={tick} />
              ))}
            </div>
            <div className={styles.bars} onMouseLeave={() => setSelected(null)}>
              {rows.map((row) => (
                <Link
                  key={row.date}
                  href={salesHref(row.date)}
                  className={styles.barTarget}
                  onMouseEnter={() => setSelected(row.date)}
                  onFocus={() => setSelected(row.date)}
                  onBlur={() => setSelected(null)}
                  aria-label={`Voir les ventes du ${row.date} : ${formatter.format(row.revenue / units)}`}
                >
                  <span
                    className={styles.bar}
                    style={{
                      ...barStyle(row.revenue),
                      opacity: selected && selected !== row.date ? 0.35 : 1,
                    }}
                  />
                  {showMargin && (
                    <span
                      className={styles.marginBar}
                      style={{
                        ...barStyle(row.margin),
                        opacity: selected && selected !== row.date ? 0.35 : 1,
                      }}
                    />
                  )}
                </Link>
              ))}
            </div>
            <div className={styles.xAxis} aria-hidden="true">
              {[rows[0], rows[Math.floor(rows.length / 2)], rows.at(-1)]
                .filter((row): row is Day => !!row)
                .map((row, index) => (
                  <span key={index}>
                    {new Date(row.date + "T12:00:00").toLocaleDateString(
                      "fr-FR",
                      { day: "numeric", month: "short" },
                    )}
                  </span>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <p className={styles.empty}>
          Aucune activité sur la période sélectionnée.
        </p>
      )}
      {rows.some(
        (row) => row.revenue < 0 || (showMargin && row.margin < 0),
      ) && (
        <p className={styles.muted}>
          Les valeurs sous zéro correspondent aux retours ou à une marge
          négative.
        </p>
      )}
      <div className={styles.dayPicker}>
        <label htmlFor="dashboard-day">Ouvrir les ventes d’un jour</label>
        <select
          id="dashboard-day"
          value={selected ?? ""}
          onChange={(event) => setSelected(event.target.value || null)}
        >
          <option value="">Choisir un jour</option>
          {rows.map((row) => (
            <option key={row.date} value={row.date}>
              {row.date}
            </option>
          ))}
        </select>
        {active && (
          <Link className={styles.textAction} href={salesHref(active.date)}>
            Ouvrir <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
    </section>
  );
}
