import crypto from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "rg_admin";
const DURACION_MS = 12 * 60 * 60 * 1000; // 12 horas

function secret() {
  const pin = process.env.ADMIN_PIN || "";
  // Si cambias el PIN, todas las sesiones abiertas se cierran.
  return `${process.env.SESSION_SECRET || "rg"}::${pin}`;
}

function firmar(valor: string) {
  return crypto.createHmac("sha256", secret()).update(valor).digest("base64url");
}

function igual(a: string, b: string) {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function pinConfigurado() {
  return Boolean(process.env.ADMIN_PIN);
}

export function pinValido(pin: string) {
  const real = process.env.ADMIN_PIN;
  if (!real) return false;
  return igual(pin.trim(), real.trim());
}

export function crearToken() {
  const exp = String(Date.now() + DURACION_MS);
  return { token: `${exp}.${firmar(exp)}`, maxAge: DURACION_MS / 1000 };
}

export function tokenValido(token?: string) {
  if (!token || !pinConfigurado()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  if (!igual(sig, firmar(exp))) return false;
  return Number(exp) > Date.now();
}

export async function esAdmin() {
  const jar = await cookies();
  return tokenValido(jar.get(COOKIE)?.value);
}
