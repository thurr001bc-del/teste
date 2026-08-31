import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDB, mutate, uid } from "@/lib/db";

function ordered(db: ReturnType<typeof getDB>, barbershopId: string) {
  return db.collections
    .filter((c) => c.barbershopId === barbershopId)
    .sort((a, b) => (a.featured === b.featured ? (a.order - b.order) || a.name.localeCompare(b.name) : a.featured ? -1 : 1));
}

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const db = getDB();
  return NextResponse.json({ collections: ordered(db, session.barbershopId) });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  if (!body.name || !body.name.trim()) return NextResponse.json({ error: "Informe o nome da coleção." }, { status: 400 });
  const collection = mutate((db) => {
    const maxOrder = db.collections
      .filter((c) => c.barbershopId === session.barbershopId)
      .reduce((m, c) => Math.max(m, c.order), -1);
    const c = {
      id: uid("col"),
      barbershopId: session.barbershopId,
      name: body.name.trim(),
      featured: false,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };
    db.collections.push(c);
    return c;
  });
  return NextResponse.json({ ok: true, collection });
}
