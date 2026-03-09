'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { FiFilter, FiSearch, FiCalendar } from 'react-icons/fi';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMarques } from '@/hooks/useMarques';

type HistoryType = 'all' | 'ventes' | 'trocs' | 'rachats';

interface HistoryEntry {
    id: string;
    type: 'vente' | 'troc' | 'rachat';
    date: string;
    description: string;
    detail: string;
    amount: number;
    amountLabel: string;
    brandName: string;
}

export default function HistoriquePage() {
    const { marques, loading: marquesLoading } = useMarques();
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<HistoryType>('all');
    const [brandFilter, setBrandFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateStart, setDateStart] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [dateEnd, setDateEnd] = useState(() => format(new Date(), 'yyyy-MM-dd'));

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const startISO = startOfDay(new Date(dateStart)).toISOString();
            const endISO = endOfDay(new Date(dateEnd)).toISOString();

            const allEntries: HistoryEntry[] = [];

            // ── Ventes ──
            if (filter === 'all' || filter === 'ventes') {
                const { data: salesData } = await supabase
                    .from('sales')
                    .select('id, quantity, unit_price, total_price, notes, created_at, products(model, brands(name))')
                    .gte('created_at', startISO)
                    .lte('created_at', endISO)
                    .order('created_at', { ascending: false });

                salesData?.forEach((s: Record<string, unknown>) => {
                    const product = s.products as Record<string, unknown> | null;
                    const brand = product?.brands as Record<string, unknown> | null;
                    allEntries.push({
                        id: `sale-${s.id}`,
                        type: 'vente',
                        date: s.created_at as string,
                        description: `${brand?.name || ''} ${product?.model || ''}`,
                        detail: `${s.quantity} × ${formatCurrency(Number(s.unit_price))}${s.notes ? ` — ${s.notes}` : ''}`,
                        amount: Number(s.total_price),
                        amountLabel: formatCurrency(Number(s.total_price)),
                        brandName: (brand?.name as string) || '',
                    });
                });
            }

            // ── Trocs ──
            if (filter === 'all' || filter === 'trocs') {
                const { data: tradesData } = await supabase
                    .from('trades')
                    .select('id, client_phone_brand, client_phone_model, client_complement, trade_gain, shop_phone_price, shop_phone_value, created_at, products(model, brands(name)), notes')
                    .gte('created_at', startISO)
                    .lte('created_at', endISO)
                    .order('created_at', { ascending: false });

                tradesData?.forEach((t: Record<string, unknown>) => {
                    const product = t.products as Record<string, unknown> | null;
                    const brand = product?.brands as Record<string, unknown> | null;
                    allEntries.push({
                        id: `trade-${t.id}`,
                        type: 'troc',
                        date: t.created_at as string,
                        description: `${t.client_phone_brand} ${t.client_phone_model} ↔ ${brand?.name || ''} ${product?.model || ''}`,
                        detail: `Complément: ${formatCurrency(Number(t.client_complement))} | Gain: ${formatCurrency(Number(t.trade_gain))}${t.notes ? ` — ${t.notes}` : ''}`,
                        amount: Number(t.client_complement),
                        amountLabel: formatCurrency(Number(t.client_complement)),
                        brandName: (t.client_phone_brand as string) || (brand?.name as string) || '',
                    });
                });
            }

            // ── Rachats ──
            if (filter === 'all' || filter === 'rachats') {
                const { data: buybacksData } = await supabase
                    .from('buybacks')
                    .select('id, client_name, brand_name, model, description, purchase_price, notes, created_at')
                    .gte('created_at', startISO)
                    .lte('created_at', endISO)
                    .order('created_at', { ascending: false });

                buybacksData?.forEach((b: Record<string, unknown>) => {
                    allEntries.push({
                        id: `buyback-${b.id}`,
                        type: 'rachat',
                        date: b.created_at as string,
                        description: `${b.brand_name} ${b.model}`,
                        detail: `${b.client_name ? `Client: ${b.client_name}` : 'Client anonyme'}${b.description ? ` — ${b.description}` : ''}${b.notes ? ` — ${b.notes}` : ''}`,
                        amount: Number(b.purchase_price),
                        amountLabel: `— ${formatCurrency(Number(b.purchase_price))}`,
                        brandName: (b.brand_name as string) || '',
                    });
                });
            }

            // Tri chronologique décroissant
            allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setEntries(allEntries);
        } catch (error) {
            console.error('Historique load error:', error);
        } finally {
            setLoading(false);
        }
    }, [filter, dateStart, dateEnd]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filtrage par marque
    const brandFilteredEntries = entries.filter(e => {
        if (!brandFilter) return true;
        return e.brandName.toLowerCase() === brandFilter.toLowerCase();
    });

    // Filtrage par recherche texte
    const filteredEntries = brandFilteredEntries.filter(e => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            e.description.toLowerCase().includes(q) ||
            e.detail.toLowerCase().includes(q)
        );
    });

    const typeBadge = (type: HistoryEntry['type']) => {
        switch (type) {
            case 'vente': return <span className="badge badge-success">Vente</span>;
            case 'troc': return <span className="badge badge-purple">Troc</span>;
            case 'rachat': return <span className="badge badge-warning">Rachat</span>;
        }
    };

    const typeColor = (type: HistoryEntry['type']) => {
        switch (type) {
            case 'vente': return 'var(--success)';
            case 'troc': return 'var(--accent-primary-hover)';
            case 'rachat': return 'var(--danger)';
        }
    };

    // Stats
    const totalVentes = filteredEntries.filter(e => e.type === 'vente').reduce((s, e) => s + e.amount, 0);
    const totalTrocs = filteredEntries.filter(e => e.type === 'troc').reduce((s, e) => s + e.amount, 0);
    const totalRachats = filteredEntries.filter(e => e.type === 'rachat').reduce((s, e) => s + e.amount, 0);

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Historique</h2>
                    <p className="page-subtitle">Consultez l&apos;intégralité de vos mouvements : ventes, trocs et rachats</p>
                </div>
            </div>

            {/* Filtres */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    {/* Filtre par type */}
                    <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiFilter size={14} /> Type
                        </label>
                        <select
                            className="form-select"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as HistoryType)}
                        >
                            <option value="all">Tous les mouvements</option>
                            <option value="ventes">🛒 Ventes uniquement</option>
                            <option value="trocs">🔄 Trocs uniquement</option>
                            <option value="rachats">📱 Rachats uniquement</option>
                        </select>
                    </div>

                    {/* Filtre par marque */}
                    <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            📱 Marque
                        </label>
                        <select
                            className="form-select"
                            value={brandFilter}
                            onChange={(e) => setBrandFilter(e.target.value)}
                            disabled={marquesLoading}
                        >
                            <option value="">{marquesLoading ? 'Chargement...' : 'Toutes les marques'}</option>
                            {marques.map((m) => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Plage de dates */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiCalendar size={14} /> Du
                        </label>
                        <input
                            type="date"
                            className="form-input"
                            value={dateStart}
                            onChange={(e) => setDateStart(e.target.value)}
                            style={{ width: 'auto' }}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Au</label>
                        <input
                            type="date"
                            className="form-input"
                            value={dateEnd}
                            onChange={(e) => setDateEnd(e.target.value)}
                            style={{ width: 'auto' }}
                        />
                    </div>

                    {/* Recherche */}
                    <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiSearch size={14} /> Recherche
                        </label>
                        <div style={{ position: 'relative' }}>
                            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Rechercher par produit, marque, client..."
                                style={{ paddingLeft: '36px' }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats résumées */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-icon green"><span style={{ fontSize: '20px' }}>🛒</span></div>
                    <div className="stat-info">
                        <div className="stat-label">Ventes</div>
                        <div className="stat-value" style={{ fontSize: '20px', color: 'var(--success)' }}>
                            {formatCurrency(totalVentes)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {filteredEntries.filter(e => e.type === 'vente').length} transaction(s)
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><span style={{ fontSize: '20px' }}>🔄</span></div>
                    <div className="stat-info">
                        <div className="stat-label">Trocs (compléments)</div>
                        <div className="stat-value" style={{ fontSize: '20px', color: 'var(--accent-primary-hover)' }}>
                            {formatCurrency(totalTrocs)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {filteredEntries.filter(e => e.type === 'troc').length} échange(s)
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><span style={{ fontSize: '20px' }}>📱</span></div>
                    <div className="stat-info">
                        <div className="stat-label">Rachats (décaissé)</div>
                        <div className="stat-value" style={{ fontSize: '20px', color: 'var(--danger)' }}>
                            {formatCurrency(totalRachats)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {filteredEntries.filter(e => e.type === 'rachat').length} rachat(s)
                        </div>
                    </div>
                </div>
            </div>

            {/* Tableau */}
            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <span>Chargement de l&apos;historique...</span>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date &amp; Heure</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Détails</th>
                                <th>Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📋</div>
                                            <div className="empty-state-text">Aucun mouvement trouvé</div>
                                            <div className="empty-state-sub">Ajustez les filtres ou la plage de dates</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                                            {format(new Date(entry.date), 'dd MMM yyyy HH:mm', { locale: fr })}
                                        </td>
                                        <td>{typeBadge(entry.type)}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {entry.description}
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                                            {entry.detail}
                                        </td>
                                        <td style={{ fontWeight: 700, color: typeColor(entry.type), whiteSpace: 'nowrap' }}>
                                            {entry.amountLabel}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Total affiché */}
            {filteredEntries.length > 0 && (
                <div style={{
                    display: 'flex', justifyContent: 'flex-end', gap: '16px',
                    marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)'
                }}>
                    <span><strong>{filteredEntries.length}</strong> mouvement{filteredEntries.length > 1 ? 's' : ''}</span>
                </div>
            )}
        </div>
    );
}
