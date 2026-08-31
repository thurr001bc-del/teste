import { NextResponse } from "next/server";
import { getDB, mutate } from "@/lib/db";
import { getAppointmentByToken } from "@/lib/queries";

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  const apt = getAppointmentByToken(params.token);
  if (!apt) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });

  mutate((db) => {
    const a = db.appointments.find((x) => x.id === apt.id)!;
    a.status = "confirmed";
    a.updatedAt = new Date().toISOString();
    const existing = db.notifications.find(
      (n) => n.relatedId === a.id && n.type === "confirmation"
    );
    if (!existing)
      db.notifications.unshift({
        id: `not_${Date.now()}`,
        barbershopId: a.barbershopId,
        type: "confirmation",
        title: "Horário confirmado",
        message: `${a.customerName} confirmou o horário de ${a.date} às ${a.startTime}.`,
        read: false,
        relatedId: a.id,
        createdAt: new Date().toISOString(),
      });
  });

  return NextResponse.json({ ok: true, status: "confirmed" });
}
