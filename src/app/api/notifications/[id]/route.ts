import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { mutate } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const updated = mutate((db) => {
    const n = db.notifications.find((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (!n) return null;
    n.read = true;
    return n;
  });
  if (!updated) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  mutate((db) => {
    const idx = db.notifications.findIndex((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (idx >= 0) db.notifications.splice(idx, 1);
  });
  return NextResponse.json({ ok: true });
}
