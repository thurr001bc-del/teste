import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { mutate } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  const updated = mutate((db) => {
    const b = db.barbers.find((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (!b) return null;
    if (body.name !== undefined) b.name = body.name;
    if (body.photo !== undefined) b.photo = body.photo;
    if (body.bio !== undefined) b.bio = body.bio;
    if (body.specialties !== undefined) b.specialties = body.specialties;
    if (body.schedule !== undefined) b.schedule = body.schedule;
    if (body.daysOff !== undefined) b.daysOff = body.daysOff;
    if (body.active !== undefined) b.active = body.active;
    return b;
  });
  if (!updated) return NextResponse.json({ error: "Barbeiro não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true, barber: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  mutate((db) => {
    const idx = db.barbers.findIndex((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (idx >= 0) db.barbers.splice(idx, 1);
  });
  return NextResponse.json({ ok: true });
}
