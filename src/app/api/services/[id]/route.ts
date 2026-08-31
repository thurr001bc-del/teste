import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { mutate } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  const updated = mutate((db) => {
    const s = db.services.find((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (!s) return null;
    if (body.name !== undefined) s.name = body.name;
    if (body.description !== undefined) s.description = body.description;
    if (body.price !== undefined) s.price = Number(body.price);
    if (body.duration !== undefined) s.duration = Number(body.duration);
    if (body.image !== undefined) s.image = body.image;
    if (body.barberIds !== undefined) s.barberIds = body.barberIds;
    if (body.active !== undefined) s.active = body.active;
    return s;
  });
  if (!updated) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true, service: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  mutate((db) => {
    const idx = db.services.findIndex((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (idx >= 0) db.services.splice(idx, 1);
  });
  return NextResponse.json({ ok: true });
}
