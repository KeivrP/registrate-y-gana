# ¡Regístrate y gana! — 1st Choice & Pronature

Una página pública de registro y un panel `/admin`, protegido con PIN, para ver a los participantes, exportarlos a Excel, hacer el sorteo y descargar el QR.

- **Stack:** Next.js 16 (App Router) + Postgres (Neon).
- **Público** (`/`): la gente llena el formulario. No se aceptan duplicados por teléfono ni por correo.
- **Admin** (`/admin`): login con PIN; participantes con buscador, CSV, eliminar; sorteo con ruleta, confeti y pantalla completa (para proyectar); lista de ganadores (quien ya ganó no vuelve a salir); QR descargable que apunta al dominio actual.

## Subir a Vercel (≈5 min)

1. Sube esta carpeta a un repo de GitHub (o usa `npx vercel` desde la carpeta).
2. En Vercel: **Add New → Project →** importa el repo (Next.js se detecta solo).
3. En el proyecto: **Storage → Create Database → Neon (Postgres)** y conéctala al proyecto.
   Así se crea `DATABASE_URL` automáticamente. Las tablas se crean solas en el primer uso.
4. **Settings → Environment Variables:**
   - `ADMIN_PIN` → el PIN del panel (usa 6 dígitos o más).
   - `SESSION_SECRET` (opcional) → cualquier texto largo y aleatorio.
5. **Redeploy.** Entra a `https://tu-proyecto.vercel.app/admin`, pon el PIN y descarga el QR.

> Si conectas un dominio propio, abre el panel desde ese dominio y descarga el QR desde ahí: el QR usa la URL con la que abriste el panel.

## Local

```bash
npm install
cp .env.example .env.local   # pon tu DATABASE_URL y ADMIN_PIN
npm run dev
```

## Notas

- Cambiar `ADMIN_PIN` cierra todas las sesiones abiertas del panel.
- Login: máximo 8 intentos fallidos por IP cada 15 minutos.
- El sorteo se hace en el servidor con `crypto.randomInt`, de forma uniforme entre quienes aún no han ganado.
  Si un ganador no aparece, usa **Quitar** y sortea otra vez.
- El CSV usa `;` y BOM UTF-8, para que Excel en español lo abra con acentos y columnas correctas.
