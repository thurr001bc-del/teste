"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Scissors, User, CalendarDays, Clock, Check, ChevronRight, ChevronLeft,
  Loader2, CheckCircle2, UserRound, Copy, ArrowRight, Sparkles,
} from "lucide-react";
import { Service, Barber, Appointment } from "@/lib/types";
import { DatePicker } from "@/components/site/date-picker";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/toast";
import { cn, formatBRL, formatDateLong, weekdayLabel } from "@/lib/utils";

const STEPS = [
  { title: "Serviço", icon: Scissors },
  { title: "Profissional", icon: User },
  { title: "Data", icon: CalendarDays },
  { title: "Horário", icon: Clock },
  { title: "Seus dados", icon: UserRound },
  { title: "Confirmação", icon: Check },
];

export function BookingFlow({
  services,
  barbers,
  currency,
  initialServiceId,
}: {
  services: Service[];
  barbers: Barber[];
  currency: string;
  initialServiceId?: string;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(initialServiceId ? 1 : 0);
  const [serviceId, setServiceId] = useState(initialServiceId || "");
  const [barberSel, setBarberSel] = useState<string>("any");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ appointment: Appointment; token: string } | null>(null);
  const [error, setError] = useState("");

  const service = services.find((s) => s.id === serviceId);
  const barber = barbers.find((b) => b.id === barberSel);

  function go(next: number) {
    setError("");
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const canNext = useMemo(() => {
    if (step === 0) return !!serviceId;
    if (step === 1) return true;
    if (step === 2) return !!date;
    if (step === 3) return !!slot;
    if (step === 4) return form.name.trim().length > 2 && form.phone.trim().length >= 8;
    return true;
  }, [step, serviceId, date, slot, form]);

  async function loadSlots() {
    if (!serviceId || !date) return;
    setLoadingSlots(true);
    setSlot("");
    try {
      const res = await fetch(
        `/api/availability?slug=vanguard&serviceId=${serviceId}&barberId=${barberSel}&date=${date}`
      );
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    if (step === 3) loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, date, barberSel, serviceId]);

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "vanguard",
          serviceId,
          barberId: barberSel,
          date,
          start: slot,
          customerName: form.name,
          customerPhone: form.phone,
          customerEmail: form.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // CRITICAL RULE feedback
        setError(data.error || "Não foi possível concluir o agendamento.");
        if (res.status === 409) {
          toast({ title: "Horário indisponível", description: data.error, variant: "error" });
          loadSlots();
        }
        return;
      }
      setResult({ appointment: data.appointment, token: data.token });
      toast({ title: "Agendamento confirmado!", description: "Enviamos os dados do seu horário.", variant: "success" });
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return <SuccessView appointment={result.appointment} token={result.token} service={service!} barberName={barber?.name || "Primeiro disponível"} currency={currency} />;
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <Stepper step={step} />

      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && (
              <Section title="Qual serviço você quer?" subtitle="Escolha o atendimento desejado.">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setServiceId(s.id)}
                      className={cn(
                        "card flex flex-col items-start p-5 text-left transition hover:-translate-y-0.5 hover:shadow-elevated",
                        serviceId === s.id && "border-accent ring-2 ring-accent/30"
                      )}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                        <Scissors className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 font-semibold text-foreground">{s.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">{s.description}</p>
                      <div className="mt-4 flex w-full items-center justify-between border-t border-border pt-3">
                        <span className="font-display font-bold text-foreground">{formatBRL(s.price, currency)}</span>
                        <span className="text-xs text-foreground-subtle">{s.duration} min</span>
                      </div>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {step === 1 && (
              <Section title="Com quem você prefere?" subtitle="Selecione um profissional ou deixe conosco.">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <button
                    onClick={() => setBarberSel("any")}
                    className={cn(
                      "card flex flex-col items-center justify-center p-6 text-center transition hover:-translate-y-0.5 hover:shadow-elevated",
                      barberSel === "any" && "border-accent ring-2 ring-accent/30"
                    )}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-muted">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 font-semibold text-foreground">Qualquer barbeiro</h3>
                    <p className="mt-1 text-xs text-foreground-muted">O primeiro disponível</p>
                  </button>
                  {barbers.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBarberSel(b.id)}
                      className={cn(
                        "card flex flex-col items-center p-5 text-center transition hover:-translate-y-0.5 hover:shadow-elevated",
                        barberSel === b.id && "border-accent ring-2 ring-accent/30"
                      )}
                    >
                      <Avatar name={b.name} src={b.photo} size="lg" />
                      <h3 className="mt-3 text-sm font-semibold text-foreground">{b.name}</h3>
                      <p className="mt-1 text-xs text-foreground-muted">{b.bio}</p>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {step === 2 && (
              <Section title="Escolha a data" subtitle="Selecionamos os próximos dias disponíveis.">
                <div className="mx-auto max-w-sm">
                  <DatePicker value={date} onChange={setDate} />
                </div>
              </Section>
            )}

            {step === 3 && (
              <Section
                title="Horários disponíveis"
                subtitle={`${service?.name} · ${date ? formatDateLong(date) : ""}`}
              >
                {loadingSlots ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="skeleton h-11 rounded-xl" />
                    ))}
                  </div>
                ) : slots.length ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {slots.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSlot(t)}
                        className={cn(
                          "rounded-xl border py-3 text-sm font-semibold transition",
                          slot === t
                            ? "border-accent bg-accent text-accent-foreground shadow-soft"
                            : "border-border bg-surface text-foreground hover:border-accent/50 hover:text-accent"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 px-6 py-12 text-center">
                    <Clock className="mx-auto h-8 w-8 text-foreground-subtle" />
                    <p className="mt-3 font-semibold text-foreground">Sem horários nesta data</p>
                    <p className="mt-1 text-sm text-foreground-muted">
                      Tente outro dia{barberSel !== "any" ? " ou outro profissional" : ""}.
                    </p>
                    <button onClick={() => go(1)} className="btn-outline mt-4">Trocar profissional</button>
                  </div>
                )}
              </Section>
            )}

            {step === 4 && (
              <Section title="Seus dados" subtitle="Para confirmarmos e enviarmos lembretes.">
                <div className="mx-auto max-w-md space-y-4">
                  <div>
                    <label className="label">Nome completo</label>
                    <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Como devemos te chamar?" />
                  </div>
                  <div>
                    <label className="label">Telefone / WhatsApp</label>
                    <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-0000" />
                  </div>
                  <div>
                    <label className="label">E-mail (opcional)</label>
                    <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" />
                  </div>
                </div>
              </Section>
            )}

            {step === 5 && service && (
              <Section title="Confira seu agendamento" subtitle="Tudo certo antes de confirmar.">
                <div className="mx-auto max-w-md">
                  <div className="card p-6">
                    <div className="flex items-center gap-3 border-b border-border pb-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <Scissors className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{service.name}</p>
                        <p className="text-xs text-foreground-muted">{service.duration} min · {formatBRL(service.price, currency)}</p>
                      </div>
                    </div>
                    <dl className="mt-4 space-y-3 text-sm">
                      <Row label="Profissional" value={barberSel === "any" ? "Primeiro disponível" : barber?.name} />
                      <Row label="Data" value={date ? `${weekdayLabel(date)}, ${formatDateLong(date)}` : ""} />
                      <Row label="Horário" value={slot} />
                      <Row label="Cliente" value={form.name} />
                      <Row label="Contato" value={form.phone} />
                    </dl>
                  </div>
                  {error && (
                    <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
                  )}
                </div>
              </Section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => go(Math.max(0, step - 1))}
          className={cn("btn-ghost", step === 0 && "invisible")}
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        {step < 5 ? (
          <button onClick={() => go(step + 1)} disabled={!canNext} className="btn-primary px-6">
            Continuar <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={submit} disabled={submitting} className="btn-primary px-6">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Confirmar agendamento
          </button>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between gap-1">
      {STEPS.map((s, i) => (
        <div key={s.title} className="flex flex-1 items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition",
                i < step && "border-accent bg-accent text-accent-foreground",
                i === step && "border-accent bg-accent-soft text-accent",
                i > step && "border-border text-foreground-subtle"
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
            </div>
            <span className={cn("hidden text-[11px] font-medium sm:block", i <= step ? "text-foreground" : "text-foreground-subtle")}>
              {s.title}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn("mx-1 h-px flex-1", i < step ? "bg-accent" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-foreground-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-foreground-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function SuccessView({
  appointment, token, service, barberName, currency,
}: {
  appointment: Appointment;
  token: string;
  service: Service;
  barberName: string;
  currency: string;
}) {
  const { toast } = useToast();
  const link = typeof window !== "undefined" ? `${window.location.origin}/confirmar/${token}` : `/confirmar/${token}`;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-lg px-5 py-20 text-center sm:px-8">
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success"
      >
        <CheckCircle2 className="h-10 w-10" />
      </motion.div>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground">Agendamento confirmado!</h1>
      <p className="mt-2 text-foreground-muted">Enviamos tudo para seu WhatsApp. Guarde seus dados:</p>
      <div className="card mt-6 p-6 text-left">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Scissors className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">{service.name}</p>
            <p className="text-xs text-foreground-muted">{service.duration} min · {formatBRL(service.price, currency)}</p>
          </div>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Profissional" value={barberName} />
          <Row label="Data" value={formatDateLong(appointment.date)} />
          <Row label="Horário" value={appointment.startTime} />
          <Row label="Cliente" value={appointment.customerName} />
        </dl>
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => { navigator.clipboard.writeText(link); toast({ title: "Link copiado", variant: "success" }); }}
          className="btn-outline"
        >
          <Copy className="h-4 w-4" /> Copiar link de confirmação
        </button>
        <Link href={`/confirmar/${token}`} className="btn-ghost">
          Ver página de confirmação <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <Link href="/" className="mt-8 inline-block text-sm font-medium text-accent">Voltar ao início</Link>
    </motion.div>
  );
}
