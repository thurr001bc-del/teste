import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDB, mutate, uid } from "@/lib/db";
import { todayISO } from "@/lib/utils";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const db = getDB();
  const txs = db.transactions
    .filter((t) => t.barbershopId === session.barbershopId)
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  return NextResponse.json({ transactions: txs });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  const type = body.type === "income" || body.type === "expense" ? body.type : null;
  const description = (body.description || "").trim();
  const amount = Number(body.amount);
  const date = body.date || todayISO();
  if (!type) return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  if (!description) return NextResponse.json({ error: "Informe a descrição." }, { status: 400 });
  if (!(amount > 0)) return NextResponse.json({ error: "Informe um valor válido." }, { status: 400 });

  const tx = mutate((db) => {
    const t = {
      id: uid("tx"),
      barbershopId: session.barbershopId,
      type,
      description,
      amount: Math.round(amount * 100) / 100,
      date,
      createdAt: new Date().toISOString(),
    };
    db.transactions.push(t);
    return t;
  });
  return NextResponse.json({ ok: true, transaction: tx });
}
