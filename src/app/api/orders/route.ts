import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDB, mutate, uid } from "@/lib/db";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const db = getDB();
  const orders = db.orders
    .filter((o) => o.barbershopId === session.barbershopId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  const { items, customerName, customerPhone } = body;
  if (!items || !Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
  const total = items.reduce((s: number, i: any) => s + i.price * i.qty, 0);
  const order = mutate((db) => {
    const o = {
      id: uid("ord"),
      barbershopId: session.barbershopId,
      customerName: customerName || "Cliente online",
      customerPhone,
      items: items.map((i: any) => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty })),
      total,
      status: "reserved" as const,
      createdAt: new Date().toISOString(),
    };
    db.orders.push(o);
    // decrement stock
    items.forEach((i: any) => {
      const p = db.products.find((x) => x.id === i.productId && x.barbershopId === session.barbershopId);
      if (p) p.stock = Math.max(0, p.stock - i.qty);
    });
    return o;
  });
  return NextResponse.json({ ok: true, order });
}
