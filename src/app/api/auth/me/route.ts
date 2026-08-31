import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET() {
  const session = getSession();
  if (!session)
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const db = getDB();
  const shop = db.barbershops.find((b) => b.id === session.barbershopId);
  const notifications = db.notifications
    .filter((n) => n.barbershopId === session.barbershopId)
    .slice(0, 12);
  return NextResponse.json({
    user: session,
    barbershop: shop,
    notifications,
    unread: notifications.filter((n) => !n.read).length,
  });
}
