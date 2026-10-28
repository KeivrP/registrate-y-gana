"use client";

import { useState } from "react";

export default function Login() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!pin) return;
    setCargando(true);
    setError("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "PIN incorrecto");
        setPin("");
        return;
      }
      window.location.reload();
    } catch {
      setError("Sin conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={entrar}>
        <img src="/img/logo-1stchoice.webp" alt="" width={90} height={87} />
        <h1>Panel del sorteo</h1>
        <p>Ingresa el PIN para continuar</p>
        <input
          className="pin-input"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          aria-label="PIN"
          placeholder="••••"
        />
        {error && <p className="err">{error}</p>}
        <button className="btn btn-rojo btn-full" disabled={cargando || !pin}>
          {cargando ? "Verificando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
