import Link from "next/link";
import { Scissors, Clock, ArrowRight } from "lucide-react";
import { Service } from "@/lib/types";
import { formatBRL } from "@/lib/utils";

export function ServiceCard({ service, currency = "R$" }: { service: Service; currency?: string }) {
  return (
    <Link
      href={`/agendar?servico=${service.id}`}
      className="card group flex h-full flex-col p-6 transition duration-300 hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent transition group-hover:scale-105">
          <Scissors className="h-5 w-5" />
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground-subtle">
          <Clock className="h-3.5 w-3.5" /> {service.duration} min
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">{service.name}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-foreground-muted">
        {service.description}
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <span className="font-display text-xl font-bold text-foreground">
          {formatBRL(service.price, currency)}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent opacity-0 transition group-hover:opacity-100">
          Agendar <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
