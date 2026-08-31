import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDB, mutate, uid } from "@/lib/db";

export async function GET(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const db = getDB();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  let products = db.products.filter((p) => p.barbershopId === session.barbershopId);
  if (category) products = products.filter((p) => p.category === category);
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  const product = mutate((db) => {
    const p = {
      id: uid("prd"),
      barbershopId: session.barbershopId,
      name: body.name,
      description: body.description || "",
      price: Number(body.price) || 0,
      images: Array.isArray(body.images) ? body.images.slice(0, 5).filter((x: string) => x) : [],
      category: body.category || "Acessórios",
      stock: Number(body.stock) || 0,
      sku: body.sku,
      active: body.active !== false,
    };
    db.products.push(p);
    return p;
  });
  return NextResponse.json({ ok: true, product });
}
