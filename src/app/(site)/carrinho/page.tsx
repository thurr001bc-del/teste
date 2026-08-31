"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useCart } from "@/components/site/cart-context";
import { useToast } from "@/components/toast";
import { formatBRL, cn } from "@/lib/utils";
import { productImage, categoryLabel } from "@/lib/product-images";

export default function CarrinhoPage() {
  const { items, setQty, remove, total, clear, count } = useCart();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string; total: number } | null>(null);

  async function checkout() {
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: "Preencha seus dados", description: "Nome e telefone são obrigatórios.", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty })),
          customerName: form.name,
          customerPhone: form.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erro ao finalizar", description: data.error, variant: "error" });
        return;
      }
      setDone({ id: data.order.id, total: data.order.total });
      clear();
      toast({ title: "Reserva concluída!", variant: "success" });
    } catch {
      toast({ title: "Erro de conexão", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-lg px-5 py-24 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">Reserva confirmada!</h1>
        <p className="mt-2 text-foreground-muted">Protocolo <span className="font-mono text-foreground">{done.id}</span></p>
        <p className="mt-1 text-foreground-muted">Total: {formatBRL(done.total)}. Retire na barbearia ou aguarde nosso contato.</p>
        <Link href="/produtos" className="btn-primary mt-8">Continuar comprando</Link>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Sua sacola</h1>

      {count === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface-2/40 px-6 py-16 text-center">
          <ShoppingBag className="mx-auto h-9 w-9 text-foreground-subtle" />
          <p className="mt-3 font-semibold text-foreground">Sua sacola está vazia</p>
          <Link href="/produtos" className="btn-primary mt-5">Ver produtos</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {items.map((it) => (
                <motion.div
                  key={it.productId}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="card flex items-center gap-4 p-4"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={productImage(it.category as any)} alt={it.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wide text-foreground-subtle">{categoryLabel(it.category as any)}</p>
                    <p className="truncate font-semibold text-foreground">{it.name}</p>
                    <p className="text-sm text-foreground-muted">{formatBRL(it.price)}</p>
                  </div>
                  <div className="flex items-center rounded-xl border border-border">
                    <button onClick={() => setQty(it.productId, it.qty - 1)} className="flex h-9 w-9 items-center justify-center text-foreground-muted transition hover:text-foreground">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{it.qty}</span>
                    <button onClick={() => setQty(it.productId, it.qty + 1)} className="flex h-9 w-9 items-center justify-center text-foreground-muted transition hover:text-foreground">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="w-20 text-right font-semibold text-foreground">{formatBRL(it.price * it.qty)}</div>
                  <button onClick={() => remove(it.productId)} className="text-foreground-subtle transition hover:text-danger" aria-label="Remover">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <h2 className="font-semibold text-foreground">Resumo</h2>
              <div className="mt-4 flex items-center justify-between border-b border-border pb-4 text-sm">
                <span className="text-foreground-muted">Subtotal ({count})</span>
                <span className="font-semibold text-foreground">{formatBRL(total)}</span>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="label">Nome</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" />
                </div>
                <div>
                  <label className="label">Telefone / WhatsApp</label>
                  <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-0000" />
                </div>
              </div>
              <button onClick={checkout} disabled={submitting} className="btn-primary mt-5 w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Finalizar reserva
              </button>
              <p className="mt-3 text-center text-xs text-foreground-subtle">Pagamento na retirada ou entrega.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
