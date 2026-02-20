'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface FinanceEntry {
    date: string;
    ventes: number;
    trocs_complement: number;
    trocs_gain: number;
    total: number;
}

// Formate les FCFA en compact : 10 000 → 10k, 1 500 000 → 1,5M
const formatYAxis = (val: number): string => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toLocaleString('fr-FR')}M`;
    if (val >= 1_000) return `${(val / 1_000).toLocaleString('fr-FR')}k`;
    return String(val);
};

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
};

// Tooltip personnalisé : bulle noire "17/02 : 25 000 FCFA"
const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
}) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div style={{
            background: '#111',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 700, color: '#aaa' }}>{label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ margin: '2px 0', color: entry.color }}>
                    {entry.name} : <strong>{formatCurrency(entry.value)}</strong>
                </p>
            ))}
        </div>
    );
};

export default function FinanceGainsChart({ data }: { data: FinanceEntry[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="empty-state" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="empty-state-text">Aucune donnée pour cette période</div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={data}>
                    {/* Grille horizontale légèrement éclaircie */}
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} width={45} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                        dataKey="trocs_gain"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                        name="Gain Trocs"
                    />
                    <Bar
                        dataKey="total"
                        fill="rgba(99, 102, 241, 0.3)"
                        radius={[4, 4, 0, 0]}
                        name="Total Recettes"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
