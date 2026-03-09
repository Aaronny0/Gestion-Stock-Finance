'use client';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface ChartData {
    date: string;
    ventes: number;
    trocs: number;
}

// Couleurs fixes – visibles en mode clair ET sombre
const VENTES_COLOR = '#16a34a';   // vert saturé
const TROCS_COLOR  = '#92400e';   // brun foncé (visible sur fond clair & sombre)

// Couleurs alternatives pour s'assurer de la lisibilité
const VENTES_COLOR_LIGHT = '#15803d'; // vert foncé pour mode clair
const TROCS_COLOR_LIGHT  = '#78350f'; // brun plus foncé pour mode clair

export default function DashboardChart({ data }: { data: ChartData[] }) {
    return (
        <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="gradVentes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={VENTES_COLOR} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={VENTES_COLOR} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradTrocs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={TROCS_COLOR} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={TROCS_COLOR} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{
                            background: '#111',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#fff',
                        }}
                    />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey="ventes"
                        stroke={VENTES_COLOR}
                        fill="url(#gradVentes)"
                        strokeWidth={2.5}
                        name="Ventes"
                        dot={{ r: 3, fill: VENTES_COLOR }}
                    />
                    <Area
                        type="monotone"
                        dataKey="trocs"
                        stroke={TROCS_COLOR}
                        fill="url(#gradTrocs)"
                        strokeWidth={2.5}
                        name="Trocs"
                        dot={{ r: 3, fill: TROCS_COLOR }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
