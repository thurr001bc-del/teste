import { Avatar } from "@/components/ui/avatar";
import { Barber, Service } from "@/lib/types";

export function BarberCard({ barber, services }: { barber: Barber; services: Service[] }) {
  const specs = barber.specialties
    .map((id) => services.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3);
  return (
    <div className="card group h-full overflow-hidden p-0 transition duration-300 hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex flex-col items-center p-6 text-center">
        <Avatar name={barber.name} src={barber.photo} size="xl" className="ring-2 ring-accent/20" />
        <h3 className="mt-4 text-base font-semibold text-foreground">{barber.name}</h3>
        <p className="mt-1 text-xs text-foreground-muted">{barber.bio}</p>
      </div>
      <div className="border-t border-border bg-surface-2/50 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">Especialidades</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {specs.length ? (
            specs.map((s) => (
              <span key={s} className="chip">{s}</span>
            ))
          ) : (
            <span className="text-xs text-foreground-subtle">Geral</span>
          )}
        </div>
      </div>
    </div>
  );
}
