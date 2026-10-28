import { NextResponse } from "next/server";
import { COOKIE, crearToken, pinConfigurado, pinValido } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { error, ipDe } from "@/lib/http";

export const dynamic = "force-dynamic";

const MAX_INTENTOS = 8; // por IP cada 15 minutos

export async function POST(req: Request) {
  if (!pinConfigurado()) return error("Falta configurar ADMIN_PIN en Vercel.", 500);

  const ip = ipDe(req);
  await ensureSchema();
  const db = sql();
  const [{ n }] = await db<{ n: number }[]>`
    select count(*)::int as n from intentos_login
    where ip = ${ip} and created_at > now() - interval '15 minutes'`;
  if (n >= MAX_INTENTOS) return error("Demasiados intentos. Espera 15 minutos.", 429);

  let pin = "";
  try {
    pin = String((await req.json()).pin ?? "");
  } catch {}

  if (!pinValido(pin)) {
    await db`insert into intentos_login (ip) values (${ip})`;
    await db`delete from intentos_login where created_at < now() - interval '1 day'`;
    await new Promise((r) => setTimeout(r, 600));
    return error("PIN incorrecto", 401);
  }

  await db`delete from intentos_login where ip = ${ip}`;
  const { token, maxAge } = crearToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
