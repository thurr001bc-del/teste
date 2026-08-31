import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDB, mutate, uid } from "@/lib/db";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const db = getDB();
  const barbers = db.barbers.filter((b) => b.barbershopId === session.barbershopId);
  return NextResponse.json({ barbers });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  const barber = mutate((db) => {
    const b = {
      id: uid("bar"),
      barbershopId: session.barbershopId,
      name: body.name,
      photo: body.photo,
      bio: body.bio || "",
      specialties: body.specialties || [],
      schedule: body.schedule || db.barbers[0]?.schedule || [],
      daysOff: body.daysOff || [],
      active: body.active !== false,
    };
    db.barbers.push(b);
    return b;
  });
  return NextResponse.json({ ok: true, barber });
}
