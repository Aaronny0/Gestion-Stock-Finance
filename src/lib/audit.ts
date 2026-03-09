import { supabase } from './supabase';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE';
export type AuditEntity = 'product' | 'sale' | 'trade' | 'buyback' | 'stock_entry';

/**
 * Enregistre une action d'audit dans la table `audit_logs`.
 * Si la table n'existe pas, on log en console sans bloquer l'app.
 */
export async function logAudit(
    action: AuditAction,
    entityType: AuditEntity,
    entityId: string,
    details: Record<string, unknown> = {}
): Promise<void> {
    try {
        await supabase.from('audit_logs').insert({
            action,
            entity_type: entityType,
            entity_id: entityId,
            details: JSON.stringify(details),
        });
    } catch (err) {
        // Ne pas bloquer l'app si la table n'existe pas encore
        console.warn('[Audit] Impossible d\'écrire le log :', err);
    }
}
