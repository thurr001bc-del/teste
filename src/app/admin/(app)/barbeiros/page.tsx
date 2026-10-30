"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Scissors, Clock, Check, Upload } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";
import { Barber, Service, BarberScheduleDay } from "@/lib/types";

const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function defaultSchedule(): BarberScheduleDay[] {
  return DOW.map((_, d) => ({ day: d as any, enabled: d !== 0, start: "09:00", end: "20:00", breakStart: d === 0 ? undefined : "12:00", breakEnd: d === 0 ? undefined : "13:00" }));
}

export default function BarbeirosPage() {
  const { toast } = useToast();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Barber | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "", bio: "", photo: "", active: true, specialties: [] as string[], schedule: defaultSchedule(),
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [b, s] = await Promise.all([fetch("/api/barbers").then((r) => r.json()), fetch("/api/services").then((r) => r.json())]);
    setBarbers(b.barbers); setServices(s.services); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm({ name: "", bio: "", photo: "", active: true, specialties: [], schedule: defaultSchedule() }); setCreating(true); }
  function openEdit(b: Barber) {
    setForm({ name: b.name, bio: b.bio || "", photo: b.photo || "", active: b.active, specialties: b.specialties, schedule: b.schedule?.length ? b.schedule : defaultSchedule() });
    setEditing(b);
  }

  async function save() {
    if (!form.name) { toast({ title: "Informe o nome", variant: "error" }); return; }
    const payload = { ...form };
    try {
      const res = await fetch(editing ? `/api/barbers/${editing.id}` : "/api/barbers", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast({ title: data.error || "Erro ao salvar barbeiro", variant: "error" }); return; }
      toast({ title: editing ? "Barbeiro atualizado" : "Barbeiro adicionado", variant: "success" });
      setCreating(false); setEditing(null); load();
    } catch (e) { toast({ title: "Erro ao salvar barbeiro", variant: "error" }); }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/barbers/${id}`, { method: "DELETE" });
      if (!res.ok) { toast({ title: "Erro ao remover barbeiro", variant: "error" }); return; }
      setEditing(null);
      toast({ title: "Barbeiro removido", variant: "success" });
      load();
    } catch (e) { toast({ title: "Erro ao remover barbeiro", variant: "error" }); }
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) { toast({ title: data.error || "Erro ao enviar imagem", variant: "error" }); return; }
      setForm((prev) => ({ ...prev, photo: data.url }));
      toast({ title: "Imagem enviada", variant: "success" });
    } catch (e) { toast({ title: "Erro ao enviar imagem", variant: "error" }); }
    finally { setUploading(false); }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Barbeiros</h1>
          <p className="mt-1 text-sm text-foreground-muted">{barbers.filter((b) => b.active).length} ativos de {barbers.length}.</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Novo barbeiro</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-44 rounded-2xl" />)
          : barbers.map((b) => (
            <div key={b.id} className={cn("card p-5", !b.active && "opacity-60")}>
              <div className="flex items-center gap-3">
                <Avatar name={b.name} src={b.photo} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{b.name}</p>
                  <p className="truncate text-xs text-foreground-muted">{b.bio}</p>
                </div>
                <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold", b.active ? "bg-success/10 text-success" : "bg-muted text-foreground-subtle")}>{b.active ? "Ativo" : "Inativo"}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {b.specialties.slice(0, 4).map((sid) => {
                  const s = services.find((x) => x.id === sid);
                  return s ? <span key={sid} className="chip">{s.name}</span> : null;
                })}
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
                <button onClick={() => openEdit(b)} className="btn-ghost px-3 py-1.5 text-sm"><Pencil className="h-4 w-4" /> Editar</button>
              </div>
            </div>
          ))}
      </div>

      <Modal open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "Editar barbeiro" : "Novo barbeiro"} size="xl">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Nome</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <label className="label">Foto</label>
              <div className="flex items-center gap-3">
                <Avatar name={form.name || "Barbeiro"} src={form.photo} size="md" />
                <div className="flex-1">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-outline w-full justify-center"><Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Enviar do computador"}</button>
                </div>
              </div>
              {form.photo && <p className="mt-2 text-xs text-foreground-subtle">Imagem atual: {form.photo}</p>}
            </div>
          </div>
          <div><label className="label">Bio</label><input className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>

          <div>
            <label className="label">Especialidades</label>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => {
                const on = form.specialties.includes(s.id);
                return (
                  <button key={s.id} onClick={() => setForm({ ...form, specialties: on ? form.specialties.filter((x) => x !== s.id) : [...form.specialties, s.id] })}
                    className={cn("chip transition", on ? "border-accent bg-accent-soft text-accent" : "hover:bg-muted")}>
                    {on && <Check className="h-3.5 w-3.5" />}{s.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Horários de trabalho</label>
            <div className="overflow-hidden rounded-xl border border-border">
              {form.schedule.map((s, i) => (
                <div key={i} className={cn("flex flex-wrap items-center gap-2 border-b border-border p-2.5 last:border-0", !s.enabled && "bg-surface-2/40")}>
                  <label className="flex w-24 items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" checked={s.enabled} onChange={(e) => { const sc = [...form.schedule]; sc[i] = { ...sc[i], enabled: e.target.checked }; setForm({ ...form, schedule: sc }); }} className="accent-[hsl(var(--accent))]" />
                    {DOW[s.day]}
                  </label>
                  <input type="time" value={s.start} disabled={!s.enabled} onChange={(e) => { const sc = [...form.schedule]; sc[i] = { ...sc[i], start: e.target.value }; setForm({ ...form, schedule: sc }); }} className="input w-auto py-1.5" />
                  <span className="text-foreground-subtle">–</span>
                  <input type="time" value={s.end} disabled={!s.enabled} onChange={(e) => { const sc = [...form.schedule]; sc[i] = { ...sc[i], end: e.target.value }; setForm({ ...form, schedule: sc }); }} className="input w-auto py-1.5" />
                  <span className="ml-2 text-xs text-foreground-subtle">Pausa</span>
                  <input type="time" value={s.breakStart || ""} disabled={!s.enabled} onChange={(e) => { const sc = [...form.schedule]; sc[i] = { ...sc[i], breakStart: e.target.value }; setForm({ ...form, schedule: sc }); }} className="input w-auto py-1.5" />
                  <span className="text-foreground-subtle">–</span>
                  <input type="time" value={s.breakEnd || ""} disabled={!s.enabled} onChange={(e) => { const sc = [...form.schedule]; sc[i] = { ...sc[i], breakEnd: e.target.value }; setForm({ ...form, schedule: sc }); }} className="input w-auto py-1.5" />
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-[hsl(var(--accent))]" /> Barbeiro ativo
          </label>

          <div className="flex items-center justify-between border-t border-border pt-4">
            {editing ? <button onClick={() => remove(editing.id)} className="btn-ghost text-danger"><Trash2 className="h-4 w-4" /> Remover</button> : <span />}
            <button onClick={save} className="btn-primary">{editing ? "Salvar" : "Adicionar"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
