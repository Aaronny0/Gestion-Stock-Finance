'use client';

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface FinanceEntry {
    date: string;
    ventes: number;
    trocs_complement: number;
    trocs_gain: number;
    total: number;
}

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
};

export default function FinanceRecettesChart({ data }: { data: FinanceEntry[] }) {
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
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="ventes"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Ventes"
                    />
                    <Line
                        type="monotone"
                        dataKey="trocs_complement"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Compléments Trocs"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
