import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

declare global {
  // eslint-disable-next-line no-var
  var __sql: Sql | undefined;
  // eslint-disable-next-line no-var
  var __schema: Promise<void> | undefined;
}

function connectionString() {
  // Acepta el nombre estándar y los que crea Vercel cuando Neon se conecta con prefijo.
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_DATABASE_URL ||
    process.env.DATABASE_URL_POSTGRES_URL ||
    Object.entries(process.env).find(([k, v]) => /_(DATABASE_URL|POSTGRES_URL)$/.test(k) && v)?.[1];
  if (!url) throw new Error("Falta la variable de entorno DATABASE_URL");
  return url;
}

export function sql(): Sql {
  if (!globalThis.__sql) {
    const url = connectionString();
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url) || url.includes("host=/");
    globalThis.__sql = postgres(url, {
      max: 3,
      idle_timeout: 20,
      prepare: false, // compatible con el pooler de Neon (pgbouncer)
      ssl: local ? false : "require",
    });
  }
  return globalThis.__sql;
}

async function createSchema() {
  const db = sql();
  await db`
    create table if not exists participantes (
      id            serial primary key,
      nombres       text not null,
      apellidos     text not null,
      telefono      text not null,
      correo        text not null,
      mascota       text not null,
      tipo_mascota  text not null,
      raza          text not null,
      ciudad        text not null,
      telefono_norm text not null unique,
      correo_norm   text not null unique,
      created_at    timestamptz not null default now()
    )`;
  await db`
    create table if not exists ganadores (
      id              serial primary key,
      participante_id int not null unique references participantes(id) on delete cascade,
      created_at      timestamptz not null default now()
    )`;
  await db`
    create table if not exists intentos_login (
      id         serial primary key,
      ip         text not null,
      created_at timestamptz not null default now()
    )`;
}

/** Crea las tablas la primera vez (idempotente). */
export function ensureSchema(): Promise<void> {
  if (!globalThis.__schema) {
    globalThis.__schema = createSchema().catch(async (e) => {
      // Dos funciones creando a la vez pueden chocar: reintenta una vez.
      await new Promise((r) => setTimeout(r, 300));
      return createSchema().catch((e2) => {
        globalThis.__schema = undefined;
        throw e2 ?? e;
      });
    });
  }
  return globalThis.__schema;
}

export type Participante = {
  id: number;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  mascota: string;
  tipo_mascota: string;
  raza: string;
  ciudad: string;
  created_at: string;
};
