"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import { money } from "./accounting";
export function RevenueChart({
  rows,
  currency,
  margin = true,
  onSelect,
}: {
  rows: { date: string; revenue: number; margin: number }[];
  currency: string;
  margin?: boolean;
  onSelect?: (date: string) => void;
}) {
  return (
    <div
      className="chart-area"
      role="img"
      aria-label="Évolution du chiffre d’affaires et de la marge sur la période"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={rows}
          margin={{ top: 15, right: 8, left: 0, bottom: 0 }}
          onClick={(event) => {
            if (event?.activeLabel) onSelect?.(String(event.activeLabel));
          }}
        >
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#ececf3"
            vertical={false}
            strokeDasharray="4 4"
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#475569" }}
            tickFormatter={(v) =>
              String(v).slice(8) + "/" + String(v).slice(5, 7)
            }
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#475569" }}
            tickFormatter={(v) =>
              v >= 1000000 ? `${v / 1000000} M` : `${v / 1000} k`
            }
          />
          <Tooltip formatter={(value) => money(Number(value), currency)} />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="revenue"
            name="Chiffre d’affaires"
            stroke="#4F46E5"
            strokeWidth={3}
            fill="url(#revenue-fill)"
          />
          {margin && (
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="margin"
              name="Marge brute"
              stroke="#39b7a2"
              strokeWidth={2}
              fill="transparent"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function RankingChart({
  rows,
  currency,
  onSelect,
}: {
  rows: { label: string; value: number }[];
  currency: string;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="chart-area">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ left: 20, right: 20 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={90}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip formatter={(v) => money(Number(v), currency)} />
          <Bar
            isAnimationActive={false}
            dataKey="value"
            name="Chiffre d’affaires"
            fill="#7868e7"
            radius={[0, 5, 5, 0]}
            onClick={(_entry, index) => {
              const row = rows[index];
              if (row) onSelect(row.label);
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
