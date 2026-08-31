import Link from "next/link";
import { Instagram, MessageCircle, MapPin, Clock, Phone, Mail } from "lucide-react";
import { Logo } from "@/components/brand";

export function PublicFooter({ shop }: { shop: { name: string; address: string; phone: string; email: string; socials: any } }) {
  return (
    <footer id="contato" className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground-muted">
              {shop.name} — estilo com precisão cirúrgica. Agendamento inteligente,
              profissionais especializados e uma experiência pensada em cada detalhe.
            </p>
            <div className="mt-5 flex gap-3">
              <a href={`https://instagram.com/${shop.socials?.instagram || ""}`} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-foreground-muted transition hover:text-foreground hover:shadow-soft">
                <Instagram className="h-4 w-4" />
              </a>
              <a href={`https://wa.me/${shop.socials?.whatsapp || ""}`} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-foreground-muted transition hover:text-foreground hover:shadow-soft">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground-subtle">Navegação</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground-muted">
              <li><Link href="/#servicos" className="transition hover:text-foreground">Serviços</Link></li>
              <li><Link href="/#barbeiros" className="transition hover:text-foreground">Barbeiros</Link></li>
              <li><Link href="/produtos" className="transition hover:text-foreground">Produtos</Link></li>
              <li><Link href="/agendar" className="transition hover:text-foreground">Agendar</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground-subtle">Horário</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground-muted">
              <li className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 text-accent" /> Seg–Sex 09h–20h · Sáb 09h–18h</li>
              <li className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 text-accent" /> {shop.phone}</li>
              <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 text-accent" /> {shop.email}</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground-subtle">Visite-nos</h4>
            <p className="mt-4 flex items-start gap-2 text-sm text-foreground-muted">
              <MapPin className="mt-0.5 h-4 w-4 text-accent" /> {shop.address}
            </p>
            <Link href="/agendar" className="btn-primary mt-5 w-full">
              Agendar horário
            </Link>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-foreground-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} {shop.name}. Todos os direitos reservados.</p>
          <p>Potencializado por Vanguard SaaS</p>
        </div>
      </div>
    </footer>
  );
}
