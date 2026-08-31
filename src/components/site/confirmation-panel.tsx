"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, CalendarClock, CalendarDays, Clock, Scissors, User, Loader2, AlertTriangle, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { DatePicker } from "@/components/site/date-picker";
import { useToast } from "@/components/toast";
import { cn, formatBRL, formatDateLong, weekdayLabel } from "@/lib/utils";

export interface ConfirmAppointment {
  id: string;
  token: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  barberName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: string;
}

export function ConfirmationPanel({
  appointment,
  message,
  currency,
}: {
  appointment: ConfirmAppointment;
  message: string;
  currency: string;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState(appointment.status);
  const [loading, setLoading] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rDate, setRDate] = useState("");
  const [rSlots, setRSlots] = useState<string[]>([]);
  const [rSlot, setRSlot] = useState("");
  const [rLoading, setRLoading] = useState(false);
  const [rError, setRError] = useState("");

  const firstName = appointment.customerName.split(" ")[0];
  const isCancelled = status === "cancelled";
  const isConfirmed = status === "confirmed" || status === "completed" || status === "in_progress";

  async function confirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/confirm/${appointment.token}`, { method: "POST" });
      if (res.ok) {
        setStatus("confirmed");
        toast({ title: "Horário confirmado!", variant: "success" });
      } else {
        toast({ title: "Não foi possível confirmar", variant: "error" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadRSlots() {
    if (!rDate) return;
    setRLoading(true);
    setRSlot("");
    try {
      const res = await fetch(`/api/availability?slug=vanguard&serviceId=${appointment.serviceId}&barberId=${"any"}&date=${rDate}`);
      const d = await res.json();
      setRSlots(d.slots || []);
    } finally {
      setRLoading(false);
    }
  }

  async function doReschedule() {
    setLoading(true);
    setRError("");
    try {
      const res = await fetch(`/api/appointments/reschedule/${appointment.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: rDate, startTime: rSlot }),
      });
      const d = await res.json();
      if (!res.ok) {
        setRError(d.error || "Não foi possível remarcar.");
        if (res.status === 409) loadRSlots();
        return;
      }
      setStatus("confirmed");
      appointment.date = rDate;
      appointment.startTime = rSlot;
      setRescheduleOpen(false);
      toast({ title: "Horário remarcado!", variant: "success" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-16 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Scissors className="h-8 w-8" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground">
          Olá, {firstName}! 👋
        </h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-foreground-muted">{message}</p>
      </motion.div>

      <div className="card mt-8 overflow-hidden">
        <div className="border-b border-border bg-surface-2/40 px-6 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">Seu agendamento</p>
        </div>
        <div className="p-6">
          <Detail icon={Scissors} label="Serviço" value={appointment.serviceName} />
          <Detail icon={User} label="Profissional" value={appointment.barberName} />
          <Detail icon={CalendarDays} label="Data" value={`${weekdayLabel(appointment.date)}, ${formatDateLong(appointment.date)}`} />
          <Detail icon={Clock} label="Horário" value={`${appointment.startTime} – ${appointment.endTime}`} />
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-foreground-muted">Valor</span>
            <span className="font-display text-xl font-bold text-foreground">{formatBRL(appointment.price, currency)}</span>
          </div>

          <div className="mt-5">
            {isCancelled ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                <X className="h-4 w-4" /> Este agendamento foi cancelado.
              </div>
            ) : isConfirmed ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">
                <CheckCircle2 className="h-4 w-4" /> Horário confirmado. Estamos te aguardando!
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={confirm} disabled={loading} className="btn-primary">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Confirmar horário
                </button>
                <button onClick={() => { setRescheduleOpen(true); }} className="btn-outline">
                  <CalendarClock className="h-4 w-4" /> Remarcar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title="Remarcar horário"
        description="Escolha uma nova data e horário disponíveis."
        size="md"
      >
        <div className="space-y-4">
          <div className="mx-auto max-w-sm">
            <DatePicker value={rDate} onChange={(d) => { setRDate(d); setRSlot(""); }} />
          </div>
          {rDate && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Horários</p>
              {rLoading ? (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
                </div>
              ) : rSlots.length ? (
                <div className="grid grid-cols-4 gap-2">
                  {rSlots.map((t) => (
                    <button key={t} onClick={() => setRSlot(t)} className={cn("rounded-xl border py-2.5 text-sm font-semibold transition", rSlot === t ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-accent/50")}>
                      {t}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-foreground-muted">Sem horários nesta data.</p>
              )}
            </div>
          )}
          {rError && (
            <p className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertTriangle className="h-4 w-4" /> {rError}
            </p>
          )}
          <button onClick={doReschedule} disabled={!rSlot || loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Confirmar remarcação
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground-muted">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <p className="text-xs text-foreground-subtle">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
