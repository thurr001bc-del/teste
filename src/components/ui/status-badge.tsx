import { AppointmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const STATUS_META: Record<
  AppointmentStatus,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  requested: { label: "Aguardando confirmação", dot: "bg-warning", text: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  confirmed: { label: "Confirmado", dot: "bg-success", text: "text-success", bg: "bg-success/10", border: "border-success/30" },
  in_progress: { label: "Em atendimento", dot: "bg-info", text: "text-info", bg: "bg-info/10", border: "border-info/30" },
  completed: { label: "Atendido", dot: "bg-accent", text: "text-accent", bg: "bg-accent/10", border: "border-accent/30" },
  rescheduled: { label: "Remarcação solicitada", dot: "bg-warning", text: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  cancelled: { label: "Cancelado", dot: "bg-danger", text: "text-danger", bg: "bg-danger/10", border: "border-danger/30" },
  no_show: { label: "Não compareceu", dot: "bg-danger", text: "text-danger", bg: "bg-danger/10", border: "border-danger/30" },
};

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        m.bg,
        m.text,
        m.border,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}
