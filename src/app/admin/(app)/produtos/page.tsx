"use client";

import { useCallback, useEffect, useState, ChangeEvent } from "react";
import { Plus, Pencil, Trash2, Package, Boxes, Check, X, Image as ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/toast";
import { cn, formatBRL } from "@/lib/utils";
import { Product } from "@/lib/types";
import { categoryLabel } from "@/lib/product-images";

interface Collection { id: string; name: string; }

export default function ProdutosAdminPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showNewColl, setShowNewColl] = useState(false);
  const [newCollName, setNewCollName] = useState("");
  const [form, setForm] = useState({ name: "", description: "", price: 0, category: "", stock: 0, sku: "", active: true, images: [] as string[] });

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([fetch("/api/products"), fetch("/api/collections")]);
    const pd = await p.json();
    const cd = await c.json();
    setProducts(pd.products);
    setCollections(cd.collections || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ name: "", description: "", price: 0, category: collections[0]?.name || "", stock: 0, sku: "", active: true, images: [] });
    setCreating(true);
  }
  function openEdit(p: Product) {
    setForm({ name: p.name, description: p.description, price: p.price, category: p.category, stock: p.stock, sku: p.sku || "", active: p.active, images: p.images || [] });
    setEditing(p);
  }

  function updateImage(i: number, v: string) {
    setForm((f) => ({ ...f, images: f.images.map((u, idx) => (idx === i ? v : u)) }));
  }
  function addImage() {
    if (form.images.length >= 5) return;
    setForm((f) => ({ ...f, images: [...f.images, ""] }));
  }
  function removeImage(i: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  }
  async function uploadFile(i: number, file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (res.ok && d.url) updateImage(i, d.url);
      else toast({ title: d.error || "Falha no upload", variant: "error" });
    } catch {
      toast({ title: "Falha no upload", variant: "error" });
    } finally {
      setUploading(false);
    }
  }
  function onPickFile(i: number, e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) uploadFile(i, f);
    e.target.value = "";
  }
  async function createCollectionFromProduct() {
    const name = newCollName.trim();
    if (!name) return;
    const res = await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    if (res.ok) {
      const d = await res.json();
      setCollections((prev) => [...prev, d.collection]);
      setForm((f) => ({ ...f, category: d.collection.name }));
      setNewCollName("");
      setShowNewColl(false);
      toast({ title: "Coleção criada", variant: "success" });
    } else {
      toast({ title: "Erro ao criar coleção", variant: "error" });
    }
  }

  async function save() {
    if (!form.name) { toast({ title: "Informe o nome", variant: "error" }); return; }
    const payload = { ...form, images: form.images.map((x) => x.trim()).filter(Boolean).slice(0, 5) };
    const res = await fetch(editing ? `/api/products/${editing.id}` : "/api/products", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { toast({ title: editing ? "Produto atualizado" : "Produto criado", variant: "success" }); setCreating(false); setEditing(null); load(); }
  }
  async function remove(id: string) { await fetch(`/api/products/${id}`, { method: "DELETE" }); setEditing(null); toast({ title: "Produto removido", variant: "success" }); load(); }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Produtos</h1>
          <p className="mt-1 text-sm text-foreground-muted">{products.length} produtos na vitrine.</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Novo produto</button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                <th className="px-4 py-3 font-semibold">Produto</th>
                <th className="px-4 py-3 font-semibold">Coleção</th>
                <th className="px-4 py-3 font-semibold">Preço</th>
                <th className="px-4 py-3 font-semibold">Estoque</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="skeleton h-6 rounded-lg" /></td></tr>)
                : products.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 transition hover:bg-muted/40">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent"><Package className="h-4 w-4" /></span><div><p className="font-medium text-foreground">{p.name}</p><p className="text-xs text-foreground-subtle">{p.description.slice(0, 38)}</p></div></div></td>
                    <td className="px-4 py-3 text-foreground-muted">{categoryLabel(p.category)}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatBRL(p.price)}</td>
                    <td className="px-4 py-3"><span className={cn("font-medium", p.stock <= 5 ? "text-warning" : "text-foreground-muted")}>{p.stock}</span></td>
                    <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", p.active ? "bg-success/10 text-success" : "bg-muted text-foreground-subtle")}>{p.active ? "Ativo" : "Inativo"}</span></td>
                    <td className="px-4 py-3 text-right"><button onClick={() => openEdit(p)} className="rounded-lg p-2 text-foreground-subtle transition hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "Editar produto" : "Novo produto"}>
        <div className="space-y-4">
          <div><label className="label">Nome</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Descrição</label><textarea className="input min-h-[70px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <label className="label">Imagens (até 5)</label>
            <div className="space-y-2">
              {form.images.map((url, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {url ? (
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-foreground-subtle"><ImageIcon className="h-5 w-5" /></div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <input type="file" accept="image/*" id={`img-file-${i}`} className="hidden" onChange={(e) => onPickFile(i, e)} />
                    <label htmlFor={`img-file-${i}`} className="btn-outline inline-flex cursor-pointer items-center justify-center gap-2 px-3 py-2 text-xs">
                      <ImageIcon className="h-4 w-4" /> {uploading ? "Enviando…" : "Enviar do computador"}
                    </label>
                    <input className="input flex-1" value={url} placeholder="ou cole a URL da imagem" onChange={(e) => updateImage(i, e.target.value)} />
                  </div>
                  <button onClick={() => removeImage(i)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground-subtle transition hover:bg-danger/10 hover:text-danger" aria-label="Remover imagem"><X className="h-4 w-4" /></button>
                </div>
              ))}
              {form.images.length < 5 && (
                <button onClick={addImage} className="btn-ghost text-sm"><Plus className="h-4 w-4" /> Adicionar imagem</button>
              )}
            </div>
            <p className="mt-1 text-xs text-foreground-subtle">A primeira imagem será a principal na loja. Envie do computador/galeria ou cole uma URL.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Coleção</label>
            <select
              value={form.category}
              onChange={(e) => {
                if (e.target.value === "__new__") setShowNewColl(true);
                else setForm({ ...form, category: e.target.value });
              }}
              className="input"
            >
              {collections.length === 0 && <option value="">Nenhuma coleção</option>}
              {collections.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              <option value="__new__">+ Nova coleção…</option>
            </select>
            {showNewColl && (
              <div className="mt-2 flex gap-2">
                <input
                  autoFocus
                  className="input flex-1"
                  value={newCollName}
                  onChange={(e) => setNewCollName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") createCollectionFromProduct(); }}
                  placeholder="Nome da nova coleção"
                />
                <button type="button" onClick={createCollectionFromProduct} className="btn-primary"><Plus className="h-4 w-4" /> Criar</button>
                <button type="button" onClick={() => { setShowNewColl(false); setNewCollName(""); }} className="btn-ghost">Cancelar</button>
              </div>
            )}
          </div>
            <div><label className="label">SKU</label><input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Preço (R$)</label><input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><label className="label">Estoque</label><input type="number" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-[hsl(var(--accent))]" /> Produto ativo na loja</label>
          <div className="flex items-center justify-between border-t border-border pt-4">
            {editing ? <button onClick={() => remove(editing.id)} className="btn-ghost text-danger"><Trash2 className="h-4 w-4" /> Remover</button> : <span />}
            <button onClick={save} className="btn-primary">{editing ? "Salvar" : "Criar produto"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
