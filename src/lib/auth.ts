import crypto from "crypto";
import { cookies } from "next/headers";
import { getUserByEmail, getDB, mutate } from "./db";
import { verifyPassword } from "./db";
import { Barbershop } from "./types";

const SECRET = process.env.SESSION_SECRET || "vanguard-dev-secret";
export const SESSION_COOKIE = "vanguard_session";

export interface Session {
  userId: string;
  barbershopId: string;
  email: string;
  name: string;
  role: string;
}

function sign(obj: Session): string {
  const payload = Buffer.from(JSON.stringify(obj)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token: string): Session | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setSession(session: Session) {
  cookies().set(SESSION_COOKIE, sign(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}

export function authenticate(
  email: string,
  password: string
): { session: Session; barbershop: Barbershop } | null {
  const db = getDB();
  const user = getUserByEmail(email);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  const barbershop = db.barbershops.find((b) => b.id === user.barbershopId);
  if (!barbershop) return null;
  const session: Session = {
    userId: user.id,
    barbershopId: user.barbershopId,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  return { session, barbershop };
}

export function requireSession(): Session {
  const s = getSession();
  if (!s) throw new AuthError("unauthorized");
  return s;
}

export class AuthError extends Error {
  status = 401;
}

export function logActivity(barbershopId: string, title: string, message: string, type: any = "system") {
  mutate((db) => {
    db.notifications.unshift({
      id: `not_${Date.now()}`, barbershopId, type, title, message, read: false, createdAt: new Date().toISOString(),
    });
  });
}
