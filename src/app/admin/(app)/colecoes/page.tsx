"use client";

import { useCallback, useEffect, useState } from "react";
import { Star, Plus, Trash2, Layers, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

interface Collection { id: string; barbershopId: string; name: string; featured: boolean; order: number; createdAt: string; }
interface Product { id: string; category: string; }

export default function ColecoesPage() {
  const { toast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([fetch("/api/collections"), fetch("/api/products")]);
    const cd = await c.json();
    const pd = await p.json();
    setCollections(cd.collections || []);
    setProducts(pd.products || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const sorted = [...collections].sort((a, b) =>
    a.featured === b.featured ? (a.order - b.order) || a.name.localeCompare(b.name) : a.featured ? -1 : 1,
  );

  const countFor = (name: string) => products.filter((p) => p.category === name).length;

  async function create() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      if (res.ok) { setNewName(""); toast({ title: "Coleção criada", variant: "success" }); await load(); }
      else { const d = await res.json().catch(() => ({})); toast({ title: d.error || "Erro ao criar", variant: "error" }); }
    } catch (e) {
      toast({ title: "Erro de conexão", variant: "error" });
    } finally {
      setCreating(false);
    }
  }

  async function toggleFeatured(c: Collection) {
    setCollections((prev) => prev.map((x) => (x.id === c.id ? { ...x, featured: !x.featured } : x)));
    const res = await fetch(`/api/collections/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ featured: !c.featured }) });
    if (!res.ok) { toast({ title: "Erro ao atualizar", variant: "error" }); load(); }
  }

  async function rename(c: Collection, name: string) {
    const trimmed = name.trim();
    if (!trimmed || trimmed === c.name) return;
    setCollections((prev) => prev.map((x) => (x.id === c.id ? { ...x, name: trimmed } : x)));
    const res = await fetch(`/api/collections/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: trimmed }) });
    if (!res.ok) { toast({ title: "Erro ao renomear", variant: "error" }); load(); }
  }

  async function remove(c: Collection) {
    if (!confirm(`Remover a coleção "${c.name}"? Os produtos nela serão movidos para outra coleção.`)) return;
    const res = await fetch(`/api/collections/${c.id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Coleção removida", variant: "success" }); load(); }
    else { toast({ title: "Erro ao remover", variant: "error" }); }
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Coleções</h1>
        <p className="mt-1 text-sm text-foreground-muted">Agrupamentos da loja. Marque a estrela para uma coleção aparecer em primeiro lugar no site.</p>
      </div>

      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent"><Layers className="h-[18px] w-[18px]" /></div>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") create(); }}
          placeholder="Nome da nova coleção (ex.: Lançamentos)"
          className="input flex-1"
        />
        <button onClick={create} disabled={creating || !newName.trim()} className="btn-primary">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : sorted.length === 0 ? (
          <p className="px-4 py-12 text-center text-foreground-subtle">Nenhuma coleção ainda. Crie a primeira acima.</p>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => toggleFeatured(c)}
                  aria-label={c.featured ? "Destacar coleção" : "Remover destaque"}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border transition",
                    c.featured ? "border-warning/40 bg-warning/10 text-warning" : "border-border text-foreground-subtle hover:bg-muted",
                  )}
                >
                  <Star className={cn("h-[18px] w-[18px]", c.featured && "fill-current")} />
                </button>
                <input
                  defaultValue={c.name}
                  onBlur={(e) => rename(c, e.target.value)}
                  className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none"
                  aria-label="Nome da coleção"
                />
                {c.featured && <span className="chip border-warning/30 bg-warning/10 text-warning">Em destaque</span>}
                <span className="hidden text-xs text-foreground-subtle sm:inline">{countFor(c.name)} produtos</span>
                <button onClick={() => remove(c)} className="rounded-lg p-2 text-foreground-subtle transition hover:bg-danger/10 hover:text-danger" aria-label="Remover coleção">
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
