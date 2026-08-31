import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDB, mutate, uid } from "@/lib/db";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const db = getDB();
  const customers = db.customers
    .filter((c) => c.barbershopId === session.barbershopId)
    .map((c) => {
      const apts = db.appointments.filter((a) => a.customerId === c.id && a.barbershopId === c.barbershopId);
      const sorted = [...apts].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
      return {
        ...c,
        totalAppointments: apts.length,
        lastAppointment: sorted.filter((a) => a.status !== "cancelled").slice(-1)[0]?.date || null,
        nextAppointment: sorted.find((a) => a.date >= new Date().toISOString().slice(0, 10) && a.status !== "cancelled")?.date || null,
      };
    })
    .sort((a, b) => b.totalAppointments - a.totalAppointments);
  return NextResponse.json({ customers });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  if (!body.name || !body.phone) return NextResponse.json({ error: "Nome e telefone obrigatórios." }, { status: 400 });
  const customer = mutate((db) => {
    const c = { id: uid("cust"), barbershopId: session.barbershopId, name: body.name, phone: body.phone, email: body.email, notes: body.notes, createdAt: new Date().toISOString() };
    db.customers.push(c);
    return c;
  });
  return NextResponse.json({ ok: true, customer });
}
