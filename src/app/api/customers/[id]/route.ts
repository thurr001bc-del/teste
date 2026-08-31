import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { mutate } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  const updated = mutate((db) => {
    const c = db.customers.find((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (!c) return null;
    if (body.name !== undefined) c.name = body.name;
    if (body.phone !== undefined) c.phone = body.phone;
    if (body.email !== undefined) c.email = body.email;
    if (body.notes !== undefined) c.notes = body.notes;
    return c;
  });
  if (!updated) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true, customer: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  mutate((db) => {
    const idx = db.customers.findIndex((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (idx >= 0) db.customers.splice(idx, 1);
  });
  return NextResponse.json({ ok: true });
}
