import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { mutate } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  const updated = mutate((db) => {
    const o = db.orders.find((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (!o) return null;
    if (body.status) o.status = body.status;
    return o;
  });
  if (!updated) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true, order: updated });
}
