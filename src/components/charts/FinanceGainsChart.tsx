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

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
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
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                    />
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
