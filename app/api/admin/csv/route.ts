import { ensureSchema, sql } from "@/lib/db";
import { requireAdmin } from "@/lib/http";

export const dynamic = "force-dynamic";

function celda(v: unknown) {
  let s = v instanceof Date ? v.toISOString() : String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s; // evita inyección de fórmulas en Excel
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const no = await requireAdmin();
  if (no) return no;
  await ensureSchema();
  const rows = await sql()`
    select p.id, p.nombres, p.apellidos, p.telefono, p.correo, p.mascota, p.tipo_mascota,
           p.raza, p.ciudad, p.created_at, (g.id is not null) as ganador
    from participantes p left join ganadores g on g.participante_id = p.id
    order by p.id asc`;
  const head = ["N°", "Nombres", "Apellidos", "Teléfono", "Correo", "Mascota", "Tipo", "Raza", "Ciudad", "Fecha", "Ganador"];
  const lines = [head.map(celda).join(";")];
  for (const r of rows) {
    lines.push(
      [r.id, r.nombres, r.apellidos, r.telefono, r.correo, r.mascota, r.tipo_mascota, r.raza, r.ciudad,
        new Date(r.created_at).toLocaleString("es-VE", { timeZone: "America/Caracas" }), r.ganador ? "Sí" : ""]
        .map(celda).join(";"),
    );
  }
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="participantes-${fecha}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
