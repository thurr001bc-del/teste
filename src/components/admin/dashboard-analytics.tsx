"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, CalendarDays, CheckCircle2, CalendarRange, TrendingUp } from "lucide-react";
import { cn, formatBRL, formatDateShort, formatDateLong, todayISO, addDaysISO } from "@/lib/utils";
import { RevenueArea, AppointmentBars, ServiceDonut } from "@/components/admin/charts";

type Period = "dia" | "semanal" | "mensal" | "anual" | "personalizado";

const PERIODS: { key: Period; label: string }[] = [
  { key: "dia", label: "Dia" },
  { key: "semanal", label: "Semanal" },
  { key: "mensal", label: "Mensal" },
  { key: "anual", label: "Anual" },
  { key: "personalizado", label: "Personalizado" },
];

interface Analytics {
  from: string;
  to: string;
  appointments: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  revenue: number;
  servicesRevenue: number;
  productRevenue: number;
  itemsSold: number;
  avgTicket: number;
  transactionsIncome: number;
  transactionsExpense: number;
  netProfit: number;
  revenueSeries: { label: string; value: number }[];
  appointmentsSeries: { label: string; value: number }[];
  topServices: { name: string; value: number; revenue: number }[];
}

function rangeLabel(from: string, to: string): string {
  if (from === to) return formatDateLong(from);
  return `${formatDateShort(from)} – ${formatDateShort(to)}`;
}

export function DashboardAnalytics({ currency }: { currency: string }) {
  const [period, setPeriod] = useState<Period>("mensal");
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const [y, m] = todayISO().split("-");
    return `${y}-${m}-01`;
  });
  const [customTo, setCustomTo] = useState<string>(todayISO());
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ period });
    if (period === "personalizado") {
      params.set("from", customFrom);
      params.set("to", customTo);
    }
    fetch(`/api/analytics?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("analytics_failed");
        return r.json() as Promise<Analytics>;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [period, customFrom, customTo]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="flex items-center gap-1.5 text-sm text-foreground-muted">
          <CalendarRange className="h-4 w-4" /> {data ? rangeLabel(data.from, data.to) : "Carregando…"}
        </p>
        <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-surface-2/50 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                period === p.key ? "bg-accent text-accent-foreground shadow-sm" : "text-foreground-muted hover:bg-muted hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {period === "personalizado" && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface-2/40 p-3">
          <div>
            <label className="label">De</label>
            <input type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} className="input w-auto" />
          </div>
          <div>
            <label className="label">Até</label>
            <input type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} className="input w-auto" />
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Não foi possível carregar os indicadores do período. Atualize a página ou tente novamente em instantes.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Agendamentos" value={loading || !data ? "—" : data.appointments} icon={CalendarDays} accent="accent" />
        <StatCard label="Confirmados" value={loading || !data ? "—" : data.confirmed} icon={CheckCircle2} accent="success" hint={data ? `${data.pending} pendentes` : undefined} />
        <StatCard
          label="Faturamento total"
          value={loading || !data ? "—" : formatBRL(data.revenue, currency)}
          icon={DollarSign}
          accent="info"
          hint={data ? `Ticket médio ${formatBRL(data.avgTicket, currency)}` : undefined}
        />
        <StatCard label="Itens vendidos" value={loading || !data ? "—" : data.itemsSold} icon={ShoppingBag} accent="warning" />
        <StatCard
          label="Lucro líquido"
          value={loading || !data ? "—" : formatBRL(data.netProfit, currency)}
          icon={TrendingUp}
          accent={data && data.netProfit < 0 ? "warning" : "success"}
          hint={data ? `Ganhos ${formatBRL(data.transactionsIncome, currency)} · Gastos ${formatBRL(data.transactionsExpense, currency)}` : undefined}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Faturamento</h3>
            <span className="chip"><TrendingUp className="h-3.5 w-3.5 text-success" /> {data ? formatBRL(data.revenue, currency) : "—"}</span>
          </div>
          {loading || !data ? <div className="skeleton h-64 rounded-xl" /> : <RevenueArea data={data.revenueSeries} />}
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-foreground">Agendamentos</h3>
          {loading || !data ? <div className="skeleton h-64 rounded-xl" /> : <AppointmentBars data={data.appointmentsSeries} />}
        </div>
      </div>

      <div className="mt-6 card p-5">
        <h3 className="mb-4 font-semibold text-foreground">Serviços mais realizados</h3>
        {loading || !data ? (
          <div className="skeleton h-64 rounded-xl" />
        ) : data.topServices.length === 0 ? (
          <p className="py-6 text-center text-sm text-foreground-subtle">Nenhum serviço neste período.</p>
        ) : (
          <ServiceDonut data={data.topServices.map((s) => ({ name: s.name, value: s.value }))} />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent, hint }: { label: string; value: string | number; icon: any; accent: "info" | "success" | "warning" | "accent"; hint?: string }) {
  const accents = { info: "bg-info/10 text-info", success: "bg-success/10 text-success", warning: "bg-warning/10 text-warning", accent: "bg-accent-soft text-accent" } as const;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground-muted">{label}</p>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", accents[accent])}><Icon className="h-[18px] w-[18px]" /></span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-foreground-subtle">{hint}</p>}
    </div>
  );
}
