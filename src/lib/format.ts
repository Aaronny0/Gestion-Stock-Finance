/**
 * Formate un nombre en devise FCFA (format français).
 * Retourne '—' si la valeur est null ou undefined.
 */
export function formatCurrency(val: number | null | undefined): string {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
}
