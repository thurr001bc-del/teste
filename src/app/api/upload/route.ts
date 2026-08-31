import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uid } from "@/lib/db";
import fs from "fs";
import path from "path";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Envie apenas imagens." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Imagem muito grande (máx. 5MB)." }, { status: 400 });

  const ext = EXT[file.type] || (file.name.split(".").pop() || "jpg").toLowerCase();
  const filename = `${uid("img")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, filename), buffer);

  return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
}
