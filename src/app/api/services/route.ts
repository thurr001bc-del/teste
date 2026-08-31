import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDB, mutate, uid } from "@/lib/db";
import { getPublicData } from "@/lib/queries";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const db = getDB();
  const services = db.services.filter((s) => s.barbershopId === session.barbershopId);
  return NextResponse.json({ services });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  const service = mutate((db) => {
    const s = {
      id: uid("svc"),
      barbershopId: session.barbershopId,
      name: body.name,
      description: body.description || "",
      price: Number(body.price) || 0,
      duration: Number(body.duration) || 30,
      image: body.image,
      barberIds: body.barberIds || db.barbers.filter((b)=>b.barbershopId===session.barbershopId).map((b)=>b.id),
      active: body.active !== false,
    };
    db.services.push(s);
    return s;
  });
  return NextResponse.json({ ok: true, service });
}
