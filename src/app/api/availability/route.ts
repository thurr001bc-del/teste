import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { availableSlots } from "@/lib/availability";
import { DEFAULT_SLUG } from "@/lib/constants";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || DEFAULT_SLUG;
  const serviceId = searchParams.get("serviceId") || "";
  const barberId = searchParams.get("barberId");
  const date = searchParams.get("date") || "";

  if (!serviceId || !date)
    return NextResponse.json({ error: "Parâmetros incompletos." }, { status: 400 });

  const db = getDB();
  const shop = db.barbershops.find((b) => b.slug === slug);
  if (!shop) return NextResponse.json({ error: "Barbearia não encontrada." }, { status: 404 });

  const targetBarber = barberId && barberId !== "any" ? barberId : null;
  const slots = availableSlots(db, {
    barbershopId: shop.id,
    serviceId,
    date,
    barberId: targetBarber,
  });
  const service = db.services.find((s) => s.id === serviceId);
  return NextResponse.json({
    date,
    serviceId,
    serviceName: service?.name,
    duration: service?.duration,
    barberId: targetBarber,
    slots,
  });
}
