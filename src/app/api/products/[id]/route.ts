import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { mutate } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  const updated = mutate((db) => {
    const p = db.products.find((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (!p) return null;
    if (body.name !== undefined) p.name = body.name;
    if (body.description !== undefined) p.description = body.description;
    if (body.price !== undefined) p.price = Number(body.price);
    if (body.images !== undefined) p.images = Array.isArray(body.images) ? body.images.slice(0, 5).filter((x: string) => x) : p.images;
    if (body.category !== undefined) p.category = body.category;
    if (body.stock !== undefined) p.stock = Number(body.stock);
    if (body.sku !== undefined) p.sku = body.sku;
    if (body.active !== undefined) p.active = body.active;
    return p;
  });
  if (!updated) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true, product: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  mutate((db) => {
    const idx = db.products.findIndex((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (idx >= 0) db.products.splice(idx, 1);
  });
  return NextResponse.json({ ok: true });
}
