import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { mutate } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  const updated = mutate((db) => {
    const c = db.collections.find((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (!c) return null;
    if (typeof body.name === "string" && body.name.trim()) {
      const newName = body.name.trim();
      if (newName !== c.name) {
        // keep products grouped: update their category to the new name
        db.products.forEach((p) => {
          if (p.barbershopId === session.barbershopId && p.category === c.name) p.category = newName;
        });
        c.name = newName;
      }
    }
    if (typeof body.featured === "boolean") c.featured = body.featured;
    if (typeof body.order === "number") c.order = body.order;
    return c;
  });
  if (!updated) return NextResponse.json({ error: "Coleção não encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true, collection: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  mutate((db) => {
    const idx = db.collections.findIndex((x) => x.id === params.id && x.barbershopId === session.barbershopId);
    if (idx < 0) return;
    const removed = db.collections[idx];
    db.collections.splice(idx, 1);
    // reassign products of the removed collection to the first remaining one
    const remaining = db.collections.find((c) => c.barbershopId === session.barbershopId);
    db.products.forEach((p) => {
      if (p.barbershopId === session.barbershopId && p.category === removed.name) {
        p.category = remaining ? remaining.name : "";
      }
    });
  });
  return NextResponse.json({ ok: true });
}
