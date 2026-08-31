import Link from "next/link";
import { Scissors, Clock, Star, MapPin, ArrowRight, Check, Sparkles, Shield, CalendarCheck } from "lucide-react";
import { getPublicData } from "@/lib/queries";
import { getDefaultBarbershop } from "@/lib/db";
import { Reveal } from "@/components/ui/reveal";
import { Avatar } from "@/components/ui/avatar";
import { formatBRL } from "@/lib/utils";
import { productImages, categoryLabel } from "@/lib/product-images";
import { ServiceCard } from "@/components/site/service-card";
import { BarberCard } from "@/components/site/barber-card";

const TESTIMONIALS = [
  { name: "João Silva", text: "Melhor experiência de barbearia que já tive. Pontualidade e acabamento impecáveis.", rating: 5 },
  { name: "Pedro Henrique", text: "Agendei pelo site em segundos e recebi confirmação no WhatsApp. Muito profissional.", rating: 5 },
  { name: "Marcelo Andrade", text: "Ambiente premium e barbeiros competentes. Virei cliente fixo.", rating: 5 },
];

export default function HomePage() {
  const data = getPublicData("vanguard");
  const shop = getDefaultBarbershop();
  if (!data) return null;
  const { services, barbers, products } = data;

  return (
    <>
      {/* HERO */}
      <section id="inicio" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-accent-soft/60 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
          <div>
            <Reveal>
              <span className="chip mb-5">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> {shop.tagline}
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
                {shop.settings.heroHeadline}
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-foreground-muted">
                {shop.settings.heroSubline}
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/agendar" className="btn-primary px-6 py-3 text-base">
                  <CalendarCheck className="h-5 w-5" /> Agendar horário
                </Link>
                <Link href="/produtos" className="btn-outline px-6 py-3 text-base">
                  Ver produtos <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-8">
                {[
                  { v: "8+", l: "Anos de estúdio" },
                  { v: "12k", l: "Clientes atendidos" },
                  { v: "4.9", l: "Avaliação média" },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="font-display text-2xl font-bold text-foreground">{s.v}</p>
                    <p className="mt-0.5 text-xs text-foreground-muted">{s.l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-border shadow-elevated">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1100&q=80"
                alt="Interior da barbearia Vanguard"
                className="h-[420px] w-full object-cover sm:h-[520px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-6 left-5 right-5 flex items-center justify-between rounded-2xl border border-border bg-surface/90 px-5 py-4 shadow-elevated backdrop-blur-xl sm:left-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Scissors className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Próxima vaga</p>
                  <p className="text-xs text-foreground-muted">Hoje · 15:30 — Lucas</p>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-success">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-xs font-semibold">4.9</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Serviços</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Cuidados pensados em cada detalhe
          </h2>
          <p className="mt-3 text-foreground-muted">
            Do corte clássico ao platinado completo. Escolha, agende e relaxe.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.05}>
              <ServiceCard service={s} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* SOBRE */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
          <Reveal className="relative order-2 lg:order-1">
            <div className="overflow-hidden rounded-3xl border border-border shadow-elevated">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1599351431202-1e0f224fce2d?auto=format&fit=crop&w=1000&q=80"
                alt="Atendimento na barbearia"
                className="h-[380px] w-full object-cover sm:h-[460px]"
              />
            </div>
          </Reveal>
          <div className="order-1 lg:order-2">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Sobre</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Uma experiência, não apenas um corte
              </h2>
              <p className="mt-4 leading-relaxed text-foreground-muted">{shop.description}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: Shield, t: "Profissionais especializados e selecionados" },
                  { icon: Clock, t: "Agendamento inteligente sem conflitos" },
                  { icon: Sparkles, t: "Produtos premium e finalização impecável" },
                ].map((f) => (
                  <li key={f.t} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <f.icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-foreground">{f.t}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.15}>
              <Link href="/agendar" className="btn-primary mt-8 px-6 py-3 text-base">
                Agendar agora <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* BARBEIROS */}
      <section id="barbeiros" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Time</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Conheça nossos barbeiros
          </h2>
          <p className="mt-3 text-foreground-muted">Escolha seu profissional favorito no agendamento.</p>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {barbers.map((b, i) => (
            <Reveal key={b.id} delay={i * 0.05}>
              <BarberCard barber={b} services={services} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* PRODUTOS */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Vitrine</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Produtos que usamos e recomendamos
              </h2>
            </div>
            <Link href="/produtos" className="btn-outline">
              Ver loja completa <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}>
                <Link href={`/produtos/${p.id}`} className="card group block overflow-hidden p-0 transition hover:shadow-elevated">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={productImages(p)[0]} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wide text-foreground-subtle">{categoryLabel(p.category)}</p>
                    <h3 className="mt-1 font-semibold text-foreground">{p.name}</h3>
                    <p className="mt-2 font-display text-lg font-bold text-accent">{formatBRL(p.price, shop.settings.currency)}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* AVALIAÇÕES */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Avaliações</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Quem passa, volta
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.05}>
              <div className="card h-full p-6">
                <div className="flex gap-1 text-accent">
                  {Array.from({ length: t.rating }).map((_, k) => (
                    <Star key={k} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground">"{t.text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <Avatar name={t.name} size="sm" />
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-5 pb-20 sm:px-8">
        <Reveal>
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-border bg-surface px-6 py-14 text-center shadow-elevated sm:px-12">
            <div className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent-soft blur-3xl" />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Pronto para renovar o visual?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-foreground-muted">
              Garanta seu horário em segundos. Confirmamos tudo pelo WhatsApp.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/agendar" className="btn-primary px-7 py-3.5 text-base">
                <CalendarCheck className="h-5 w-5" /> Agendar horário
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
