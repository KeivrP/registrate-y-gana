import { NextResponse } from "next/server";
import { esAdmin } from "./auth";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function error(mensaje: string, status = 400) {
  return json({ ok: false, error: mensaje }, status);
}

/** Devuelve una respuesta 401 si no hay sesión de admin, o null si todo bien. */
export async function requireAdmin() {
  if (!(await esAdmin())) return error("No autorizado", 401);
  return null;
}

export function ipDe(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "desconocida").trim();
}
