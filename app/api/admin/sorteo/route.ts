import crypto from "node:crypto";
import { ensureSchema, sql, type Participante } from "@/lib/db";
import { error, json, requireAdmin } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Sortea un ganador entre quienes aún no han ganado. */
export async function POST() {
  const no = await requireAdmin();
  if (no) return no;
  await ensureSchema();
  const db = sql();

  const elegibles = await db<{ id: number }[]>`
    select p.id from participantes p
    where not exists (select 1 from ganadores g where g.participante_id = p.id)`;
  if (elegibles.length === 0) return error("No quedan participantes por sortear.", 409);

  // Aleatorio criptográficamente seguro (sin sesgo).
  const elegido = elegibles[crypto.randomInt(elegibles.length)].id;
  await db`insert into ganadores (participante_id) values (${elegido})`;
  const [p] = await db<Participante[]>`
    select id, nombres, apellidos, telefono, correo, mascota, tipo_mascota, raza, ciudad, created_at
    from participantes where id = ${elegido}`;
  return json({ ok: true, ganador: p, elegibles: elegibles.length });
}

/** Quita un ganador (?id=participante) o reinicia todos (?todos=1). */
export async function DELETE(req: Request) {
  const no = await requireAdmin();
  if (no) return no;
  await ensureSchema();
  const db = sql();
  const q = new URL(req.url).searchParams;
  if (q.get("todos") === "1") {
    await db`delete from ganadores`;
  } else {
    const id = Number(q.get("id"));
    if (!Number.isInteger(id) || id <= 0) return error("id inválido");
    await db`delete from ganadores where participante_id = ${id}`;
  }
  return json({ ok: true });
}
