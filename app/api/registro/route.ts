import { ensureSchema, sql } from "@/lib/db";
import { error, json } from "@/lib/http";

export const dynamic = "force-dynamic";

const TIPOS = ["Perro", "Gato", "Perro y gato", "Otro"];
const CAMPOS = ["nombres", "apellidos", "telefono", "correo", "mascota", "tipo_mascota", "raza", "ciudad"] as const;
type Campo = (typeof CAMPOS)[number];

function limpiar(v: unknown) {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, 100) : "";
}

function normalizarTelefono(t: string) {
  let d = t.replace(/\D/g, "");
  if (d.startsWith("58") && d.length === 12) d = "0" + d.slice(2); // +58 414... → 0414...
  if (d.length === 10 && d.startsWith("4")) d = "0" + d; // 414... → 0414...
  return d;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return error("Solicitud inválida");
  }

  // Honeypot anti-bots: campo oculto que una persona nunca llena.
  if (limpiar(body.website)) return json({ ok: true, numero: 0 });

  const d = Object.fromEntries(CAMPOS.map((c) => [c, limpiar(body[c])])) as Record<Campo, string>;

  const faltan = CAMPOS.filter((c) => !d[c]);
  if (faltan.length) return error("Completa todos los campos.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.correo)) return error("El correo no es válido.");
  const tel = normalizarTelefono(d.telefono);
  if (tel.length < 7 || tel.length > 15) return error("El teléfono no es válido.");
  if (!TIPOS.includes(d.tipo_mascota)) return error("Selecciona el tipo de mascota.");
  if (body.acepto !== true) return error("Debes aceptar las condiciones para participar.");

  try {
    await ensureSchema();
    const db = sql();
    const [row] = await db<{ id: number }[]>`
      insert into participantes
        (nombres, apellidos, telefono, correo, mascota, tipo_mascota, raza, ciudad, telefono_norm, correo_norm)
      values
        (${d.nombres}, ${d.apellidos}, ${d.telefono}, ${d.correo}, ${d.mascota}, ${d.tipo_mascota},
         ${d.raza}, ${d.ciudad}, ${tel}, ${d.correo.toLowerCase()})
      returning id`;
    return json({ ok: true, numero: row.id });
  } catch (e: unknown) {
    const err = e as { code?: string; constraint_name?: string };
    if (err.code === "23505") {
      const cual = err.constraint_name?.includes("correo") ? "correo" : "teléfono";
      return error(`Ya hay un registro con ese ${cual}. ¡Ya estás participando!`, 409);
    }
    console.error("registro", e);
    return error("No pudimos guardar tu registro. Intenta de nuevo.", 500);
  }
}
