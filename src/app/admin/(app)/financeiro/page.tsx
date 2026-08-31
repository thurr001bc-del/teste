"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DollarSign, ShoppingBag, Clock, CheckCircle2, CalendarRange, TrendingUp, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useToast } from "@/components/toast";
import { cn, formatBRL, formatDateShort, formatDateLong, todayISO, addDaysISO } from "@/lib/utils";
import { CashFlowProvider, CashFlowPanel } from "@/components/admin/cash-flow";

interface OrderItem { name: string; qty: number; price: number; }
interface Order { id: string; customerName: string; customerPhone?: string; items: OrderItem[]; total: number; status: string; createdAt: string; }
interface Transaction { id: string; barbershopId: string; type: "income" | "expense"; description: string; amount: number; date: string; createdAt: string; }

const STATUS_LABEL: Record<string, string> = { reserved: "Reservado", paid: "Pago", fulfilled: "Entregue", cancelled: "Cancelado" };
const STATUS_CLS: Record<string, string> = { reserved: "bg-warning/10 text-warning", paid: "bg-info/10 text-info", fulfilled: "bg-success/10 text-success", cancelled: "bg-danger/10 text-danger" };

type Period = "dia" | "semanal" | "mensal" | "anual" | "personalizado";

const PERIODS: { key: Period; label: string }[] = [
  { key: "dia", label: "Dia" },
  { key: "semanal", label: "Semanal" },
  { key: "mensal", label: "Mensal" },
  { key: "anual", label: "Anual" },
  { key: "personalizado", label: "Personalizado" },
];

function computeRange(period: Period, customFrom: string, customTo: string): { from: string; to: string } {
  const today = todayISO();
  switch (period) {
    case "dia":
      return { from: today, to: today };
    case "semanal": {
      const d = new Date(`${today}T00:00:00`);
      const diff = (d.getDay() + 6) % 7;
      return { from: addDaysISO(today, -diff), to: today };
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

function rangeLabel(from: string, to: string): string {
  if (from === to) return formatDateLong(from);
  return `${formatDateShort(from)} – ${formatDateShort(to)}`;
}

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("mensal");
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const [y, m] = todayISO().split("-");
    return `${y}-${m}-01`;
  });
  const [customTo, setCustomTo] = useState<string>(todayISO());

  const load = useCallback(async () => {
    const [o, t] = await Promise.all([fetch("/api/orders"), fetch("/api/transactions")]);
    const od = await o.json();
    const td = await t.json();
    setOrders(od.orders);
    setTransactions(td.transactions || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const { from, to } = useMemo(() => computeRange(period, customFrom, customTo), [period, customFrom, customTo]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const day = o.createdAt.slice(0, 10);
      return day >= from && day <= to;
    });
  }, [orders, from, to]);

  const revenue = filtered.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const paid = filtered.filter((o) => o.status === "paid" || o.status === "fulfilled").reduce((s, o) => s + o.total, 0);
  const pending = filtered.filter((o) => o.status === "reserved").reduce((s, o) => s + o.total, 0);
  const sold = filtered.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.items.reduce((x, i) => x + i.qty, 0), 0);

  const periodTx = transactions.filter((t) => t.date >= from && t.date <= to);
  const ganhos = periodTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const gastos = periodTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const lucro = revenue + ganhos - gastos;

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) { setOrders((prev) => prev.map((o) => (o.id === id ? ({ ...o, status } as Order) : o))); toast({ title: "Pedido atualizado", variant: "success" }); }
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Financeiro</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground-muted">
            <CalendarRange className="h-4 w-4" /> {rangeLabel(from, to)}
          </p>
        </div>

        <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-surface-2/50 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                period === p.key
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-foreground-muted hover:bg-muted hover:text-foreground",
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Faturamento total" value={formatBRL(revenue)} icon={DollarSign} accent="info" hint={`${filtered.length} pedidos no período`} />
        <Card label="Recebido" value={formatBRL(paid)} icon={CheckCircle2} accent="success" />
        <Card label="Pendente" value={formatBRL(pending)} icon={Clock} accent="warning" />
        <Card label="Itens vendidos" value={sold} icon={ShoppingBag} accent="accent" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card label="Ganhos (manuais)" value={formatBRL(ganhos)} icon={ArrowDownLeft} accent="success" hint={`${periodTx.filter((t) => t.type === "income").length} registros`} />
        <Card label="Gastos (manuais)" value={formatBRL(gastos)} icon={ArrowUpRight} accent="warning" hint={`${periodTx.filter((t) => t.type === "expense").length} registros`} />
        <Card label="Lucro líquido" value={formatBRL(lucro)} icon={TrendingUp} accent={lucro < 0 ? "warning" : "success"} hint={`Faturamento ${formatBRL(revenue)} + ganhos − gastos`} />
      </div>

      <div className="mt-6 card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Itens</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="skeleton h-6 rounded-lg" /></td></tr>)
                : filtered.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3"><p className="font-medium text-foreground">{o.customerName}</p><p className="text-xs text-foreground-subtle">{o.id}</p></td>
                    <td className="px-4 py-3 text-foreground-muted">{o.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatBRL(o.total)}</td>
                    <td className="px-4 py-3 text-foreground-muted">{new Date(o.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_CLS[o.status])}>{STATUS_LABEL[o.status]}</span></td>
                    <td className="px-4 py-3">
                      <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="input w-auto py-1.5 text-xs">
                        <option value="reserved">Reservado</option>
                        <option value="paid">Pago</option>
                        <option value="fulfilled">Entregue</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-foreground-subtle">Nenhuma venda neste período.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <CashFlowProvider>
        <CashFlowPanel currency="R$" from={from} to={to} />
      </CashFlowProvider>
    </div>
  );
}

function Card({ label, value, icon: Icon, accent, hint }: { label: string; value: string | number; icon: any; accent: "info" | "success" | "warning" | "accent"; hint?: string }) {
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
