import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getDashboard } from "@/lib/queries";
import { getDB } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { DashboardAnalytics } from "@/components/admin/dashboard-analytics";
import { CashFlowProvider, CashFlowPanel, CashFlowTrigger } from "@/components/admin/cash-flow";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatBRL, formatDateShort, weekdayLabel } from "@/lib/utils";

export default function DashboardPage() {
  const session = getSession()!;
  const db = getDB();
  const shop = db.barbershops.find((b) => b.id === session.barbershopId)!;
  const m = getDashboard(session.barbershopId);
  const cur = shop.settings.currency;

  return (
    <CashFlowProvider>
      <div>
        <PageHeader
          title={`Olá, ${session.name.split(" ")[0]} 👋`}
          description="Visão geral da sua barbearia."
          actions={
            <>
              <Link href="/admin/agenda" className="btn-primary">
                <CalendarDays className="h-4 w-4" /> Abrir agenda
              </Link>
              <CashFlowTrigger />
            </>
          }
        />

      <DashboardAnalytics currency={cur} />

      <CashFlowPanel currency={cur} />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Próximos horários</h3>
            <Link href="/admin/agenda" className="text-sm font-medium text-accent">Ver agenda <ArrowRight className="inline h-3.5 w-3.5" /></Link>
          </div>
          <div className="space-y-2">
            {m.upcoming.length === 0 && <p className="py-6 text-center text-sm text-foreground-subtle">Nenhum horário próximo.</p>}
            {m.upcoming.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/40 px-3.5 py-2.5">
                <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <span className="text-[10px] font-semibold leading-none">{weekdayLabel(a.date).slice(0, 3)}</span>
                  <span className="text-xs font-bold">{a.startTime}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{a.customerName}</p>
                  <p className="truncate text-xs text-foreground-muted">{a.service.name} · {a.barber.name}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-foreground">Produtos mais vendidos</h3>
          <div className="space-y-3">
            {m.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground-muted">{i + 1}</span>
                <span className="flex-1 text-sm text-foreground">{p.name}</span>
                <span className="text-sm font-semibold text-foreground">{p.value} un.</span>
                <span className="w-24 text-right text-sm text-foreground-muted">{formatBRL(p.revenue, cur)}</span>
              </div>
            ))}
            {m.topProducts.length === 0 && <p className="py-4 text-center text-sm text-foreground-subtle">Sem vendas ainda.</p>}
          </div>
        </div>
      </div>
    </div>
  </CashFlowProvider>
  );
}
