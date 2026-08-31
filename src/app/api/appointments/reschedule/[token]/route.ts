import { NextResponse } from "next/server";
import { getDB, mutate } from "@/lib/db";
import { getAppointmentByToken } from "@/lib/queries";
import { checkSlot } from "@/lib/availability";
import { addMinutesToTime } from "@/lib/utils";

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  const apt = getAppointmentByToken(params.token);
  if (!apt) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });

  const body = await req.json();
  const { date, startTime, barberId } = body;
  if (!date || !startTime)
    return NextResponse.json({ error: "Informe data e horário." }, { status: 400 });

  const db = getDB();
  const check = checkSlot(db, {
    barbershopId: apt.barbershopId,
    serviceId: apt.serviceId,
    date,
    start: startTime,
    barberId: barberId || apt.barberId,
    excludeAppointmentId: apt.id,
  });
  if (!check.free)
    return NextResponse.json(
      { error: "Esse horário acabou de ser reservado. Escolha outro horário." },
      { status: 409 }
    );

  mutate((d) => {
    const a = d.appointments.find((x) => x.id === apt.id)!;
    a.date = date;
    a.startTime = startTime;
    a.endTime = addMinutesToTime(startTime, a.duration);
    a.barberId = check.barberId!;
    a.status = "confirmed";
    a.updatedAt = new Date().toISOString();
    d.notifications.unshift({
      id: `not_${Date.now()}`,
      barbershopId: a.barbershopId,
      type: "reschedule",
      title: "Horário remarcado",
      message: `${a.customerName} remarcou para ${date} às ${startTime}.`,
      read: false,
      relatedId: a.id,
      createdAt: new Date().toISOString(),
    });
  });

  return NextResponse.json({ ok: true, status: "confirmed" });
}
