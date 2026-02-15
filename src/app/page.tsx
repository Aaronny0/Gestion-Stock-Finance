'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    FiPackage, FiShoppingCart, FiRepeat, FiDollarSign,
    FiTrendingUp, FiArrowUpRight, FiArrowDownRight
} from 'react-icons/fi';
import dynamic from 'next/dynamic';

const DashboardChart = dynamic(() => import('@/components/charts/DashboardChart'), { ssr: false });
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashStats {
    totalProducts: number;
    totalStock: number;
    salesToday: number;
    revenuToday: number;
    trocsToday: number;
    recetteToday: number;
}

interface SalesChartData {
    date: string;
    ventes: number;
    trocs: number;
}

interface RecentActivity {
    id: string;
    type: 'sale' | 'trade' | 'entry';
    description: string;
    amount: number | null;
    created_at: string;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashStats>({
        totalProducts: 0, totalStock: 0, salesToday: 0,
        revenuToday: 0, trocsToday: 0, recetteToday: 0
    });
    const [chartData, setChartData] = useState<SalesChartData[]>([]);
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            const today = new Date();
            const todayStart = startOfDay(today).toISOString();
            const todayEnd = endOfDay(today).toISOString();

            // Total products & stock
            const { data: products } = await supabase
                .from('products')
                .select('quantity');

            const totalProducts = products?.length || 0;
            const totalStock = products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0;

            // Today's sales
            const { data: salesTodayData } = await supabase
                .from('sales')
                .select('total_price')
                .gte('created_at', todayStart)
                .lte('created_at', todayEnd);

            const salesToday = salesTodayData?.length || 0;
            const revenuToday = salesTodayData?.reduce((sum, s) => sum + Number(s.total_price || 0), 0) || 0;

            // Today's trades
            const { data: trocsData } = await supabase
                .from('trades')
                .select('id')
                .gte('created_at', todayStart)
                .lte('created_at', todayEnd);

            const trocsToday = trocsData?.length || 0;

            // Today's receipts
            const { data: receiptData } = await supabase
                .from('daily_receipts')
                .select('total_amount')
                .eq('receipt_date', format(today, 'yyyy-MM-dd'));

            const recetteToday = receiptData?.[0]?.total_amount || 0;

            setStats({ totalProducts, totalStock, salesToday, revenuToday, trocsToday, recetteToday });

            // Chart data for last 7 days
            const chartPoints: SalesChartData[] = [];
            for (let i = 6; i >= 0; i--) {
                const day = subDays(today, i);
                const dayStart = startOfDay(day).toISOString();
                const dayEnd = endOfDay(day).toISOString();

                const { data: daySales } = await supabase
                    .from('sales')
                    .select('id')
                    .gte('created_at', dayStart)
                    .lte('created_at', dayEnd);

                const { data: dayTrades } = await supabase
                    .from('trades')
                    .select('id')
                    .gte('created_at', dayStart)
                    .lte('created_at', dayEnd);

                chartPoints.push({
                    date: format(day, 'EEE dd', { locale: fr }),
                    ventes: daySales?.length || 0,
                    trocs: dayTrades?.length || 0,
                });
            }
            setChartData(chartPoints);

            // Recent activities
            const recentActivities: RecentActivity[] = [];

            const { data: recentSales } = await supabase
                .from('sales')
                .select('id, total_price, created_at, products(model, brands(name))')
                .order('created_at', { ascending: false })
                .limit(5);

            recentSales?.forEach((s: Record<string, unknown>) => {
                const product = s.products as Record<string, unknown> | null;
                const brand = product?.brands as Record<string, unknown> | null;
                recentActivities.push({
                    id: s.id as string,
                    type: 'sale',
                    description: `Vente: ${brand?.name || ''} ${product?.model || ''}`,
                    amount: Number(s.total_price) || null,
                    created_at: s.created_at as string,
                });
            });

            const { data: recentTrades } = await supabase
                .from('trades')
                .select('id, client_phone_brand, client_phone_model, trade_gain, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            recentTrades?.forEach((t: Record<string, unknown>) => {
                recentActivities.push({
                    id: t.id as string,
                    type: 'trade',
                    description: `Troc: ${t.client_phone_brand} ${t.client_phone_model}`,
                    amount: Number(t.trade_gain) || null,
                    created_at: t.created_at as string,
                });
            });

            recentActivities.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setActivities(recentActivities.slice(0, 8));

        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <span>Chargement du tableau de bord...</span>
            </div>
        );
    }

    return (
        <div className="animate-in">
            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple"><FiPackage /></div>
                    <div className="stat-info">
                        <div className="stat-label">Produits en Stock</div>
                        <div className="stat-value">{stats.totalStock}</div>
                        <div className="stat-change positive">
                            {stats.totalProducts} références
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green"><FiShoppingCart /></div>
                    <div className="stat-info">
                        <div className="stat-label">Ventes Aujourd&apos;hui</div>
                        <div className="stat-value">{stats.salesToday}</div>
                        <div className="stat-change positive">
                            <FiArrowUpRight /> {formatCurrency(stats.revenuToday)}
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orange"><FiRepeat /></div>
                    <div className="stat-info">
                        <div className="stat-label">Trocs Aujourd&apos;hui</div>
                        <div className="stat-value">{stats.trocsToday}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon cyan"><FiDollarSign /></div>
                    <div className="stat-info">
                        <div className="stat-label">Recette du Jour</div>
                        <div className="stat-value" style={{ fontSize: '22px' }}>
                            {formatCurrency(Number(stats.recetteToday))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts & Activity */}
            <div className="grid-2">
                {/* Sales Chart */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Activité (7 derniers jours)</div>
                            <div className="card-subtitle">Ventes et trocs quotidiens</div>
                        </div>
                    </div>
                    <DashboardChart data={chartData} />
                </div>

                {/* Recent Activity */}
                < div className="card" >
                    <div className="card-header">
                        <div>
                            <div className="card-title">Activité Récente</div>
                            <div className="card-subtitle">Dernières transactions</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activities.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📊</div>
                                <div className="empty-state-text">Aucune activité récente</div>
                                <div className="empty-state-sub">Les transactions apparaîtront ici</div>
                            </div>
                        ) : (
                            activities.map((act) => (
                                <div
                                    key={act.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 12px',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'var(--bg-tertiary)',
                                        gap: '12px',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span
                                            className={`badge ${act.type === 'sale'
                                                ? 'badge-success'
                                                : act.type === 'trade'
                                                    ? 'badge-purple'
                                                    : 'badge-info'
                                                }`}
                                        >
                                            {act.type === 'sale' ? 'Vente' : act.type === 'trade' ? 'Troc' : 'Entrée'}
                                        </span>
                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {act.description}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {act.amount !== null && (
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {formatCurrency(act.amount)}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {format(new Date(act.created_at), 'HH:mm', { locale: fr })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div >
            </div >
        </div >
    );
}
