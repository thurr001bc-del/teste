import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { mutate } from "@/lib/db";
import { logActivity } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  try {
    const body = await req.json();
    const updated = mutate((db) => {
      const apt = db.appointments.find(
        (a) => a.id === params.id && a.barbershopId === session.barbershopId
      );
      if (!apt) return null;
      if (body.status) apt.status = body.status;
      if (body.barberId) apt.barberId = body.barberId;
      if (body.notes !== undefined) apt.notes = body.notes;
      if (body.date) apt.date = body.date;
      if (body.startTime) {
        apt.startTime = body.startTime;
        const [h, m] = body.startTime.split(":").map(Number);
        const end = h * 60 + m + apt.duration;
        apt.endTime = `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
      }
      apt.updatedAt = new Date().toISOString();
      return apt;
    });
    if (!updated) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true, appointment: updated });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  mutate((db) => {
    const idx = db.appointments.findIndex(
      (a) => a.id === params.id && a.barbershopId === session.barbershopId
    );
    if (idx >= 0) db.appointments.splice(idx, 1);
  });
  return NextResponse.json({ ok: true });
}
