'use client';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

interface ChartData {
    date: string;
    ventes: number;
    trocs: number;
}

export default function DashboardChart({ data }: { data: ChartData[] }) {
    return (
        <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="gradVentes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradTrocs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Area
                        type="monotone"
                        dataKey="ventes"
                        stroke="#6366f1"
                        fill="url(#gradVentes)"
                        strokeWidth={2}
                        name="Ventes"
                    />
                    <Area
                        type="monotone"
                        dataKey="trocs"
                        stroke="#8b5cf6"
                        fill="url(#gradTrocs)"
                        strokeWidth={2}
                        name="Trocs"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
