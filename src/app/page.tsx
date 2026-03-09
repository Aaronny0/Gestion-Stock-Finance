'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import {
    FiPackage, FiShoppingCart, FiRepeat, FiDollarSign,
    FiTrendingUp, FiArrowUpRight, FiArrowDownRight
} from 'react-icons/fi';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

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

const fetchDashboardData = async () => {
    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();
    const weekAgoStart = startOfDay(subDays(today, 6)).toISOString();

    const [
        productsRes,
        salesTodayRes,
        trocsRes,
        receiptRes,
        weekSalesRes,
        weekTradesRes,
        recentSalesRes,
        recentTradesRes,
    ] = await Promise.all([
        supabase.from('products').select('quantity').eq('active', true),
        supabase.from('sales').select('total_price').gte('created_at', todayStart).lte('created_at', todayEnd),
        supabase.from('trades').select('id, client_complement').gte('created_at', todayStart).lte('created_at', todayEnd),
        supabase.from('daily_receipts').select('total_amount').eq('receipt_date', format(today, 'yyyy-MM-dd')),
        supabase.from('sales').select('created_at').gte('created_at', weekAgoStart).lte('created_at', todayEnd),
        supabase.from('trades').select('created_at').gte('created_at', weekAgoStart).lte('created_at', todayEnd),
        supabase.from('sales').select('id, total_price, created_at, products(model, brands(name))').order('created_at', { ascending: false }).limit(5),
        supabase.from('trades').select('id, client_phone_brand, client_phone_model, trade_gain, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    if (productsRes.error) throw productsRes.error;
    if (salesTodayRes.error) throw salesTodayRes.error;
    if (trocsRes.error) throw trocsRes.error;
    if (receiptRes.error) throw receiptRes.error;
    if (weekSalesRes.error) throw weekSalesRes.error;
    if (weekTradesRes.error) throw weekTradesRes.error;
    if (recentSalesRes.error) throw recentSalesRes.error;
    if (recentTradesRes.error) throw recentTradesRes.error;

    const products = productsRes.data ?? [];
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0);

    const salesTodayData = salesTodayRes.data ?? [];
    const salesToday = salesTodayData.length;
    const revenuToday = salesTodayData.reduce((sum, s) => sum + Number(s.total_price || 0), 0);

    const trocsTodayData = trocsRes.data ?? [];
    const trocsToday = trocsTodayData.length;
    const trocsComplement = trocsTodayData.reduce((sum, t) => sum + Number(t.client_complement || 0), 0);
    
    let recetteToday = receiptRes.data?.[0]?.total_amount;
    if (recetteToday === undefined || recetteToday === null) {
        recetteToday = revenuToday + trocsComplement;
    }

    const salesByDay: Record<string, number> = {};
    const tradesByDay: Record<string, number> = {};

    (weekSalesRes.data ?? []).forEach((s) => {
        const day = format(new Date(s.created_at), 'yyyy-MM-dd');
        salesByDay[day] = (salesByDay[day] || 0) + 1;
    });
    (weekTradesRes.data ?? []).forEach((t) => {
        const day = format(new Date(t.created_at), 'yyyy-MM-dd');
        tradesByDay[day] = (tradesByDay[day] || 0) + 1;
    });

    const chartPoints: SalesChartData[] = [];
    for (let i = 6; i >= 0; i--) {
        const day = subDays(today, i);
        const dayKey = format(day, 'yyyy-MM-dd');
        chartPoints.push({
            date: format(day, 'EEE dd', { locale: fr }),
            ventes: salesByDay[dayKey] || 0,
            trocs: tradesByDay[dayKey] || 0,
        });
    }

    const recentActivities: RecentActivity[] = [];
    (recentSalesRes.data ?? []).forEach((s: Record<string, unknown>) => {
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

    (recentTradesRes.data ?? []).forEach((t: Record<string, unknown>) => {
        recentActivities.push({
            id: t.id as string,
            type: 'trade',
            description: `Troc: ${t.client_phone_brand} ${t.client_phone_model}`,
            amount: Number(t.trade_gain) || null,
            created_at: t.created_at as string,
        });
    });

    recentActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
        stats: { totalProducts, totalStock, salesToday, revenuToday, trocsToday, recetteToday },
        chartData: chartPoints,
        activities: recentActivities.slice(0, 8)
    };
};

export default function DashboardPage() {
    const { data, isLoading, error } = useSWR('dashboardData', fetchDashboardData, {
        refreshInterval: 60000, // Refresh automatically every minute
        revalidateOnFocus: true
    });

    if (isLoading || error || !data) {
        return <DashboardSkeleton />;
    }

    const { stats, chartData, activities } = data;

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
                <div className="card">
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
                </div>
            </div>
        </div>
    );
}
