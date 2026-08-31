import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDB, mutate } from "@/lib/db";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const db = getDB();
  const shop = db.barbershops.find((b) => b.id === session.barbershopId);
  return NextResponse.json({ barbershop: shop });
}

export async function PATCH(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  const updated = mutate((db) => {
    const s = db.barbershops.find((x) => x.id === session.barbershopId);
    if (!s) return null;
    if (body.name !== undefined) s.name = body.name;
    if (body.tagline !== undefined) s.tagline = body.tagline;
    if (body.description !== undefined) s.description = body.description;
    if (body.address !== undefined) s.address = body.address;
    if (body.city !== undefined) s.city = body.city;
    if (body.phone !== undefined) s.phone = body.phone;
    if (body.email !== undefined) s.email = body.email;
    if (body.logo !== undefined) s.logo = body.logo;
    if (body.socials !== undefined) s.socials = { ...s.socials, ...body.socials };
    if (body.businessHours !== undefined) s.businessHours = body.businessHours;
    if (body.settings !== undefined) s.settings = { ...s.settings, ...body.settings };
    return s;
  });
  if (!updated) return NextResponse.json({ error: "Barbearia não encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true, barbershop: updated });
}
