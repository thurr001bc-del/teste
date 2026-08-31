"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Scissors, Clock, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/toast";
import { cn, formatBRL } from "@/lib/utils";
import { Service, Barber } from "@/lib/types";

export default function ServicosPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: 0, duration: 30, barberIds: [] as string[], active: true });

  const load = useCallback(async () => {
    const [s, b] = await Promise.all([fetch("/api/services").then((r) => r.json()), fetch("/api/barbers").then((r) => r.json())]);
    setServices(s.services); setBarbers(b.barbers); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm({ name: "", description: "", price: 0, duration: 30, barberIds: barbers.map((b) => b.id), active: true }); setCreating(true); }
  function openEdit(s: Service) { setForm({ name: s.name, description: s.description, price: s.price, duration: s.duration, barberIds: s.barberIds, active: s.active }); setEditing(s); }

  async function save() {
    if (!form.name) { toast({ title: "Informe o nome", variant: "error" }); return; }
    const res = await fetch(editing ? `/api/services/${editing.id}` : "/api/services", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { toast({ title: editing ? "Serviço atualizado" : "Serviço criado", variant: "success" }); setCreating(false); setEditing(null); load(); }
  }
  async function remove(id: string) { await fetch(`/api/services/${id}`, { method: "DELETE" }); setEditing(null); toast({ title: "Serviço removido", variant: "success" }); load(); }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Serviços</h1>
          <p className="mt-1 text-sm text-foreground-muted">{services.length} serviços cadastrados.</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Novo serviço</button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                <th className="px-4 py-3 font-semibold">Serviço</th>
                <th className="px-4 py-3 font-semibold">Duração</th>
                <th className="px-4 py-3 font-semibold">Preço</th>
                <th className="px-4 py-3 font-semibold">Barbeiros</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="skeleton h-6 rounded-lg" /></td></tr>)
                : services.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 transition hover:bg-muted/40">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent"><Scissors className="h-4 w-4" /></span><div><p className="font-medium text-foreground">{s.name}</p><p className="text-xs text-foreground-subtle">{s.description.slice(0, 40)}</p></div></div></td>
                    <td className="px-4 py-3 text-foreground-muted"><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {s.duration}min</span></td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatBRL(s.price)}</td>
                    <td className="px-4 py-3 text-foreground-muted">{s.barberIds.length} barbeiros</td>
                    <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", s.active ? "bg-success/10 text-success" : "bg-muted text-foreground-subtle")}>{s.active ? "Ativo" : "Inativo"}</span></td>
                    <td className="px-4 py-3 text-right"><button onClick={() => openEdit(s)} className="rounded-lg p-2 text-foreground-subtle transition hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "Editar serviço" : "Novo serviço"}>
        <div className="space-y-4">
          <div><label className="label">Nome</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Descrição</label><textarea className="input min-h-[70px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Preço (R$)</label><input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><label className="label">Duração (min)</label><input type="number" className="input" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} /></div>
          </div>
          <div>
            <label className="label">Barbeiros que realizam</label>
            <div className="flex flex-wrap gap-2">
              {barbers.map((b) => {
                const on = form.barberIds.includes(b.id);
                return <button key={b.id} onClick={() => setForm({ ...form, barberIds: on ? form.barberIds.filter((x) => x !== b.id) : [...form.barberIds, b.id] })} className={cn("chip transition", on ? "border-accent bg-accent-soft text-accent" : "hover:bg-muted")}>{on && <Check className="h-3.5 w-3.5" />}{b.name}</button>;
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-[hsl(var(--accent))]" /> Serviço ativo</label>
          <div className="flex items-center justify-between border-t border-border pt-4">
            {editing ? <button onClick={() => remove(editing.id)} className="btn-ghost text-danger"><Trash2 className="h-4 w-4" /> Remover</button> : <span />}
            <button onClick={save} className="btn-primary">{editing ? "Salvar" : "Criar serviço"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
