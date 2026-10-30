"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Users, Phone, Mail, Trash2, Pencil, Clock, Scissors, User } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/toast";
import { cn, formatDateLong } from "@/lib/utils";

interface Cust { id: string; name: string; phone: string; email?: string; notes?: string; totalAppointments: number; lastAppointment: string | null; nextAppointment: string | null; }
interface Hist { id: string; service: { name: string }; barber: { name: string }; date: string; startTime: string; endTime: string; status: any; price: number; }

export default function ClientesPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Cust[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Cust | null>(null);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<Cust | null>(null);
  const [history, setHistory] = useState<Hist[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/customers");
    const d = await res.json();
    setCustomers(d.customers);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query));

  function openCreate() { setForm({ name: "", phone: "", email: "", notes: "" }); setCreating(true); }
  function openEdit(c: Cust) { setForm({ name: c.name, phone: c.phone, email: c.email || "", notes: c.notes || "" }); setEditing(c); }

  async function save() {
    if (!form.name || !form.phone) { toast({ title: "Nome e telefone obrigatórios", variant: "error" }); return; }
    const isEdit = !!editing;
    try {
      const res = await fetch(isEdit ? `/api/customers/${editing!.id}` : "/api/customers", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast({ title: data.error || "Erro ao salvar cliente", variant: "error" }); return; }
      toast({ title: isEdit ? "Cliente atualizado" : "Cliente criado", variant: "success" });
      setCreating(false); setEditing(null); load();
    } catch (e) { toast({ title: "Erro ao salvar cliente", variant: "error" }); }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) { toast({ title: "Erro ao remover cliente", variant: "error" }); return; }
      setEditing(null); toast({ title: "Cliente removido", variant: "success" }); load();
    } catch (e) { toast({ title: "Erro ao remover cliente", variant: "error" }); }
  }

  async function openDetail(c: Cust) {
    setDetail(c);
    const res = await fetch(`/api/appointments?customerId=${c.id}`);
    const d = await res.json();
    setHistory(d.appointments);
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Clientes</h1>
          <p className="mt-1 text-sm text-foreground-muted">{customers.length} clientes cadastrados.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente..." className="input pl-9" />
          </div>
          <button onClick={openCreate} className="btn-primary whitespace-nowrap"><Plus className="h-4 w-4" /> Novo</button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Telefone</th>
                <th className="px-4 py-3 font-semibold">Agendamentos</th>
                <th className="px-4 py-3 font-semibold">Último</th>
                <th className="px-4 py-3 font-semibold">Próximo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="skeleton h-6 rounded-lg" /></td></tr>)
                : filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 transition hover:bg-muted/40">
                    <td className="px-4 py-3"><button onClick={() => openDetail(c)} className="flex items-center gap-3"><Avatar name={c.name} size="sm" /><span className="font-medium text-foreground">{c.name}</span></button></td>
                    <td className="px-4 py-3 text-foreground-muted">{c.phone}</td>
                    <td className="px-4 py-3 text-foreground-muted">{c.totalAppointments}</td>
                    <td className="px-4 py-3 text-foreground-muted">{c.lastAppointment ? formatDateLong(c.lastAppointment) : "—"}</td>
                    <td className="px-4 py-3 text-foreground-muted">{c.nextAppointment ? formatDateLong(c.nextAppointment) : "—"}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => openEdit(c)} className="rounded-lg p-2 text-foreground-subtle transition hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "Editar cliente" : "Novo cliente"}>
        <div className="space-y-4">
          <div><label className="label">Nome</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Telefone / WhatsApp</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">E-mail</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Observações</label><textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex items-center justify-between">
            {editing ? <button onClick={() => remove(editing.id)} className="btn-ghost text-danger"><Trash2 className="h-4 w-4" /> Remover</button> : <span />}
            <button onClick={save} className="btn-primary">{editing ? "Salvar" : "Criar cliente"}</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Histórico do cliente" size="lg"
        footer={<button onClick={() => setDetail(null)} className="btn-ghost">Fechar</button>}
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2/40 p-4">
              <Avatar name={detail.name} size="lg" />
              <div className="min-w-0">
                <p className="text-lg font-semibold text-foreground">{detail.name}</p>
                <p className="flex items-center gap-1.5 text-sm text-foreground-muted"><Phone className="h-3.5 w-3.5" /> {detail.phone}</p>
                {detail.email && <p className="flex items-center gap-1.5 text-sm text-foreground-muted"><Mail className="h-3.5 w-3.5" /> {detail.email}</p>}
              </div>
              <div className="ml-auto text-right">
                <p className="font-display text-2xl font-bold text-foreground">{detail.totalAppointments}</p>
                <p className="text-xs text-foreground-subtle">agendamentos</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Histórico</p>
              <div className="space-y-2">
                {history.length === 0 && <p className="py-4 text-center text-sm text-foreground-subtle">Sem agendamentos ainda.</p>}
                {history.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5">
                    <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <span className="text-[10px] font-semibold leading-none">{formatDateLong(h.date).slice(0, 3)}</span>
                      <span className="text-xs font-bold">{h.startTime}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{h.service.name}</p>
                      <p className="truncate text-xs text-foreground-muted">{h.barber.name}</p>
                    </div>
                    <StatusBadge status={h.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
