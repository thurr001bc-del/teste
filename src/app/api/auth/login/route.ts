import { NextResponse } from "next/server";
import { authenticate, setSession } from "@/lib/auth";

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 10;
const LOCKOUT_TIME = 15 * 60 * 1000;

function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIP) return realIP;
  return "unknown";
}

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (attempt && attempt.count >= MAX_ATTEMPTS && now - attempt.lastAttempt < LOCKOUT_TIME) {
    const res = NextResponse.json({ error: "Muitas tentativas de login. Tente novamente mais tarde." }, { status: 429 });
    res.headers.set("Retry-After", String(Math.ceil((LOCKOUT_TIME - (now - attempt.lastAttempt)) / 1000)));
    return res;
  }

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      const res = NextResponse.json({ error: "Preencha e-mail e senha." }, { status: 400 });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
    const result = authenticate(email, password);
    if (!result) {
      loginAttempts.set(ip, { count: (attempt?.count || 0) + 1, lastAttempt: now });
      const res = NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
    loginAttempts.delete(ip);
    setSession(result.session);
    const res = NextResponse.json({
      ok: true,
      user: result.session,
      barbershop: { id: result.barbershop.id, name: result.barbershop.name, slug: result.barbershop.slug },
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    const res = NextResponse.json({ error: "Erro interno." }, { status: 500 });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  }
}