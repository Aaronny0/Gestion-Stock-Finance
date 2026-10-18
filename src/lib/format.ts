/** Accord simple du pluriel français : « 0 unité », « 1 unité », « 18 unités ». */
export function plural(count: number, word: string): string {
  return `${count} ${Math.abs(count) >= 2 ? `${word}s` : word}`;
}

/**
 * Date d'une ligne de liste, au format de Ventes : « 18 oct. », ou « 18 oct., 19:34 » avec l'heure (D30).
 * Une date ISO sans heure est lue à midi local pour ne jamais glisser au jour précédent, et s'affiche sans heure.
 */
export function formatListDate(value: string | Date, opts: { time?: boolean } = {}): string {
  const dateOnly = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnly ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    ...(opts.time && !dateOnly ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
