"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Globe, ExternalLink, Copy, Save, Loader2, Eye, Palette, Scissors } from "lucide-react";
import { useToast } from "@/components/toast";
import { Barbershop } from "@/lib/types";

export default function MeuSitePage() {
  const { toast } = useToast();
  const [shop, setShop] = useState<Barbershop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/settings");
    const d = await res.json();
    setShop(d.barbershop); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function patch(partial: any) { setShop((p) => (p ? { ...p, ...partial } : p)); }
  function patchS(partial: any) { setShop((p) => (p ? { ...p, settings: { ...p.settings, ...partial } } : p)); }

  async function save() {
    if (!shop) return;
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: shop.name, tagline: shop.tagline, description: shop.description, settings: shop.settings }),
    });
    setSaving(false);
    if (res.ok) toast({ title: "Site atualizado", variant: "success" });
    else toast({ title: "Erro ao salvar", variant: "error" });
  }

  const link = typeof window !== "undefined" ? window.location.origin : "";
  if (loading || !shop) return <div className="skeleton h-96 rounded-2xl" />;

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Meu site</h1>
        <p className="mt-1 text-sm text-foreground-muted">Seu site público está ativo e conectado ao painel.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="card flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 text-success"><Globe className="h-6 w-6" /></span>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Site público ativo</p>
              <p className="text-sm text-foreground-muted">{link}</p>
            </div>
            <Link href="/" target="_blank" className="btn-outline"><ExternalLink className="h-4 w-4" /> Visualizar</Link>
            <button onClick={() => { navigator.clipboard.writeText(link); toast({ title: "Link copiado", variant: "success" }); }} className="btn-ghost"><Copy className="h-4 w-4" /></button>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent"><Palette className="h-4 w-4" /></span>
              <h3 className="font-semibold text-foreground">Personalizar</h3>
            </div>
            <div className="space-y-4">
              <div><label className="label">Nome da barbearia</label><input className="input" value={shop.name} onChange={(e) => patch({ name: e.target.value })} /></div>
              <div><label className="label">Slogan</label><input className="input" value={shop.tagline} onChange={(e) => patch({ tagline: e.target.value })} /></div>
              <div><label className="label">Título do hero</label><input className="input" value={shop.settings.heroHeadline} onChange={(e) => patchS({ heroHeadline: e.target.value })} /></div>
              <div><label className="label">Subtítulo do hero</label><textarea className="input min-h-[60px]" value={shop.settings.heroSubline} onChange={(e) => patchS({ heroSubline: e.target.value })} /></div>
              <div><label className="label">Mensagem de confirmação</label><textarea className="input min-h-[60px]" value={shop.settings.confirmationMessage} onChange={(e) => patchS({ confirmationMessage: e.target.value })} /></div>
              <div><label className="label">Cor de destaque</label><div className="flex items-center gap-2"><input type="color" value={shop.settings.primaryColor} onChange={(e) => patchS({ primaryColor: e.target.value })} className="h-10 w-12 rounded-lg border border-border bg-surface" /><input className="input" value={shop.settings.primaryColor} onChange={(e) => patchS({ primaryColor: e.target.value })} /></div></div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <Link href="/admin/configuracoes" className="btn-ghost">Configurações avançadas</Link>
                <button onClick={save} disabled={saving} className="btn-primary">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar</button>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 font-semibold text-foreground">Conteúdo do site</h3>
            <p className="mb-3 text-sm text-foreground-muted">Edite serviços, barbeiros e produtos — tudo reflete automaticamente no site.</p>
            <div className="grid grid-cols-3 gap-2">
              <Link href="/admin/servicos" className="btn-outline justify-center"><Scissors className="h-4 w-4" /> Serviços</Link>
              <Link href="/admin/barbeiros" className="btn-outline justify-center">Barbeiros</Link>
              <Link href="/admin/produtos" className="btn-outline justify-center">Produtos</Link>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-border bg-surface-2/40 px-4 py-2.5 text-xs font-medium text-foreground-muted">
              <Eye className="h-4 w-4" /> Pré-visualização
            </div>
            <div
              className="relative overflow-hidden p-6"
              style={{ background: `linear-gradient(135deg, ${shop.settings.primaryColor}14, transparent)` }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: shop.settings.primaryColor }}>{shop.tagline}</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight text-foreground">{shop.settings.heroHeadline}</h2>
              <p className="mt-2 text-sm text-foreground-muted">{shop.settings.heroSubline}</p>
              <div className="mt-4 flex gap-2">
                <span className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: shop.settings.primaryColor }}>Agendar horário</span>
                <span className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground">Ver produtos</span>
              </div>
            </div>
            <div className="border-t border-border p-4">
              <p className="text-xs text-foreground-subtle">Mensagem de confirmação:</p>
              <p className="mt-1 text-sm italic text-foreground-muted">"{shop.settings.confirmationMessage}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
