"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3, CalendarRange, TrendingUp, Clock, CheckCircle2,
  DollarSign,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { cn, formatBRL } from "@/lib/utils";

type Period = "dia" | "semanal" | "mensal" | "anual" | "personalizado";

const PERIODS: { key: Period; label: string }[] = [
  { key: "dia", label: "Dia" },
  { key: "semanal", label: "Semanal" },
  { key: "mensal", label: "Mensal" },
  { key: "anual", label: "Anual" },
  { key: "personalizado", label: "Personalizado" },
];

interface BarberReport {
  id: string;
  name: string;
  photo?: string;
  active: boolean;
  totalApts: number;
  completedApts: number;
  confirmedApts: number;
  inProgressApts: number;
  requestedApts: number;
  cancelledApts: number;
  noShowApts: number;
  revenue: number;
  avgTicket: number;
  topServices: { name: string; value: number; revenue: number }[];
  dailySeries: { date: string; value: number }[];
  topHours: { hour: string; count: number }[];
}

interface ReportData {
  from: string;
  to: string;
  barbers: BarberReport[];
  comparison: { name: string; revenue: number; totalApts: number; completedApts: number; avgTicket: number }[];
  totalRevenue: number;
  totalAppointments: number;
}

function computeRange(period: Period, customFrom: string, customTo: string): { from: string; to: string } {
  const today = new Date().toISOString().slice(0, 10);
  switch (period) {
    case "dia":
      return { from: today, to: today };
    case "semanal": {
      const d = new Date(`${today}T00:00:00`);
      const diff = (d.getDay() + 6) % 7;
      const from = new Date(d);
      from.setDate(from.getDate() - diff);
      return { from: from.toISOString().slice(0, 10), to: today };
    }
    case "mensal": {
      const [y, m] = today.split("-");
      return { from: `${y}-${m}-01`, to: today };
    }
    case "anual": {
      const [y] = today.split("-");
      return { from: `${y}-01-01`, to: today };
    }
    case "personalizado":
    default:
      return { from: customFrom || today, to: customTo || today };
  }
}

function formatRange(from: string, to: string): string {
  if (from === to) return new Date(`${from}T00:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  const f = new Date(`${from}T00:00:00`);
  const t = new Date(`${to}T00:00:00`);
  return `${f.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${t.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
}

const COLORS = ["hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--info))", "hsl(var(--warning))", "hsl(var(--danger))"];

export default function RelatoriosPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("mensal");
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const [y, m] = new Date().toISOString().slice(0, 10).split("-");
    return `${y}-${m}-01`;
  });
  const [customTo, setCustomTo] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ period });
    if (period === "personalizado") {
      params.set("from", customFrom);
      params.set("to", customTo);
    }
    try {
      const res = await fetch(`/api/reports/barbers?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(null);
        setError(true);
      }
    } catch {
      setData(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => { load(); }, [load]);

  const filteredBarbers = useMemo(() => {
    if (!data) return [];
    if (!selectedBarber) return data.barbers;
    return data.barbers.filter((b) => b.id === selectedBarber);
  }, [data, selectedBarber]);

  const topPerformer = useMemo(() => {
    if (!data || data.barbers.length === 0) return null;
    return data.barbers.reduce((best, b) => (b.revenue > best.revenue ? b : best), data.barbers[0]);
  }, [data]);

  const completionRate = useMemo(() => {
    if (!data) return 0;
    const total = data.totalAppointments;
    if (total === 0) return 0;
    const completed = data.barbers.reduce((s, b) => s + b.completedApts, 0);
    return Math.round((completed / total) * 100);
  }, [data]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Relatórios por Barbeiro</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground-muted">
            <CalendarRange className="h-4 w-4" /> {data ? formatRange(data.from, data.to) : "Carregando…"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
      </div>

      {period === "personalizado" && (
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface-2/40 p-3">
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

      {error && !loading && (
        <p className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Não foi possível carregar os relatórios. Atualize a página ou tente novamente em instantes.
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Faturamento total" value={formatBRL(data.totalRevenue)} icon={DollarSign} accent="info" />
            <StatCard label="Total de agendamentos" value={data.totalAppointments} icon={CalendarRange} accent="accent" />
            <StatCard label="Taxa de conclusão" value={`${completionRate}%`} icon={CheckCircle2} accent="success" />
            <StatCard label="Destaque" value={topPerformer ? topPerformer.name : "—"} icon={TrendingUp} accent="warning" hint={topPerformer ? `R$ ${topPerformer.revenue.toFixed(2)} em serviços` : undefined} />
          </div>

          <div className="mb-6 card overflow-hidden p-0">
            <div className="border-b border-border px-5 py-4">
              <h3 className="font-semibold text-foreground">Comparativo de desempenho por barbeiro</h3>
              <p className="text-xs text-foreground-subtle">Receita, atendimentos e ticket médio no período</p>
            </div>
            <div className="p-5">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.comparison} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground-subtle))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--foreground-subtle))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--surface))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        color: "hsl(var(--foreground))",
                        fontSize: 12,
                        boxShadow: "0 10px 30px -12px rgba(0,0,0,0.3)",
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "revenue") return [formatBRL(value), "Receita"];
                        if (name === "avgTicket") return [formatBRL(value), "Ticket médio"];
                        return [value, name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--foreground-subtle))" }} iconType="circle" />
                    <Bar dataKey="revenue" name="Receita" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    <Bar dataKey="avgTicket" name="Ticket médio" fill="hsl(var(--info))" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Desempenho individual</h3>
              {data.barbers.length > 1 && (
                <select
                  value={selectedBarber || ""}
                  onChange={(e) => setSelectedBarber(e.target.value || null)}
                  className="input w-auto py-1.5 text-sm"
                >
                  <option value="">Todos os barbeiros</option>
                  {data.barbers.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredBarbers.map((barber) => (
                <div
                  key={barber.id}
                  className={cn("card overflow-hidden p-0 transition-all duration-300", !barber.active && "opacity-70")}
                >
                  <div className="border-b border-border px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent font-bold text-sm">
                        {barber.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{barber.name}</p>
                        <div className="flex items-center gap-2">
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", barber.active ? "bg-success/10 text-success" : "bg-muted text-foreground-subtle")}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", barber.active ? "bg-success" : "bg-foreground-subtle")} />
                            {barber.active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border bg-surface-2/40 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-foreground-subtle">Receita</p>
                        <p className="mt-1 font-display text-lg font-bold text-foreground">{formatBRL(barber.revenue)}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-surface-2/40 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-foreground-subtle">Atendimentos</p>
                        <p className="mt-1 font-display text-lg font-bold text-foreground">{barber.totalApts}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-surface-2/40 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-foreground-subtle">Ticket médio</p>
                        <p className="mt-1 font-display text-lg font-bold text-foreground">{formatBRL(barber.avgTicket)}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-surface-2/40 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-foreground-subtle">Concluídos</p>
                        <p className="mt-1 font-display text-lg font-bold text-success">{barber.completedApts}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">Status dos agendamentos</p>
                      <div className="space-y-2">
                        <StatusBar label="Confirmados" value={barber.confirmedApts} total={barber.totalApts} color="hsl(var(--info))" />
                        <StatusBar label="Em atendimento" value={barber.inProgressApts} total={barber.totalApts} color="hsl(var(--warning))" />
                        <StatusBar label="Pendentes" value={barber.requestedApts} total={barber.totalApts} color="hsl(var(--accent))" />
                        <StatusBar label="Cancelados" value={barber.cancelledApts} total={barber.totalApts} color="hsl(var(--danger))" />
                        <StatusBar label="Não compareceu" value={barber.noShowApts} total={barber.totalApts} color="hsl(var(--foreground-subtle))" />
                      </div>
                    </div>

                    {barber.topServices.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">Serviços mais realizados</p>
                        <div className="space-y-2">
                          {barber.topServices.slice(0, 3).map((svc, i) => (
                            <div key={svc.name} className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-foreground-muted">{i + 1}</span>
                              <span className="flex-1 truncate text-xs text-foreground">{svc.name}</span>
                              <span className="text-xs font-semibold text-foreground">{svc.value}x</span>
                              <span className="w-16 text-right text-[10px] text-foreground-muted">{formatBRL(svc.revenue)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {barber.topHours.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">Horários mais movimentados</p>
                        <div className="flex flex-wrap gap-1.5">
                          {barber.topHours.map((h) => (
                            <span key={h.hour} className="chip text-[11px]">
                              <Clock className="h-3 w-3" /> {h.hour} ({h.count})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
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

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-foreground-muted">{label}</span>
        <span className="text-xs font-semibold text-foreground">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
