'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import {
    FiDollarSign, FiCheck, FiCalendar, FiTrendingUp
} from 'react-icons/fi';
import {
    format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    startOfQuarter, endOfQuarter, startOfYear, endOfYear, startOfDay, endOfDay
} from 'date-fns';
import { fr } from 'date-fns/locale';
import dynamic from 'next/dynamic';

const FinanceRecettesChart = dynamic(() => import('@/components/charts/FinanceRecettesChart'), { ssr: false });
const FinanceGainsChart = dynamic(() => import('@/components/charts/FinanceGainsChart'), { ssr: false });

type PeriodType = 'jour' | 'semaine' | 'mois' | 'trimestre' | 'semestre' | 'annee' | 'custom';

interface FinanceEntry {
    date: string;
    ventes: number;
    trocs_complement: number;
    trocs_gain: number;
    total: number;
}

interface Movement {
    id: string;
    type: string;
    description: string;
    amount: number;
    created_at: string;
}

export default function FinancePage() {
    const { showToast } = useToast();
    const [period, setPeriod] = useState<PeriodType>('jour');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [financeData, setFinanceData] = useState<FinanceEntry[]>([]);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);

    // Receipt form
    const [receiptAmount, setReceiptAmount] = useState('');
    const [receiptNotes, setReceiptNotes] = useState('');
    const [todayReceipt, setTodayReceipt] = useState<number | null>(null);
    const [todayComputedTotal, setTodayComputedTotal] = useState<number>(0);
    const [submitting, setSubmitting] = useState(false);

    const getDateRange = useCallback((): { start: Date; end: Date } => {
        const now = new Date();
        switch (period) {
            case 'jour':
                return { start: startOfDay(now), end: endOfDay(now) };
            case 'semaine':
                return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
            case 'mois':
                return { start: startOfMonth(now), end: endOfMonth(now) };
            case 'trimestre':
                return { start: startOfQuarter(now), end: endOfQuarter(now) };
            case 'semestre': {
                const month = now.getMonth();
                const semestreStart = month < 6
                    ? new Date(now.getFullYear(), 0, 1)
                    : new Date(now.getFullYear(), 6, 1);
                const semestreEnd = month < 6
                    ? new Date(now.getFullYear(), 5, 30, 23, 59, 59)
                    : new Date(now.getFullYear(), 11, 31, 23, 59, 59);
                return { start: semestreStart, end: semestreEnd };
            }
            case 'annee':
                return { start: startOfYear(now), end: endOfYear(now) };
            case 'custom':
                return {
                    start: customStart ? new Date(`${customStart}T00:00:00`) : subDays(now, 30),
                    end: customEnd ? new Date(`${customEnd}T23:59:59`) : now,
                };
            default:
                return { start: startOfDay(now), end: endOfDay(now) };
        }
    }, [period, customStart, customEnd]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { start, end } = getDateRange();
            const startISO = start.toISOString();
            const endISO = end.toISOString();

            // Sales in period
            const { data: salesData } = await supabase
                .from('sales')
                .select('total_price, created_at, products(model, brands(name))')
                .gte('created_at', startISO)
                .lte('created_at', endISO)
                .order('created_at', { ascending: false });

            // Trades in period
            const { data: tradesData } = await supabase
                .from('trades')
                .select('client_complement, trade_gain, client_phone_brand, client_phone_model, created_at')
                .gte('created_at', startISO)
                .lte('created_at', endISO)
                .order('created_at', { ascending: false });

            // Build movements list
            const mvts: Movement[] = [];
            salesData?.forEach((s: Record<string, unknown>) => {
                const product = s.products as Record<string, unknown> | null;
                const brand = product?.brands as Record<string, unknown> | null;
                mvts.push({
                    id: `sale-${s.created_at}`,
                    type: 'Vente',
                    description: `${brand?.name || ''} ${product?.model || ''}`,
                    amount: Number(s.total_price),
                    created_at: s.created_at as string,
                });
            });

            tradesData?.forEach((t: Record<string, unknown>) => {
                mvts.push({
                    id: `trade-${t.created_at}`,
                    type: 'Troc',
                    description: `${t.client_phone_brand} ${t.client_phone_model}`,
                    amount: Number(t.client_complement),
                    created_at: t.created_at as string,
                });
            });

            mvts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setMovements(mvts);

            // Build chart data by day
            const dailyMap: Record<string, FinanceEntry> = {};

            salesData?.forEach((s: Record<string, unknown>) => {
                const day = format(new Date(s.created_at as string), 'yyyy-MM-dd');
                if (!dailyMap[day]) {
                    dailyMap[day] = { date: day, ventes: 0, trocs_complement: 0, trocs_gain: 0, total: 0 };
                }
                dailyMap[day].ventes += Number(s.total_price);
                dailyMap[day].total += Number(s.total_price);
            });

            tradesData?.forEach((t: Record<string, unknown>) => {
                const day = format(new Date(t.created_at as string), 'yyyy-MM-dd');
                if (!dailyMap[day]) {
                    dailyMap[day] = { date: day, ventes: 0, trocs_complement: 0, trocs_gain: 0, total: 0 };
                }
                dailyMap[day].trocs_complement += Number(t.client_complement);
                dailyMap[day].trocs_gain += Number(t.trade_gain);
                dailyMap[day].total += Number(t.client_complement);
            });

            const chartEntries = Object.values(dailyMap).sort((a, b) =>
                a.date.localeCompare(b.date)
            );

            // Format dates for display
            chartEntries.forEach(e => {
                e.date = format(new Date(e.date), 'dd/MM', { locale: fr });
            });

            setFinanceData(chartEntries);

            // Load today's receipt
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const { data: receiptData } = await supabase
                .from('daily_receipts')
                .select('total_amount')
                .eq('receipt_date', todayStr)
                .single();

            setTodayReceipt(receiptData ? Number(receiptData.total_amount) : null);

            // Calculer le total réel du jour depuis les ventes
            const todayStart = startOfDay(new Date()).toISOString();
            const todayEnd = endOfDay(new Date()).toISOString();
            const { data: todaySalesData } = await supabase
                .from('sales')
                .select('total_price')
                .gte('created_at', todayStart)
                .lte('created_at', todayEnd);
            const { data: todayTradesData } = await supabase
                .from('trades')
                .select('client_complement')
                .gte('created_at', todayStart)
                .lte('created_at', todayEnd);
            const computedSales = todaySalesData?.reduce((s, x) => s + Number(x.total_price), 0) || 0;
            const computedTrocs = todayTradesData?.reduce((s, x) => s + Number(x.client_complement), 0) || 0;
            setTodayComputedTotal(computedSales + computedTrocs);

        } catch (error) {
            console.error('Finance load error:', error);
        } finally {
            setLoading(false);
        }
    }, [getDateRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleReceipt(e: React.FormEvent) {
        e.preventDefault();
        if (!receiptAmount) {
            showToast('Veuillez saisir le montant de la recette', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');

            const { data: existing } = await supabase
                .from('daily_receipts')
                .select('id')
                .eq('receipt_date', todayStr)
                .single();

            if (existing) {
                await supabase
                    .from('daily_receipts')
                    .update({
                        total_amount: parseFloat(receiptAmount),
                        notes: receiptNotes || null,
                    })
                    .eq('id', existing.id);
            } else {
                await supabase.from('daily_receipts').insert({
                    receipt_date: todayStr,
                    total_amount: parseFloat(receiptAmount),
                    notes: receiptNotes || null,
                });
            }

            showToast('Recette du jour enregistrée !', 'success');
            setReceiptAmount('');
            setReceiptNotes('');
            loadData();
        } catch (error) {
            console.error('Receipt error:', error);
            showToast('Erreur lors de l\'enregistrement', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
    };

    const totalVentes = financeData.reduce((s, f) => s + f.ventes, 0);
    const totalComps = financeData.reduce((s, f) => s + f.trocs_complement, 0);
    const totalGains = financeData.reduce((s, f) => s + f.trocs_gain, 0);
    const grandTotal = totalVentes + totalComps;

    const periodLabels: Record<PeriodType, string> = {
        jour: 'Aujourd\'hui',
        semaine: 'Cette semaine',
        mois: 'Ce mois',
        trimestre: 'Ce trimestre',
        semestre: 'Ce semestre',
        annee: 'Cette année',
        custom: 'Période personnalisée',
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Finance & Reporting</h2>
                    <p className="page-subtitle">Suivi des recettes et analyses financières</p>
                </div>
            </div>

            {/* Daily Receipt Entry */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiDollarSign /> Recette du Jour
                    </div>
                    {todayReceipt !== null && (
                        <span className="badge badge-success">
                            Déjà enregistrée : {formatCurrency(todayReceipt)}
                        </span>
                    )}
                </div>
                <form onSubmit={handleReceipt} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                        <label className="form-label">Montant Total (FCFA) *</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="Recette du jour..."
                            value={receiptAmount}
                            onChange={(e) => setReceiptAmount(e.target.value)}
                            required
                        />
                        {todayComputedTotal > 0 && (
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    Calculé depuis les ventes :
                                </span>
                                <strong style={{ fontSize: '13px', color: 'var(--success)' }}>
                                    {formatCurrency(todayComputedTotal)}
                                </strong>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    style={{ fontSize: '11px', padding: '2px 8px' }}
                                    onClick={() => setReceiptAmount(todayComputedTotal.toString())}
                                >
                                    ↑ Pré-remplir
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                        <label className="form-label">Notes</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Optionnel..."
                            value={receiptNotes}
                            onChange={(e) => setReceiptNotes(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-success" disabled={submitting}>
                        {submitting ? <span className="loading-spinner" /> : <FiCheck />}
                        Enregistrer
                    </button>
                </form>
            </div>

            {/* Period Tabs */}
            <div className="tabs">
                {(['jour', 'semaine', 'mois', 'trimestre', 'semestre', 'annee', 'custom'] as PeriodType[]).map((p) => (
                    <button
                        key={p}
                        className={`tab ${period === p ? 'active' : ''}`}
                        onClick={() => setPeriod(p)}
                    >
                        {p === 'jour' ? 'Jour' : p === 'semaine' ? 'Semaine' : p === 'mois' ? 'Mois' :
                            p === 'trimestre' ? 'Trimestre' : p === 'semestre' ? 'Semestre' :
                                p === 'annee' ? 'Année' : 'Plage'}
                    </button>
                ))}
            </div>

            {/* Custom Date Range */}
            {period === 'custom' && (
                <div className="date-range-picker" style={{ marginBottom: '20px' }}>
                    <FiCalendar style={{ color: 'var(--text-tertiary)' }} />
                    <input
                        type="date"
                        className="form-input"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        style={{ width: 'auto' }}
                    />
                    <span className="date-range-separator">au</span>
                    <input
                        type="date"
                        className="form-input"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        style={{ width: 'auto' }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={loadData}>
                        Rechercher
                    </button>
                </div>
            )}

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <span>Chargement des données financières...</span>
                </div>
            ) : (
                <>
                    {/* Summary Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon green"><FiTrendingUp /></div>
                            <div className="stat-info">
                                <div className="stat-label">Total Ventes</div>
                                <div className="stat-value" style={{ fontSize: '22px', color: 'var(--success)' }}>
                                    {formatCurrency(totalVentes)}
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon purple"><FiDollarSign /></div>
                            <div className="stat-info">
                                <div className="stat-label">Compléments Trocs</div>
                                <div className="stat-value" style={{ fontSize: '22px', color: 'var(--accent-primary-hover)' }}>
                                    {formatCurrency(totalComps)}
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon orange"><FiTrendingUp /></div>
                            <div className="stat-info">
                                <div className="stat-label">Gains Trocs</div>
                                <div className="stat-value" style={{ fontSize: '22px', color: 'var(--warning)' }}>
                                    {formatCurrency(totalGains)}
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon cyan"><FiDollarSign /></div>
                            <div className="stat-info">
                                <div className="stat-label">Recettes Cumulées</div>
                                <div className="stat-value" style={{ fontSize: '22px' }}>
                                    {formatCurrency(grandTotal)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid-2" style={{ marginBottom: '24px' }}>
                        <div className="card">
                            <div className="card-header">
                                <div>
                                    <div className="card-title">Tendance des Recettes</div>
                                    <div className="card-subtitle">{periodLabels[period]}</div>
                                </div>
                            </div>
                            <FinanceRecettesChart data={financeData} />
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <div>
                                    <div className="card-title">Gains sur Trocs</div>
                                    <div className="card-subtitle">Marge par jour</div>
                                </div>
                            </div>
                            <FinanceGainsChart data={financeData} />
                        </div>
                    </div>


                    {/* Movements Table */}
                    <div className="section">
                        <h3 className="section-title">
                            Détail des Mouvements — {periodLabels[period]}
                        </h3>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Date & Heure</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                        <th>Montant</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.length === 0 ? (
                                        <tr>
                                            <td colSpan={4}>
                                                <div className="empty-state">
                                                    <div className="empty-state-icon">📊</div>
                                                    <div className="empty-state-text">Aucun mouvement sur cette période</div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        movements.map((m) => (
                                            <tr key={m.id}>
                                                <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                                                    {format(new Date(m.created_at), 'dd MMM yyyy HH:mm:ss', { locale: fr })}
                                                </td>
                                                <td>
                                                    <span className={`badge ${m.type === 'Vente' ? 'badge-success' : 'badge-purple'}`}>
                                                        {m.type}
                                                    </span>
                                                </td>
                                                <td style={{ color: 'var(--text-primary)' }}>{m.description}</td>
                                                <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                                                    {formatCurrency(m.amount)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {movements.length > 0 && (
                            <div style={{
                                textAlign: 'right', marginTop: '16px',
                                fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)'
                            }}>
                                Total : <span style={{ color: 'var(--success)' }}>{formatCurrency(grandTotal)}</span>
                            </div>
                        )}
                    </div>
                </>
            )
            }
        </div >
    );
}
