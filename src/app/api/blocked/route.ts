import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDB, mutate, uid } from "@/lib/db";

export async function GET(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const db = getDB();
  let blocks = db.blockedTimes.filter((b) => b.barbershopId === session.barbershopId);
  if (date) blocks = blocks.filter((b) => b.date === date);
  return NextResponse.json({ blockedTimes: blocks });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  if (!body.date || !body.start || !body.end)
    return NextResponse.json({ error: "Datas incompletas." }, { status: 400 });
  const block = mutate((db) => {
    const b = { id: uid("blk"), barbershopId: session.barbershopId, barberId: body.barberId || undefined, date: body.date, start: body.start, end: body.end, reason: body.reason };
    db.blockedTimes.push(b);
    return b;
  });
  return NextResponse.json({ ok: true, blockedTime: block });
}
