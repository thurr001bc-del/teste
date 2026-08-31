import { NextResponse } from "next/server";
import { authenticate, setSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json({ error: "Preencha e-mail e senha." }, { status: 400 });
    const result = authenticate(email, password);
    if (!result)
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    setSession(result.session);
    return NextResponse.json({
      ok: true,
      user: result.session,
      barbershop: { id: result.barbershop.id, name: result.barbershop.name, slug: result.barbershop.slug },
    });
  } catch (e) {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
