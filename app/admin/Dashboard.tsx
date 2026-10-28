"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dibujarAfiche, dibujarQR } from "./qrArte";

type P = {
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
type G = { id: number; participante_id: number; created_at: string };

const COLORES = ["#ffffff", "#ffd400", "#14ab52", "#ff8fab", "#7fd3ff"];

function fecha(s: string) {
  return new Date(s).toLocaleString("es-VE", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Caracas",
  });
}
const nombreCorto = (p: P) => `${p.nombres.split(" ")[0]} ${p.apellidos.split(" ")[0]}`;
const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Dashboard() {
  const [participantes, setParticipantes] = useState<P[]>([]);
  const [ganadores, setGanadores] = useState<G[]>([]);
  const [cargando, setCargando] = useState(true);
  const [q, setQ] = useState("");
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    const r = await fetch("/api/admin/participantes", { cache: "no-store" });
    if (r.status === 401) return window.location.reload();
    const j = await r.json();
    if (j.ok) {
      setParticipantes(j.participantes);
      setGanadores(j.ganadores);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 15000); // se actualiza solo durante el evento
    return () => clearInterval(t);
  }, [cargar]);

  const porId = useMemo(() => new Map(participantes.map((p) => [p.id, p])), [participantes]);
  const idsGanadores = useMemo(() => new Set(ganadores.map((g) => g.participante_id)), [ganadores]);
  const elegibles = participantes.filter((p) => !idsGanadores.has(p.id));

  const filtrados = useMemo(() => {
    const t = sinAcentos(q.trim());
    if (!t) return participantes;
    return participantes.filter((p) =>
      sinAcentos(`${p.id} ${p.nombres} ${p.apellidos} ${p.telefono} ${p.correo} ${p.mascota} ${p.raza} ${p.ciudad}`).includes(t),
    );
  }, [participantes, q]);

  const perros = participantes.filter((p) => p.tipo_mascota.includes("Perro")).length;
  const gatos = participantes.filter((p) => /gato/i.test(p.tipo_mascota)).length;

  async function salir() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  }

  async function borrar(p: P) {
    if (!confirm(`¿Eliminar a ${p.nombres} ${p.apellidos} (#${p.id})?`)) return;
    await fetch(`/api/admin/participantes?id=${p.id}`, { method: "DELETE" });
    cargar();
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <img src="/img/logo-1stchoice.webp" alt="" width={40} height={39} />
          <h1>Regístrate y gana · Panel</h1>
          <button className="btn btn-chico" onClick={salir}>Salir</button>
        </div>
      </header>

      <div className="dash">
        <div className="stats">
          <div className="stat"><b>{participantes.length}</b><span>Registrados</span></div>
          <div className="stat"><b>{perros}</b><span>Con perro</span></div>
          <div className="stat"><b>{gatos}</b><span>Con gato</span></div>
          <div className="stat"><b>{ganadores.length}</b><span>Ganadores</span></div>
        </div>

        <div className="grid2">
          <Sorteo
            elegibles={elegibles}
            ganadores={ganadores}
            porId={porId}
            onCambio={cargar}
            setAviso={setAviso}
          />
          <CodigoQR />
        </div>

        {aviso && <p className="err" role="alert">{aviso}</p>}

        <section className="card">
          <div className="lista-head">
            <h2>Participantes</h2>
            <input className="buscar" placeholder="Buscar nombre, teléfono, ciudad…" value={q} onChange={(e) => setQ(e.target.value)} />
            <a className="btn" href="/api/admin/csv">Descargar Excel (CSV)</a>
          </div>
          {cargando ? (
            <p className="vacio">Cargando…</p>
          ) : filtrados.length === 0 ? (
            <p className="vacio">{participantes.length ? "Sin resultados" : "Aún no hay registros. Comparte el QR 👆"}</p>
          ) : (
            <div className="tabla-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Persona</th><th>Contacto</th><th>Mascota</th><th>Ciudad</th><th>Fecha</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => (
                    <tr key={p.id} className={idsGanadores.has(p.id) ? "es-ganador" : ""}>
                      <td>
                        #{p.id} {idsGanadores.has(p.id) && <span className="tag tag-rojo">🏆 Ganador</span>}
                      </td>
                      <td><b>{p.nombres} {p.apellidos}</b></td>
                      <td>
                        <a href={`tel:${p.telefono}`}>{p.telefono}</a>
                        <br />
                        <small>{p.correo}</small>
                      </td>
                      <td data-k="Mascota">
                        {p.mascota} <span className="tag">{p.tipo_mascota}</span>
                        <br />
                        <small>{p.raza}</small>
                      </td>
                      <td data-k="Ciudad">{p.ciudad}</td>
                      <td data-k="Fecha"><small>{fecha(p.created_at)}</small></td>
                      <td>
                        <button className="btn btn-chico" onClick={() => borrar(p)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

/* ───────────── Sorteo ───────────── */

function Sorteo({
  elegibles, ganadores, porId, onCambio, setAviso,
}: {
  elegibles: P[];
  ganadores: G[];
  porId: Map<number, P>;
  onCambio: () => Promise<unknown> | void;
  setAviso: (s: string) => void;
}) {
  const [girando, setGirando] = useState(false);
  const [mostrado, setMostrado] = useState<string>("");
  const [ganador, setGanador] = useState<P | null>(null);
  const [confeti, setConfeti] = useState(0);
  const ref = useRef<HTMLElement>(null);

  async function sortear() {
    if (girando || elegibles.length === 0) return;
    setAviso("");
    setGanador(null);
    setGirando(true);

    const nombres = elegibles.map(nombreCorto);
    const peticion = fetch("/api/admin/sorteo", { method: "POST" }).then((r) => r.json());

    // Ruleta de nombres que va frenando (~4 s)
    const pasos = 42;
    for (let i = 0; i < pasos; i++) {
      setMostrado(nombres[Math.floor(Math.random() * nombres.length)]);
      const t = i / pasos;
      await new Promise((r) => setTimeout(r, 45 + 260 * t * t * t));
    }

    const j = await peticion.catch(() => ({ ok: false, error: "Sin conexión" }));
    setGirando(false);
    if (!j.ok) {
      setMostrado("");
      setAviso(j.error || "No se pudo sortear");
      return;
    }
    setGanador(j.ganador);
    setMostrado(`${j.ganador.nombres} ${j.ganador.apellidos}`);
    setConfeti((c) => c + 1);
    onCambio();
  }

  async function quitar(id: number) {
    if (!confirm("¿Quitar este ganador? Volverá a participar en el próximo sorteo.")) return;
    await fetch(`/api/admin/sorteo?id=${id}`, { method: "DELETE" });
    if (ganador?.id === id) { setGanador(null); setMostrado(""); }
    onCambio();
  }

  async function reiniciar() {
    if (!confirm("¿Borrar TODOS los ganadores y empezar de cero?")) return;
    await fetch(`/api/admin/sorteo?todos=1`, { method: "DELETE" });
    setGanador(null);
    setMostrado("");
    onCambio();
  }

  function pantallaCompleta() {
    const el = ref.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section className="card sorteo" ref={ref}>
        <h2>🎉 Sorteo</h2>
        <p className="sub">{elegibles.length} participante{elegibles.length === 1 ? "" : "s"} en el bombo</p>

        <div className="sorteo-display" aria-live="polite">
          {ganador && !girando && <div className="sorteo-etiqueta">¡Ganador!</div>}
          <div key={ganador?.id ?? "x"} className={`sorteo-nombre ${girando ? "girando" : ganador ? "ganador" : ""}`}>
            {mostrado || (elegibles.length ? "¿Quién ganará?" : "Sin participantes")}
          </div>
          {ganador && !girando && (
            <div className="sorteo-detalle">🐾 {ganador.mascota} · {ganador.ciudad} · #{ganador.id}</div>
          )}
        </div>

        <div className="sorteo-acciones">
          <button className="btn-sortear" onClick={sortear} disabled={girando || elegibles.length === 0}>
            {girando ? "Sorteando…" : ganador ? "SORTEAR OTRO" : "SORTEAR"}
          </button>
          <button className="btn-ghost" onClick={pantallaCompleta} title="Ideal para proyectar">⛶ Pantalla completa</button>
        </div>

        {confeti > 0 && <Confeti key={confeti} />}
      </section>

      {ganadores.length > 0 && (
        <section className="card">
          <div className="lista-head">
            <h2>🏆 Ganadores</h2>
            <button className="btn btn-chico" onClick={reiniciar}>Reiniciar</button>
          </div>
          <ol className="ganadores">
            {ganadores.map((g, i) => {
              const p = porId.get(g.participante_id);
              if (!p) return null;
              return (
                <li key={g.id}>
                  <span className="pos">{i + 1}</span>
                  <div className="info">
                    <b>{p.nombres} {p.apellidos}</b>
                    <small>
                      <a href={`tel:${p.telefono}`}>{p.telefono}</a> · {p.correo} · 🐾 {p.mascota}
                    </small>
                  </div>
                  <button className="btn btn-chico" onClick={() => quitar(p.id)}>Quitar</button>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}

function Confeti() {
  const piezas = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 2.2 + Math.random() * 1.8,
        color: COLORES[i % COLORES.length],
        rot: Math.random() * 360,
      })),
    [],
  );
  return (
    <div className="confeti" aria-hidden>
      {piezas.map((p, i) => (
        <i
          key={i}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ───────────── QR ───────────── */

function CodigoQR() {
  const [url, setUrl] = useState("");
  const [png, setPng] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [bajando, setBajando] = useState(false);

  useEffect(() => {
    const u = `${window.location.origin}/`;
    setUrl(u);
    dibujarQR(u, 1200).then((c) => setPng(c.toDataURL("image/png")));
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {}
  }

  async function descargarAfiche() {
    setBajando(true);
    try {
      const c = await dibujarAfiche(url);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = "afiche-registrate-y-gana.png";
      a.click();
    } finally {
      setBajando(false);
    }
  }

  return (
    <section className="card qr">
      <h2>Código QR</h2>
      <p className="sub">La gente lo escanea y llega directo al registro.</p>
      {png ? <img src={png} alt={`QR hacia ${url}`} width={240} height={240} /> : <div style={{ height: 250 }} />}
      <p className="url">{url}</p>
      <div className="acciones">
        <a className="btn btn-rojo" href={png} download="qr-registrate-y-gana.png">Descargar QR</a>
        <button className="btn" onClick={descargarAfiche} disabled={bajando}>{bajando ? "Generando…" : "Descargar afiche"}</button>
        <button className="btn" onClick={copiar}>{copiado ? "¡Copiado!" : "Copiar link"}</button>
        <a className="btn" href="/" target="_blank" rel="noreferrer">Ver página</a>
      </div>
    </section>
  );
}
