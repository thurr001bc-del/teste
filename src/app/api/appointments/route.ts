import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDB, mutate, uid, token } from "@/lib/db";
import { checkSlot } from "@/lib/availability";
import { addMinutesToTime } from "@/lib/utils";
import { getShopAppointments } from "@/lib/queries";

export async function GET(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const barberId = searchParams.get("barberId");
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let list = getShopAppointments(session.barbershopId);
  if (date) list = list.filter((a) => a.date === date);
  if (barberId) list = list.filter((a) => a.barberId === barberId);
  if (status) list = list.filter((a) => a.status === status);
  if (customerId) list = list.filter((a) => a.customerId === customerId);
  if (from) list = list.filter((a) => a.date >= from);
  if (to) list = list.filter((a) => a.date <= to);
  return NextResponse.json({ appointments: list });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  try {
    const body = await req.json();
    const {
      serviceId,
      barberId,
      date,
      start,
      customerName,
      customerPhone,
      customerEmail,
      status,
      notes,
    } = body;
    if (!serviceId || !barberId || !date || !start || !customerName || !customerPhone)
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });

    const db = getDB();
    const service = db.services.find((s) => s.id === serviceId && s.barbershopId === session.barbershopId);
    if (!service) return NextResponse.json({ error: "Serviço inválido." }, { status: 400 });

    const check = checkSlot(db, {
      barbershopId: session.barbershopId,
      serviceId,
      date,
      start,
      barberId,
    });
    if (!check.free)
      return NextResponse.json(
        { error: "Esse horário acabou de ser reservado. Escolha outro horário." },
        { status: 409 }
      );

    const end = addMinutesToTime(start, service.duration);
    const result = mutate((d) => {
      let customer = d.customers.find(
        (c) => c.barbershopId === session.barbershopId && c.phone === customerPhone
      );
      if (!customer) {
        customer = { id: uid("cust"), barbershopId: session.barbershopId, name: customerName, phone: customerPhone, email: customerEmail, createdAt: new Date().toISOString() };
        d.customers.push(customer);
      }
      const appointment = {
        id: uid("apt"), barbershopId: session.barbershopId,
        customerId: customer.id, customerName, customerPhone, customerEmail,
        serviceId, barberId, date, startTime: start, endTime: end,
        duration: service.duration, price: service.price,
        status: (status || "confirmed") as any, token: token(28), notes,
        source: "admin" as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      d.appointments.push(appointment);
      return appointment;
    });
    return NextResponse.json({ ok: true, appointment: result });
  } catch {
    return NextResponse.json({ error: "Erro ao criar agendamento." }, { status: 500 });
  }
}
