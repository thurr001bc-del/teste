import { NextResponse } from "next/server";
import { getDB, mutate, uid, token } from "@/lib/db";
import { checkSlot } from "@/lib/availability";
import { addMinutesToTime } from "@/lib/utils";
import { logActivity } from "@/lib/auth";
import { DEFAULT_SLUG } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = body.slug || DEFAULT_SLUG;
    const {
      serviceId,
      barberId,
      date,
      start,
      customerName,
      customerPhone,
      customerEmail,
      notes,
    } = body;

    if (!serviceId || !date || !start || !customerName || !customerPhone)
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });

    const db = getDB();
    const shop = db.barbershops.find((b) => b.slug === slug);
    if (!shop) return NextResponse.json({ error: "Barbearia não encontrada." }, { status: 404 });
    const service = db.services.find((s) => s.id === serviceId && s.barbershopId === shop.id);
    if (!service) return NextResponse.json({ error: "Serviço inválido." }, { status: 400 });

    const targetBarber = barberId && barberId !== "any" ? barberId : null;
    const check = checkSlot(db, {
      barbershopId: shop.id,
      serviceId,
      date,
      start,
      barberId: targetBarber,
    });

    // CRITICAL RULE: backend is the source of truth. Re-validate at creation time.
    if (!check.free || !check.barberId) {
      return NextResponse.json(
        { error: "Esse horário acabou de ser reservado. Escolha outro horário." },
        { status: 409 }
      );
    }

    const assignedBarber = check.barberId;
    const end = addMinutesToTime(start, service.duration);

    const result = mutate((d) => {
      let customer = d.customers.find(
        (c) => c.barbershopId === shop.id && c.phone === customerPhone
      );
      if (!customer) {
        customer = {
          id: uid("cust"),
          barbershopId: shop.id,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          createdAt: new Date().toISOString(),
        };
        d.customers.push(customer);
      } else if (customerEmail && !customer.email) {
        customer.email = customerEmail;
      }

      const appointment = {
        id: uid("apt"),
        barbershopId: shop.id,
        customerId: customer.id,
        customerName,
        customerPhone,
        customerEmail,
        serviceId,
        barberId: assignedBarber,
        date,
        startTime: start,
        endTime: end,
        duration: service.duration,
        price: service.price,
        status: "requested" as const,
        token: token(28),
        notes,
        source: "public" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      d.appointments.push(appointment);
      d.notifications.unshift({
        id: uid("not"),
        barbershopId: shop.id,
        type: "new_booking",
        title: "Novo agendamento",
        message: `${customerName} agendou ${service.name} para ${date} às ${start}.`,
        read: false,
        relatedId: appointment.id,
        createdAt: new Date().toISOString(),
      });
      return { appointment, customer };
    });

    return NextResponse.json({
      ok: true,
      appointment: result.appointment,
      token: result.appointment.token,
    });
  } catch (e) {
    return NextResponse.json({ error: "Erro ao criar agendamento." }, { status: 500 });
  }
}
