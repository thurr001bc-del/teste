"use client";

import { useCallback, useEffect, useState } from "react";
import { Boxes, Minus, Plus, AlertTriangle, Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast";
import { cn, formatBRL } from "@/lib/utils";
import { Product } from "@/lib/types";
import { categoryLabel } from "@/lib/product-images";

function StockRow({ product, onSaved }: { product: Product; onSaved: (id: string, stock: number) => void }) {
  const { toast } = useToast();
  const [val, setVal] = useState(String(product.stock));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function commit(next: number) {
    const clamped = Math.max(0, next);
    if (clamped === product.stock) return;
    setSaving(true);
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: clamped }),
    });
    setSaving(false);
    if (res.ok) {
      setVal(String(clamped));
      onSaved(product.id, clamped);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } else {
      toast({ title: "Erro ao salvar o estoque", variant: "error" });
    }
  }

  function step(delta: number) {
    const next = Math.max(0, (Number(val) || 0) + delta);
    setVal(String(next));
    commit(next);
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 font-medium text-foreground">{product.name}</td>
      <td className="px-4 py-3 text-foreground-muted">{categoryLabel(product.category)}</td>
      <td className="px-4 py-3 text-foreground-muted">{formatBRL(product.price)}</td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex h-8 min-w-[40px] items-center justify-center rounded-lg px-2 text-sm font-bold", product.stock <= 5 ? "bg-warning/10 text-warning" : product.stock === 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success")}>{product.stock}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={() => step(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground-muted transition hover:bg-muted" aria-label="Diminuir estoque"><Minus className="h-4 w-4" /></button>
          <input
            type="number"
            min={0}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={() => commit(Number(val) || 0)}
            className="input w-16 px-2 py-1.5 text-center"
            aria-label={`Estoque de ${product.name}`}
          />
          <button onClick={() => step(1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground-muted transition hover:bg-muted" aria-label="Aumentar estoque"><Plus className="h-4 w-4" /></button>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-foreground-subtle" />}
          {saved && !saving && <Check className="h-4 w-4 text-success" />}
        </div>
      </td>
    </tr>
  );
}

export default function EstoquePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/products");
    const d = await res.json();
    setProducts(d.products);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const low = products.filter((p) => p.stock <= 5).length;

  function handleSaved(id: string, stock: number) {
    setProducts((prev) => prev.map((p) => (p.id === id ? ({ ...p, stock } as Product) : p)));
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Estoque</h1>
          <p className="mt-1 text-sm text-foreground-muted">{low} produtos com estoque baixo.</p>
        </div>
        {low > 0 && <span className="chip border-warning/30 bg-warning/10 text-warning"><AlertTriangle className="h-3.5 w-3.5" /> Atenção: repor produtos</span>}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                <th className="px-4 py-3 font-semibold">Produto</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Preço</th>
                <th className="px-4 py-3 font-semibold">Estoque</th>
                <th className="px-4 py-3 font-semibold">Ajustar</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="skeleton h-6 rounded-lg" /></td></tr>
                ))
                : products.map((p) => (
                  <StockRow key={p.id} product={p} onSaved={handleSaved} />
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
