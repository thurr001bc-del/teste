"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Copy, Phone, Check, Loader2, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { StatusBadge, STATUS_META } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/toast";
import { cn, formatBRL, formatDateLong, weekdayLabel } from "@/lib/utils";
import { AppointmentWithRelations, AppointmentStatus } from "@/lib/types";

const FILTERS: { value: AppointmentStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "requested", label: "Pendentes" },
  { value: "confirmed", label: "Confirmados" },
  { value: "in_progress", label: "Em atendimento" },
  { value: "completed", label: "Atendidos" },
  { value: "cancelled", label: "Cancelados" },
];

const STATUS_ACTIONS: { status: AppointmentStatus; label: string; cls: string }[] = [
  { status: "confirmed", label: "Confirmar", cls: "bg-success text-success hover:bg-success/15" },
  { status: "in_progress", label: "Em atendimento", cls: "bg-info text-info hover:bg-info/15" },
  { status: "completed", label: "Atendido", cls: "bg-accent text-accent hover:bg-accent/15" },
  { status: "cancelled", label: "Cancelar", cls: "bg-danger text-danger hover:bg-danger/15" },
];

export default function AgendamentosPage() {
  const { toast } = useToast();
  const [appts, setAppts] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AppointmentStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AppointmentWithRelations | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/appointments");
    const d = await res.json();
    setAppts(d.appointments);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return appts
      .filter((a) => (filter === "all" ? true : a.status === filter))
      .filter((a) => (query ? a.customerName.toLowerCase().includes(query.toLowerCase()) || a.barber.name.toLowerCase().includes(query.toLowerCase()) : true))
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  }, [appts, filter, query]);

  function changeStatus(id: string, status: AppointmentStatus) {
    fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
      .then(() => {
        setAppts((prev) => prev.map((a) => (a.id === id ? ({ ...a, status } as any) : a)));
        setSelected((s) => (s && s.id === id ? ({ ...s, status } as any) : s));
        toast({ title: "Status atualizado", variant: "success" });
      })
      .catch(() => toast({ title: "Erro ao atualizar", variant: "error" }));
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Agendamentos</h1>
          <p className="mt-1 text-sm text-foreground-muted">{appts.length} registros no total.</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente ou barbeiro..." className="input pl-9" />
        </div>
      </div>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={cn("chip whitespace-nowrap transition", filter === f.value ? "border-accent bg-accent-soft text-accent" : "hover:bg-muted")}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Serviço</th>
                <th className="px-4 py-3 font-semibold">Barbeiro</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Horário</th>
                <th className="px-4 py-3 font-semibold">Valor</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="skeleton h-6 rounded-lg" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-foreground-subtle">Nenhum agendamento encontrado.</td></tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} onClick={() => setSelected(a)} className="cursor-pointer border-b border-border last:border-0 transition hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-foreground">{a.customerName}</td>
                    <td className="px-4 py-3 text-foreground-muted">{a.service.name}</td>
                    <td className="px-4 py-3 text-foreground-muted">{a.barber.name}</td>
                    <td className="px-4 py-3 text-foreground-muted">{formatDateLong(a.date)}</td>
                    <td className="px-4 py-3 text-foreground-muted">{a.startTime}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatBRL(a.price)}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalhes do agendamento" size="lg"
        footer={<button onClick={() => setSelected(null)} className="btn-ghost">Fechar</button>}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2/40 p-4">
              <Avatar name={selected.customerName} size="lg" />
              <div>
                <p className="text-lg font-semibold text-foreground">{selected.customerName}</p>
                <p className="text-sm text-foreground-muted">{selected.customerPhone}</p>
              </div>
              <div className="ml-auto"><StatusBadge status={selected.status} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Cell label="Serviço" value={selected.service.name} />
              <Cell label="Profissional" value={selected.barber.name} />
              <Cell label="Data" value={`${weekdayLabel(selected.date)}, ${formatDateLong(selected.date)}`} />
              <Cell label="Horário" value={`${selected.startTime}–${selected.endTime}`} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/40 px-4 py-3">
              <span className="font-display text-xl font-bold text-foreground">{formatBRL(selected.price)}</span>
              <div className="flex gap-2">
                <a href={`https://wa.me/${selected.customerPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn-outline"><Phone className="h-4 w-4" /> WhatsApp</a>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/confirmar/${selected.token}`); toast({ title: "Link copiado", variant: "success" }); }} className="btn-outline"><Copy className="h-4 w-4" /> Link</button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Atualizar status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_ACTIONS.map((a) => (
                  <button key={a.status} onClick={() => changeStatus(selected.id, a.status)} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition", a.cls)}>{a.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-[11px] uppercase tracking-wide text-foreground-subtle">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
