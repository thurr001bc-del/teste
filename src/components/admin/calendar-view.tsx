"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, Clock, User, Scissors,
  Copy, Check, Phone, Loader2, X, Filter,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { StatusBadge, STATUS_META } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/toast";
import { useCart } from "@/components/site/cart-context";
import { cn, formatBRL, formatDateLong, weekdayLabel, timeToMinutes, minutesToTime, addDaysISO, todayISO, initials } from "@/lib/utils";
import { AppointmentWithRelations, AppointmentStatus, Barbershop, Barber, Service } from "@/lib/types";

const PX = 1.15;

const BLOCK: Record<AppointmentStatus, string> = {
  requested: "border-l-warning bg-warning/10",
  confirmed: "border-l-success bg-success/10",
  in_progress: "border-l-info bg-info/10",
  completed: "border-l-accent bg-accent/10",
  rescheduled: "border-l-warning bg-warning/10",
  cancelled: "border-l-danger bg-danger/10 opacity-70",
  no_show: "border-l-danger bg-danger/10 opacity-70",
};

const STATUS_ACTIONS: { status: AppointmentStatus; label: string; cls: string }[] = [
  { status: "confirmed", label: "Confirmar", cls: "bg-success text-success hover:bg-success/15" },
  { status: "in_progress", label: "Em atendimento", cls: "bg-info text-info hover:bg-info/15" },
  { status: "completed", label: "Atendido", cls: "bg-accent text-accent hover:bg-accent/15" },
  { status: "cancelled", label: "Cancelar", cls: "bg-danger text-danger hover:bg-danger/15" },
];

function dayHours(shop: Barbershop, iso: string) {
  const dow = new Date(`${iso}T00:00:00`).getDay();
  const h = shop.businessHours.find((d) => d.day === dow);
  if (!h || !h.enabled) return null;
  return h;
}

export function CalendarView({
  shop,
  barbers,
  services,
  initial,
}: {
  shop: Barbershop;
  barbers: Barber[];
  services: Service[];
  initial: AppointmentWithRelations[];
}) {
  const { toast } = useToast();
  const today = todayISO();
  const [mode, setMode] = useState<"day" | "week" | "month">("week");
  const [cursor, setCursor] = useState(today);
  const [appts, setAppts] = useState(initial);
  const [barberFilter, setBarberFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AppointmentWithRelations | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const refetch = useCallback(async () => {
    const res = await fetch("/api/appointments");
    const d = await res.json();
    setAppts(d.appointments);
  }, []);

  const visible = useMemo(
    () => (barberFilter === "all" ? appts : appts.filter((a) => a.barberId === barberFilter)),
    [appts, barberFilter]
  );

  function changeStatus(id: string, status: AppointmentStatus) {
    fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then(() => {
        setAppts((prev) => prev.map((a) => (a.id === id ? ({ ...a, status } as any) : a)));
        setSelected((s) => (s && s.id === id ? ({ ...s, status } as any) : s));
        toast({ title: "Status atualizado", variant: "success" });
      })
      .catch(() => toast({ title: "Erro ao atualizar", variant: "error" }));
  }

  const weekStart = (() => {
    const d = new Date(`${cursor}T00:00:00`);
    const diff = (d.getDay() + 6) % 7; // Monday start
    return addDaysISO(cursor, -diff);
  })();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));

  const monthGrid = useMemo(() => {
    const base = new Date(`${cursor}T00:00:00`);
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const startDiff = (first.getDay() + 6) % 7;
    const start = addDaysISO(`${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-01`, -startDiff);
    const cells = [];
    for (let i = 0; i < 42; i++) cells.push(addDaysISO(start, i));
    return cells;
  }, [cursor]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border bg-surface p-1">
            {(["day", "week", "month"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn("rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition", mode === m ? "bg-accent text-accent-foreground shadow-soft" : "text-foreground-muted hover:text-foreground")}
              >
                {m === "day" ? "Dia" : m === "week" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCursor(addDaysISO(cursor, mode === "month" ? -30 : mode === "week" ? -7 : -1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground-muted transition hover:bg-muted">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setCursor(today)} className="btn-outline px-3 py-2 text-sm">Hoje</button>
            <button onClick={() => setCursor(addDaysISO(cursor, mode === "month" ? 30 : mode === "week" ? 7 : 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground-muted transition hover:bg-muted">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="ml-1 hidden text-sm font-semibold text-foreground sm:block">
            {mode === "month"
              ? new Date(`${cursor}T00:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
              : mode === "week"
              ? `${formatDateLong(weekStart).split(" de ")[0]} – ${formatDateLong(weekDays[6])}`
              : formatDateLong(cursor)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
            <select value={barberFilter} onChange={(e) => setBarberFilter(e.target.value)} className="input appearance-none py-2 pl-9 pr-8">
              <option value="all">Todos os barbeiros</option>
              {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <button onClick={() => setCreateOpen(true)} className="btn-primary whitespace-nowrap">
            <Plus className="h-4 w-4" /> Novo
          </button>
        </div>
      </div>

      {mode === "month" && (
        <div className="card overflow-hidden p-0">
          <div className="grid grid-cols-7 border-b border-border text-center text-xs font-semibold text-foreground-subtle">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => <div key={d} className="py-2.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {monthGrid.map((iso, i) => {
              const inMonth = new Date(`${iso}T00:00:00`).getMonth() === new Date(`${cursor}T00:00:00`).getMonth();
              const dayAppts = visible.filter((a) => a.date === iso).sort((a, b) => a.startTime.localeCompare(b.startTime));
              const isToday = iso === today;
              return (
                <button
                  key={iso}
                  onClick={() => { setCursor(iso); setMode("day"); }}
                  className={cn("min-h-[104px] border-b border-r border-border p-2 text-left transition hover:bg-muted/50", i % 7 === 6 && "border-r-0", !inMonth && "bg-surface-2/40")}
                >
                  <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold", isToday ? "bg-accent text-accent-foreground" : "text-foreground-muted")}>
                    {Number(iso.slice(8, 10))}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayAppts.slice(0, 3).map((a) => (
                      <div key={a.id} className={cn("truncate rounded border-l-2 px-1.5 py-0.5 text-[10px] font-medium", BLOCK[a.status])}>
                        <span className="text-foreground-muted">{a.startTime}</span> <span className="text-foreground">{a.customerName.split(" ")[0]}</span>
                      </div>
                    ))}
                    {dayAppts.length > 3 && <p className="px-1.5 text-[10px] text-foreground-subtle">+{dayAppts.length - 3} mais</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode === "week" && (
        <div className="card overflow-hidden p-0">
          <div className="grid grid-cols-7 border-b border-border text-center text-xs font-semibold">
            {weekDays.map((iso) => {
              const d = new Date(`${iso}T00:00:00`);
              return (
                <button key={iso} onClick={() => { setCursor(iso); setMode("day"); }} className={cn("border-r border-border py-2.5 last:border-r-0 transition hover:bg-muted/50", iso === today && "bg-accent-soft/40")}>
                  <span className="block text-[10px] uppercase text-foreground-subtle">{d.toLocaleDateString("pt-BR", { weekday: "short" })}</span>
                  <span className={cn("text-sm font-bold", iso === today && "text-accent")}>{Number(iso.slice(8, 10))}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-7 divide-x divide-border">
            {weekDays.map((iso) => (
              <DayColumn key={iso} iso={iso} shop={shop} appts={visible.filter((a) => a.date === iso)} onSelect={setSelected} />
            ))}
          </div>
        </div>
      )}

      {mode === "day" && (
        <DayView iso={cursor} shop={shop} appts={visible.filter((a) => a.date === cursor)} onSelect={setSelected} />
      )}

      {/* Detail modal */}
      <AppointmentDetail
        appointment={selected}
        onClose={() => setSelected(null)}
        onStatus={changeStatus}
        currency={shop.settings.currency}
        onChanged={refetch}
      />

      {/* Create modal */}
      <CreateAppointmentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        shop={shop}
        barbers={barbers}
        services={services}
        defaultDate={cursor}
        onCreated={() => { setCreateOpen(false); refetch(); }}
      />
    </div>
  );
}

function DayColumn({ iso, shop, appts, onSelect }: { iso: string; shop: Barbershop; appts: AppointmentWithRelations[]; onSelect: (a: AppointmentWithRelations) => void; }) {
  const h = dayHours(shop, iso);
  if (!h) return <div className="min-h-[420px] border-r border-border p-2 text-center text-[11px] text-foreground-subtle last:border-r-0">Fechado</div>;
  const open = timeToMinutes(h.open);
  const close = timeToMinutes(h.close);
  const total = close - open;
  const sorted = [...appts].sort((a, b) => a.startTime.localeCompare(b.startTime));
  return (
    <div className="relative min-h-[420px] border-r border-border p-1 last:border-r-0">
      <div className="relative" style={{ height: total * PX }}>
        {[...Array(Math.floor(total / 60) + 1)].map((_, i) => (
          <div key={i} className="absolute left-0 right-0 border-t border-border/60" style={{ top: i * 60 * PX }} />
        ))}
        {sorted.map((a) => {
          const top = (timeToMinutes(a.startTime) - open) * PX;
          const height = Math.max(a.duration * PX - 2, 22);
          return (
            <button
              key={a.id}
              onClick={() => onSelect(a)}
              style={{ top, height }}
              className={cn("absolute left-1 right-1 overflow-hidden rounded-lg border-l-4 p-1.5 text-left transition hover:shadow-soft", BLOCK[a.status])}
            >
              <p className="truncate text-[11px] font-bold text-foreground">{a.startTime} {a.customerName.split(" ")[0]}</p>
              <p className="truncate text-[10px] text-foreground-muted">{a.service.name}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ iso, shop, appts, onSelect }: { iso: string; shop: Barbershop; appts: AppointmentWithRelations[]; onSelect: (a: AppointmentWithRelations) => void; }) {
  const h = dayHours(shop, iso);
  if (!h) return <div className="card p-10 text-center text-foreground-muted">A barbearia está fechada neste dia.</div>;
  const open = timeToMinutes(h.open);
  const close = timeToMinutes(h.close);
  const total = close - open;
  const sorted = [...appts].sort((a, b) => a.startTime.localeCompare(b.startTime));
  return (
    <div className="card overflow-hidden p-0">
      <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
        {weekdayLabel(iso)}, {formatDateLong(iso)}
      </div>
      <div className="flex">
        <div className="w-16 shrink-0 border-r border-border py-2">
          {[...Array(Math.floor(total / 60) + 1)].map((_, i) => (
            <div key={i} className="relative h-[69px] text-[10px] text-foreground-subtle" style={{ height: 60 * PX }}>
              <span className="absolute -top-2 right-2">{minutesToTime(open + i * 60)}</span>
            </div>
          ))}
        </div>
        <div className="relative flex-1 py-2">
          <div className="relative" style={{ height: total * PX }}>
            {[...Array(Math.floor(total / 60) + 1)].map((_, i) => (
              <div key={i} className="absolute left-0 right-0 border-t border-border/60" style={{ top: i * 60 * PX }} />
            ))}
            {sorted.map((a) => {
              const top = (timeToMinutes(a.startTime) - open) * PX;
              const height = Math.max(a.duration * PX - 4, 40);
              return (
                <button
                  key={a.id}
                  onClick={() => onSelect(a)}
                  style={{ top, height }}
                  className={cn("absolute left-2 right-2 flex items-start gap-2 overflow-hidden rounded-xl border-l-4 p-2.5 text-left transition hover:shadow-soft", BLOCK[a.status])}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">{a.startTime} · {a.customerName}</p>
                    <p className="truncate text-xs text-foreground-muted">{a.service.name} — {a.barber.name}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-foreground-subtle">{a.endTime}</span>
                </button>
              );
            })}
            {sorted.length === 0 && (
              <p className="absolute left-3 top-3 text-xs text-foreground-subtle">Nenhum agendamento neste dia.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AppointmentDetail({
  appointment, onClose, onStatus, currency, onChanged,
}: {
  appointment: AppointmentWithRelations | null;
  onClose: () => void;
  onStatus: (id: string, status: AppointmentStatus) => void;
  currency: string;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  if (!appointment) return null;
  const link = typeof window !== "undefined" ? `${window.location.origin}/confirmar/${appointment.token}` : "";
  const whats = `https://wa.me/${appointment.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${appointment.customerName.split(" ")[0]}, seu agendamento: ${appointment.service.name} em ${formatDateLong(appointment.date)} às ${appointment.startTime}.`)}`;

  return (
    <Modal open={!!appointment} onClose={onClose} title="Detalhes do agendamento" size="lg"
      footer={
        <>
          <a href={whats} target="_blank" rel="noreferrer" className="btn-outline">WhatsApp</a>
          <button onClick={onClose} className="btn-ghost">Fechar</button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2/40 p-4">
          <Avatar name={appointment.customerName} size="lg" />
          <div>
            <p className="text-lg font-semibold text-foreground">{appointment.customerName}</p>
            <p className="text-sm text-foreground-muted">{appointment.customerPhone}</p>
            {appointment.customerEmail && <p className="text-xs text-foreground-subtle">{appointment.customerEmail}</p>}
          </div>
          <div className="ml-auto">
            <StatusBadge status={appointment.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Info label="Serviço" value={appointment.service.name} icon={Scissors} />
          <Info label="Profissional" value={appointment.barber.name} icon={User} />
          <Info label="Data" value={formatDateLong(appointment.date)} icon={CalendarDays} />
          <Info label="Horário" value={`${appointment.startTime}–${appointment.endTime}`} icon={Clock} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/40 px-4 py-3">
          <div>
            <p className="text-xs text-foreground-subtle">Valor</p>
            <p className="font-display text-xl font-bold text-foreground">{formatBRL(appointment.price, currency)}</p>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(link); toast({ title: "Link copiado", description: "Envie ao cliente para confirmação.", variant: "success" }); }}
            className="btn-outline"
          >
            <Copy className="h-4 w-4" /> Copiar link de confirmação
          </button>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">Atualizar status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_ACTIONS.map((a) => (
              <button key={a.status} onClick={() => onStatus(appointment.id, a.status)} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition", a.cls)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-1.5 text-foreground-subtle">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function CreateAppointmentModal({
  open, onClose, shop, barbers, services, defaultDate, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  shop: Barbershop;
  barbers: Barber[];
  services: Service[];
  defaultDate: string;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [barberId, setBarberId] = useState(barbers[0]?.id || "");
  const [date, setDate] = useState(defaultDate);
  const [start, setStart] = useState("09:00");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<AppointmentStatus>("confirmed");
  const [loading, setLoading] = useState(false);

  const service = services.find((s) => s.id === serviceId);

  async function create() {
    if (!serviceId || !barberId || !date || !start || !name || !phone) {
      toast({ title: "Preencha todos os campos", variant: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, barberId, date, start, customerName: name, customerPhone: phone, status }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: "Horário indisponível", description: d.error, variant: "error" });
        return;
      }
      toast({ title: "Agendamento criado", variant: "success" });
      onCreated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo agendamento" description="Crie um horário manualmente.">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Serviço</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="input">
              {services.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.duration}min)</option>)}
            </select>
          </div>
          <div>
            <label className="label">Barbeiro</label>
            <select value={barberId} onChange={(e) => setBarberId(e.target.value)} className="input">
              {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Horário</label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cliente</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Nome do cliente" />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="(11) 99999-0000" />
          </div>
        </div>
        <div>
          <label className="label">Status inicial</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)} className="input">
            <option value="confirmed">Confirmado</option>
            <option value="requested">Aguardando confirmação</option>
          </select>
        </div>
        <button onClick={create} disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Criar agendamento
        </button>
      </div>
    </Modal>
  );
}
