"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import { Plus, Pencil, Trash2, ArrowDownLeft, ArrowUpRight, Wallet, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/toast";
import { cn, formatBRL, formatDateShort, todayISO } from "@/lib/utils";

interface Transaction { id: string; barbershopId: string; type: "income" | "expense"; description: string; amount: number; date: string; createdAt: string; }

interface CashFlowCtx {
  openCreate: () => void;
  openEdit: (t: Transaction) => void;
  remove: (t: Transaction) => void;
  txs: Transaction[];
  loading: boolean;
}

const Ctx = createContext<CashFlowCtx | null>(null);
function useCashFlow() {
  const c = useContext(Ctx);
  if (!c) throw new Error("CashFlowProvider ausente");
  return c;
}

export function CashFlowProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "income" as "income" | "expense", description: "", amount: "", date: todayISO() });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions");
      if (!res.ok) {
        setTxs([]);
        return;
      }
      const d = await res.json();
      setTxs(Array.isArray(d.transactions) ? d.transactions : []);
    } catch {
      setTxs([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ type: "income", description: "", amount: "", date: todayISO() });
    setOpen(true);
  };
  const openEdit = (t: Transaction) => {
    setEditingId(t.id);
    setForm({ type: t.type, description: t.description, amount: String(t.amount), date: t.date });
    setOpen(true);
  };

  async function save() {
    if (!form.description.trim()) { toast({ title: "Informe a descrição", variant: "error" }); return; }
    const amount = Number(form.amount);
    if (!(amount > 0)) { toast({ title: "Informe um valor válido", variant: "error" }); return; }
    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/transactions/${editingId}` : "/api/transactions", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: form.type, description: form.description.trim(), amount, date: form.date }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast({ title: data.error || "Erro ao salvar movimentação", variant: "error" }); return; }
      setOpen(false);
      toast({ title: editingId ? "Movimentação atualizada" : "Movimentação registrada", variant: "success" });
      load();
    } catch (e) { toast({ title: "Erro ao salvar movimentação", variant: "error" }); }
    finally { setSaving(false); }
  }

  async function remove(t: Transaction) {
    if (!confirm(`Remover "${t.description}"?`)) return;
    try {
      const res = await fetch(`/api/transactions/${t.id}`, { method: "DELETE" });
      if (!res.ok) { toast({ title: "Erro ao remover", variant: "error" }); return; }
      toast({ title: "Movimentação removida", variant: "success" });
      load();
    } catch (e) { toast({ title: "Erro ao remover", variant: "error" }); }
  }

  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  return (
    <Ctx.Provider value={{ openCreate, openEdit, remove, txs, loading }}>
      {children}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? "Editar movimentação" : "Adicionar movimentação"}>
        <div className="space-y-4">
          <div className="inline-flex w-full gap-1 rounded-xl border border-border bg-surface-2/50 p-1">
            <button onClick={() => setForm({ ...form, type: "income" })} className={cn("flex-1 rounded-lg px-3 py-2 text-sm font-medium transition", form.type === "income" ? "bg-success/15 text-success" : "text-foreground-muted hover:bg-muted")}>Ganho</button>
            <button onClick={() => setForm({ ...form, type: "expense" })} className={cn("flex-1 rounded-lg px-3 py-2 text-sm font-medium transition", form.type === "expense" ? "bg-danger/15 text-danger" : "text-foreground-muted hover:bg-muted")}>Gasto</button>
          </div>
          <div>
            <label className="label">Descrição</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: Compra de produtos" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" />
            </div>
            <div>
              <label className="label">Data</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button onClick={() => setOpen(false)} className="btn-ghost">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />} Salvar</button>
          </div>
        </div>
      </Modal>
    </Ctx.Provider>
  );
}

export function CashFlowTrigger() {
  const { openCreate } = useCashFlow();
  return (
    <button onClick={openCreate} className="btn-primary">
      <Plus className="h-4 w-4" /> Adicionar gasto/ganho
    </button>
  );
}

export function CashFlowPanel({ currency, from, to }: { currency: string; from?: string; to?: string }) {
  const { openEdit, remove, txs, loading } = useCashFlow();

  const visible = from && to ? txs.filter((t) => t.date >= from && t.date <= to) : txs;
  const income = visible.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = visible.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-foreground">Gastos e Ganhos</h3>
      <p className="mt-0.5 text-sm text-foreground-muted">Registre entradas e saídas à parte das vendas.</p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface-2/50 p-3">
          <p className="text-xs text-foreground-muted">Ganhos</p>
          <p className="mt-1 font-display text-lg font-bold text-success">{formatBRL(income, currency)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-2/50 p-3">
          <p className="text-xs text-foreground-muted">Gastos</p>
          <p className="mt-1 font-display text-lg font-bold text-danger">{formatBRL(expense, currency)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-2/50 p-3">
          <p className="text-xs text-foreground-muted">Saldo</p>
          <p className={cn("mt-1 font-display text-lg font-bold", balance >= 0 ? "text-foreground" : "text-danger")}>{formatBRL(balance, currency)}</p>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-subtle">Nenhuma movimentação ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5">
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", t.type === "income" ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
                  {t.type === "income" ? <ArrowDownLeft className="h-[18px] w-[18px]" /> : <ArrowUpRight className="h-[18px] w-[18px]" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{t.description}</p>
                  <p className="text-xs text-foreground-subtle">{formatDateShort(t.date)} · {t.type === "income" ? "Ganho" : "Gasto"}</p>
                </div>
                <p className={cn("font-display text-sm font-bold", t.type === "income" ? "text-success" : "text-danger")}>
                  {t.type === "income" ? "+" : "−"}{formatBRL(t.amount, currency)}
                </p>
                <button onClick={() => openEdit(t)} className="rounded-lg p-2 text-foreground-subtle transition hover:bg-muted hover:text-foreground" aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(t)} className="rounded-lg p-2 text-foreground-subtle transition hover:bg-danger/10 hover:text-danger" aria-label="Remover">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
