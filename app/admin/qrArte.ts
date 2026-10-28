import QRCode from "qrcode";

const ROJO = "#dc0032";
const TINTA = "#1d1d1b";

function cargarImagen(src: string) {
  return new Promise<HTMLImageElement>((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = mal;
    img.src = src;
  });
}

function rectRedondo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Dibuja el QR con puntos redondeados, ojos en rojo y el logo al centro. */
export async function dibujarQR(url: string, size = 1200): Promise<HTMLCanvasElement> {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const n = qr.modules.size;
  const margen = 3; // módulos de borde blanco
  const cell = size / (n + margen * 2);
  const off = margen * cell;

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#fff";
  rectRedondo(ctx, 0, 0, size, size, size * 0.06);
  ctx.fill();

  // Zona libre central para el logo (≈ 28% del ancho, seguro con corrección H)
  const libre = Math.round(n * 0.28) | 1;
  const ini = Math.floor((n - libre) / 2);
  const fin = ini + libre;
  const enOjo = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const enLogo = (r: number, c: number) => r >= ini && r < fin && c >= ini && c < fin;

  // Puntos
  ctx.fillStyle = TINTA;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.modules.get(r, c) || enOjo(r, c) || enLogo(r, c)) continue;
      ctx.beginPath();
      ctx.arc(off + (c + 0.5) * cell, off + (r + 0.5) * cell, cell * 0.43, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ojos: anillo rojo redondeado + centro oscuro
  for (const [r, c] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    const x = off + c * cell;
    const y = off + r * cell;
    ctx.fillStyle = ROJO;
    rectRedondo(ctx, x, y, 7 * cell, 7 * cell, cell * 2.2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    rectRedondo(ctx, x + cell, y + cell, 5 * cell, 5 * cell, cell * 1.5);
    ctx.fill();
    ctx.fillStyle = TINTA;
    rectRedondo(ctx, x + 2 * cell, y + 2 * cell, 3 * cell, 3 * cell, cell * 1);
    ctx.fill();
  }

  // Logo al centro sobre fondo blanco
  const caja = libre * cell;
  const cx = off + ini * cell;
  ctx.fillStyle = "#fff";
  rectRedondo(ctx, cx, cx, caja, caja, caja * 0.22);
  ctx.fill();
  const logo = await cargarImagen("/img/logo-1stchoice.webp");
  const pad = caja * 0.07;
  const w = caja - pad * 2;
  const h = (w * logo.height) / logo.width;
  ctx.drawImage(logo, cx + pad, cx + (caja - h) / 2, w, h);

  return canvas;
}

/** Afiche vertical listo para imprimir (1200×1600). */
export async function dibujarAfiche(url: string): Promise<HTMLCanvasElement> {
  await Promise.all([
    document.fonts.load('900 80px "Archivo"'),
    document.fonts.load('600 40px "Barlow"'),
    document.fonts.load('500 30px "Barlow"'),
  ]).catch(() => {});

  const W = 1200;
  const H = 1600;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Fondo
  ctx.fillStyle = "#f1f1f1";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ROJO;
  ctx.fillRect(0, 0, W, 330);
  // curva suave bajo la banda roja
  ctx.beginPath();
  ctx.moveTo(0, 330);
  ctx.quadraticCurveTo(W / 2, 420, W, 330);
  ctx.fill();

  // Títulos
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = '900 92px "Archivo", sans-serif';
  ctx.fillText("¡REGÍSTRATE", W / 2, 150);
  ctx.fillText("Y GANA!", W / 2, 250);

  ctx.fillStyle = TINTA;
  ctx.font = '600 44px "Barlow", sans-serif';
  ctx.fillText("Escanea el código y participa en el sorteo", W / 2, 500);

  // Tarjeta del QR
  const qrSize = 720;
  const qx = (W - qrSize) / 2;
  const qy = 560;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.14)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#fff";
  rectRedondo(ctx, qx - 30, qy - 30, qrSize + 60, qrSize + 60, 48);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = ROJO;
  ctx.lineWidth = 8;
  rectRedondo(ctx, qx - 30, qy - 30, qrSize + 60, qrSize + 60, 48);
  ctx.stroke();
  ctx.drawImage(await dibujarQR(url, qrSize), qx, qy);

  // URL
  ctx.fillStyle = "#6b6b6b";
  ctx.font = '500 32px "Barlow", sans-serif';
  ctx.fillText(url.replace(/^https?:\/\//, "").replace(/\/$/, ""), W / 2, qy + qrSize + 92);

  // Logos
  const [l1, l2] = await Promise.all([cargarImagen("/img/logo-1stchoice.webp"), cargarImagen("/img/pronature-logo.webp")]);
  const h1 = 130;
  const w1 = (h1 * l1.width) / l1.height;
  const w2 = 230;
  const h2 = (w2 * l2.height) / l2.width;
  const gap = 60;
  const total = w1 + gap + w2;
  const lx = (W - total) / 2;
  const ly = H - 175;
  ctx.drawImage(l1, lx, ly, w1, h1);
  ctx.drawImage(l2, lx + w1 + gap, ly + (h1 - h2) / 2, w2, h2);

  return canvas;
}
