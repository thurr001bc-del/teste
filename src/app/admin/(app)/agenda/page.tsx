import { getSession } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { getShopAppointments } from "@/lib/queries";
import { CalendarView } from "@/components/admin/calendar-view";
import { PageHeader } from "@/components/admin/page-header";

export default function AgendaPage() {
  const session = getSession()!;
  const db = getDB();
  const shop = db.barbershops.find((b) => b.id === session.barbershopId)!;
  const barbers = db.barbers.filter((b) => b.barbershopId === session.barbershopId);
  const services = db.services.filter((s) => s.barbershopId === session.barbershopId);
  const appointments = getShopAppointments(session.barbershopId);

  return (
    <div>
      <PageHeader title="Agenda" description="Visualize e gerencie os agendamentos em dia, semana ou mês." />
      <CalendarView shop={shop} barbers={barbers} services={services} initial={appointments} />
    </div>
  );
}
