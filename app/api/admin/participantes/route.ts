import { ensureSchema, sql, type Participante } from "@/lib/db";
import { error, json, requireAdmin } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const no = await requireAdmin();
  if (no) return no;
  await ensureSchema();
  const db = sql();
  const participantes = await db<Participante[]>`
    select id, nombres, apellidos, telefono, correo, mascota, tipo_mascota, raza, ciudad, created_at
    from participantes order by id desc`;
  const ganadores = await db<{ id: number; participante_id: number; created_at: string }[]>`
    select id, participante_id, created_at from ganadores order by id asc`;
  return json({ ok: true, participantes, ganadores });
}

export async function DELETE(req: Request) {
  const no = await requireAdmin();
  if (no) return no;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return error("id inválido");
  await ensureSchema();
  await sql()`delete from participantes where id = ${id}`;
  return json({ ok: true });
}
