import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { mutate } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  mutate((db) => {
    const idx = db.blockedTimes.findIndex(
      (b) => b.id === params.id && b.barbershopId === session.barbershopId
    );
    if (idx >= 0) db.blockedTimes.splice(idx, 1);
  });
  return NextResponse.json({ ok: true });
}
