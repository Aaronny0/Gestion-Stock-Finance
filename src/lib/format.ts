/**
 * Formate un nombre en devise FCFA (format français).
 * Retourne '—' si la valeur est null ou undefined.
 */
export function formatCurrency(val: number | null | undefined): string {
    if (val === null || val === undefined) return '—';
    const formatted = new Intl.NumberFormat('fr-FR').format(val);
    // Remove non-breaking spaces (U+202F or U+00A0) and replace with regular space to prevent PDF encoding issues 
    return formatted.replace(/[\u202f\u00a0]/g, ' ') + ' FCFA';
}
