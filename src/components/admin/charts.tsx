"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useTheme } from "@/components/theme-provider";

const ACCENT = "hsl(var(--accent))";
const SUCCESS = "hsl(var(--success))";
const INFO = "hsl(var(--info))";
const WARNING = "hsl(var(--warning))";
const DANGER = "hsl(var(--danger))";
const MUTED = "hsl(var(--foreground-subtle))";
const GRID = "hsl(var(--border))";

function tooltipStyle() {
  return {
    contentStyle: {
      background: "hsl(var(--surface))",
      border: "1px solid hsl(var(--border))",
      borderRadius: 12,
      color: "hsl(var(--foreground))",
      fontSize: 12,
      boxShadow: "0 10px 30px -12px rgba(0,0,0,0.3)",
    },
    cursor: { fill: "hsl(var(--muted))" },
  };
}

export function RevenueArea({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="label" stroke={MUTED} fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke={MUTED} fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip {...tooltipStyle()} />
          <Area type="monotone" dataKey="value" stroke={ACCENT} strokeWidth={2.5} fill="url(#rev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AppointmentBars({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="label" stroke={MUTED} fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke={MUTED} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip {...tooltipStyle()} />
          <Bar dataKey="value" fill={INFO} radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ServiceDonut({ data }: { data: { name: string; value: number }[] }) {
  const colors = [ACCENT, SUCCESS, INFO, WARNING, DANGER];
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3} stroke="none">
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle()} />
          <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
