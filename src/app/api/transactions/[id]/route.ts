import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { mutate } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  const updated = mutate((db) => {
    const t = db.transactions.find((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (!t) return null;
    if (body.type === "income" || body.type === "expense") t.type = body.type;
    if (typeof body.description === "string" && body.description.trim()) t.description = body.description.trim();
    if (typeof body.amount === "number" && body.amount > 0) t.amount = Math.round(body.amount * 100) / 100;
    if (typeof body.date === "string" && body.date) t.date = body.date;
    return t;
  });
  if (!updated) return NextResponse.json({ error: "Movimentação não encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true, transaction: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  mutate((db) => {
    const idx = db.transactions.findIndex((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (idx >= 0) db.transactions.splice(idx, 1);
  });
  return NextResponse.json({ ok: true });
}
