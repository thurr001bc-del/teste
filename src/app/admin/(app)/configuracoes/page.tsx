"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, Loader2, CalendarOff, Plus, Trash2, Globe, Instagram, MessageCircle, Clock } from "lucide-react";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";
import { Barbershop, Barber, BlockedTime } from "@/lib/types";

const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [shop, setShop] = useState<Barbershop | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [blocks, setBlocks] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBlock, setNewBlock] = useState({ date: "", start: "12:00", end: "13:00", barberId: "", reason: "" });

  const load = useCallback(async () => {
    const [s, b, bl] = await Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/barbers").then((r) => r.json()),
      fetch("/api/blocked").then((r) => r.json()),
    ]);
    setShop(s.barbershop); setBarbers(b.barbers); setBlocks(bl.blockedTimes); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function patch(partial: any) {
    setShop((prev) => (prev ? ({ ...prev, ...partial }) : prev));
  }
  function patchSettings(partial: any) {
    setShop((prev) => (prev ? ({ ...prev, settings: { ...prev.settings, ...partial } }) : prev));
  }
  function patchSocial(partial: any) {
    setShop((prev) => (prev ? ({ ...prev, socials: { ...prev.socials, ...partial } }) : prev));
  }
  function patchHours(day: number, partial: any) {
    setShop((prev) => {
      if (!prev) return prev;
      const hours = prev.businessHours.map((h) => (h.day === day ? { ...h, ...partial } : h));
      return { ...prev, businessHours: hours };
    });
  }

  async function save() {
    if (!shop) return;
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: shop.name, tagline: shop.tagline, description: shop.description,
        address: shop.address, city: shop.city, phone: shop.phone, email: shop.email,
        socials: shop.socials, businessHours: shop.businessHours, settings: shop.settings,
      }),
    });
    setSaving(false);
    if (res.ok) toast({ title: "Alterações salvas", variant: "success" });
    else toast({ title: "Erro ao salvar", variant: "error" });
  }

  async function addBlock() {
    if (!newBlock.date) { toast({ title: "Escolha uma data", variant: "error" }); return; }
    const res = await fetch("/api/blocked", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBlock),
    });
    if (res.ok) { toast({ title: "Bloqueio criado", variant: "success" }); setNewBlock({ date: "", start: "12:00", end: "13:00", barberId: "", reason: "" }); load(); }
  }
  async function delBlock(id: string) {
    await fetch(`/api/blocked/${id}`, { method: "DELETE" }); load();
  }

  if (loading || !shop) return <div className="skeleton h-96 rounded-2xl" />;

  return (
    <div className="max-w-4xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Configurações</h1>
          <p className="mt-1 text-sm text-foreground-muted">Dados da barbearia, horários e bloqueios.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar</button>
      </div>

      <Section title="Identidade" icon={Globe}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome"><input className="input" value={shop.name} onChange={(e) => patch({ name: e.target.value })} /></Field>
          <Field label="Slogan"><input className="input" value={shop.tagline} onChange={(e) => patch({ tagline: e.target.value })} /></Field>
        </div>
        <div className="mt-4"><Field label="Descrição"><textarea className="input min-h-[80px]" value={shop.description} onChange={(e) => patch({ description: e.target.value })} /></Field></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Cor de destaque"><div className="flex items-center gap-2"><input type="color" value={shop.settings.primaryColor} onChange={(e) => patchSettings({ primaryColor: e.target.value })} className="h-10 w-12 rounded-lg border border-border bg-surface" /><input className="input" value={shop.settings.primaryColor} onChange={(e) => patchSettings({ primaryColor: e.target.value })} /></div></Field>
          <Field label="Telefone"><input className="input" value={shop.phone} onChange={(e) => patch({ phone: e.target.value })} /></Field>
        </div>
      </Section>

      <Section title="Site público" icon={Globe}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título do hero"><input className="input" value={shop.settings.heroHeadline} onChange={(e) => patchSettings({ heroHeadline: e.target.value })} /></Field>
          <Field label="Subtítulo do hero"><input className="input" value={shop.settings.heroSubline} onChange={(e) => patchSettings({ heroSubline: e.target.value })} /></Field>
        </div>
        <div className="mt-4"><Field label="Mensagem de confirmação"><textarea className="input min-h-[70px]" value={shop.settings.confirmationMessage} onChange={(e) => patchSettings({ confirmationMessage: e.target.value })} /></Field></div>
      </Section>

      <Section title="Contato & redes" icon={Instagram}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Endereço"><input className="input" value={shop.address} onChange={(e) => patch({ address: e.target.value })} /></Field>
          <Field label="Cidade"><input className="input" value={shop.city} onChange={(e) => patch({ city: e.target.value })} /></Field>
          <Field label="E-mail"><input className="input" value={shop.email} onChange={(e) => patch({ email: e.target.value })} /></Field>
          <Field label="Instagram"><div className="flex items-center gap-2"><Instagram className="h-4 w-4 text-foreground-subtle" /><input className="input" value={shop.socials.instagram || ""} onChange={(e) => patchSocial({ instagram: e.target.value })} /></div></Field>
          <Field label="WhatsApp"><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-foreground-subtle" /><input className="input" value={shop.socials.whatsapp || ""} onChange={(e) => patchSocial({ whatsapp: e.target.value })} /></div></Field>
          <Field label="TikTok"><input className="input" value={shop.socials.tiktok || ""} onChange={(e) => patchSocial({ tiktok: e.target.value })} /></Field>
        </div>
      </Section>

      <Section title="Horário de funcionamento" icon={Clock}>
        <div className="overflow-hidden rounded-xl border border-border">
          {shop.businessHours.map((h) => (
            <div key={h.day} className={cn("flex flex-wrap items-center gap-2 border-b border-border p-2.5 last:border-0", !h.enabled && "bg-surface-2/40")}>
              <label className="flex w-24 items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={h.enabled} onChange={(e) => patchHours(h.day, { enabled: e.target.checked })} className="accent-[hsl(var(--accent))]" /> {DOW[h.day]}
              </label>
              <input type="time" value={h.open} disabled={!h.enabled} onChange={(e) => patchHours(h.day, { open: e.target.value })} className="input w-auto py-1.5" />
              <span className="text-foreground-subtle">–</span>
              <input type="time" value={h.close} disabled={!h.enabled} onChange={(e) => patchHours(h.day, { close: e.target.value })} className="input w-auto py-1.5" />
              <span className="ml-2 text-xs text-foreground-subtle">Pausa</span>
              <input type="time" value={h.breakStart || ""} disabled={!h.enabled} onChange={(e) => patchHours(h.day, { breakStart: e.target.value })} className="input w-auto py-1.5" />
              <span className="text-foreground-subtle">–</span>
              <input type="time" value={h.breakEnd || ""} disabled={!h.enabled} onChange={(e) => patchHours(h.day, { breakEnd: e.target.value })} className="input w-auto py-1.5" />
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Intervalo de horários (min)"><input type="number" className="input" value={shop.settings.slotInterval} onChange={(e) => patchSettings({ slotInterval: Number(e.target.value) })} /></Field>
          <Field label="Antecedência mínima (min)"><input type="number" className="input" value={shop.settings.bookingLeadMinutes} onChange={(e) => patchSettings({ bookingLeadMinutes: Number(e.target.value) })} /></Field>
        </div>
      </Section>

      <Section title="Bloqueios & folgas" icon={CalendarOff} description="Impedem agendamentos em datas/horários específicos.">
        <div className="rounded-xl border border-border p-3">
          <div className="flex flex-wrap items-end gap-2">
            <div><label className="label">Data</label><input type="date" className="input w-auto" value={newBlock.date} onChange={(e) => setNewBlock({ ...newBlock, date: e.target.value })} /></div>
            <div><label className="label">Início</label><input type="time" className="input w-auto" value={newBlock.start} onChange={(e) => setNewBlock({ ...newBlock, start: e.target.value })} /></div>
            <div><label className="label">Fim</label><input type="time" className="input w-auto" value={newBlock.end} onChange={(e) => setNewBlock({ ...newBlock, end: e.target.value })} /></div>
            <div className="flex-1 min-w-[140px]"><label className="label">Barbeiro</label><select className="input" value={newBlock.barberId} onChange={(e) => setNewBlock({ ...newBlock, barberId: e.target.value })}><option value="">Toda a barbearia</option>{barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <button onClick={addBlock} className="btn-primary"><Plus className="h-4 w-4" /> Bloquear</button>
          </div>
          <div className="mt-3 space-y-2">
            {blocks.length === 0 && <p className="py-2 text-center text-sm text-foreground-subtle">Nenhum bloqueio.</p>}
            {blocks.map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-sm">
                <CalendarOff className="h-4 w-4 text-warning" />
                <span className="font-medium text-foreground">{b.date}</span>
                <span className="text-foreground-muted">{b.start}–{b.end}</span>
                {b.barberId && <span className="text-foreground-subtle">{barbers.find((x) => x.id === b.barberId)?.name}</span>}
                {b.reason && <span className="text-foreground-subtle">· {b.reason}</span>}
                <button onClick={() => delBlock(b.id)} className="ml-auto rounded-lg p-1.5 text-foreground-subtle hover:text-danger"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, description, children }: { title: string; icon: any; description?: string; children: React.ReactNode }) {
  return (
    <div className="card mb-5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent"><Icon className="h-4 w-4" /></span>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {description && <p className="text-xs text-foreground-subtle">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
