"use client";

import { useState } from "react";

type Estado = { tipo: "idle" | "enviando" | "error" | "listo"; mensaje?: string; numero?: number };

const CAMPOS: { name: string; label: string; type?: string; autoComplete?: string; inputMode?: "tel" | "email" | "text"; placeholder?: string }[] = [
  { name: "nombres", label: "Nombres", autoComplete: "given-name" },
  { name: "apellidos", label: "Apellidos", autoComplete: "family-name" },
  { name: "telefono", label: "Teléfono", type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "0414 123 4567" },
  { name: "correo", label: "Correo", type: "email", autoComplete: "email", inputMode: "email", placeholder: "tucorreo@ejemplo.com" },
  { name: "mascota", label: "Nombre de la mascota" },
];

export default function RegistroForm() {
  const [estado, setEstado] = useState<Estado>({ tipo: "idle" });

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const fd = new FormData(form);
    const data: Record<string, unknown> = Object.fromEntries(fd);
    data.acepto = fd.get("acepto") === "on";
    setEstado({ tipo: "enviando" });
    try {
      const r = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        setEstado({ tipo: "error", mensaje: j.error || "Ocurrió un error." });
        return;
      }
      form.reset();
      setEstado({ tipo: "listo", numero: j.numero });
    } catch {
      setEstado({ tipo: "error", mensaje: "Sin conexión. Revisa tu internet e intenta de nuevo." });
    }
  }

  if (estado.tipo === "listo") {
    return (
      <div className="exito" role="status">
        <div className="exito-icono" aria-hidden>🐾</div>
        <h3>¡Listo, ya estás participando!</h3>
        {estado.numero ? <p className="exito-num">Tu número de registro es <b>#{estado.numero}</b></p> : null}
        <p>Te contactaremos por teléfono o correo si resultas ganador. ¡Mucha suerte!</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={enviar} noValidate={false}>
      {CAMPOS.map((c) => (
        <label key={c.name} className="campo">
          <span>{c.label}</span>
          <input
            name={c.name}
            type={c.type || "text"}
            autoComplete={c.autoComplete || "off"}
            inputMode={c.inputMode}
            placeholder={c.placeholder}
            maxLength={100}
            required
            {...(c.type === "tel" ? { pattern: "[\\d\\s\\+\\(\\)\\-]{7,}", title: "Escribe un teléfono válido" } : {})}
          />
        </label>
      ))}

      <label className="campo">
        <span>Tipo de mascota</span>
        <select name="tipo_mascota" required defaultValue="">
          <option value="" disabled>Selecciona…</option>
          <option>Perro</option>
          <option>Gato</option>
          <option>Perro y gato</option>
          <option>Otro</option>
        </select>
      </label>

      <label className="campo">
        <span>Raza</span>
        <input name="raza" maxLength={100} required placeholder="Ej: Mestizo, Golden, Siamés" />
      </label>

      <label className="campo">
        <span>Ciudad</span>
        <input name="ciudad" autoComplete="address-level2" maxLength={100} required />
      </label>

      {/* honeypot anti-bots */}
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden />

      <label className="acepto">
        <input type="checkbox" name="acepto" required />
        <span>Acepto que mis datos se usen para participar en el sorteo y ser contactado por 1st Choice / Pronature.</span>
      </label>

      {estado.tipo === "error" && <p className="form-error" role="alert">{estado.mensaje}</p>}

      <button className="btn-enviar" type="submit" disabled={estado.tipo === "enviando"}>
        {estado.tipo === "enviando" ? "Enviando…" : "PARTICIPAR"}
      </button>
    </form>
  );
}
