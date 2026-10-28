import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-500-italic.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow/latin-700.css";
import "@fontsource/archivo/latin-400.css";
import "@fontsource/archivo/latin-900.css";
import "./globals.css";

const barlowXB = localFont({
  src: "./fonts/Barlow-ExtraBold.ttf",
  weight: "800",
  variable: "--font-display",
  display: "swap",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "¡Regístrate y gana! · 1st Choice & Pronature",
  description: "Registra a tu mascota y participa en el sorteo de 1st Choice y Pronature.",
  openGraph: {
    title: "¡Regístrate y gana!",
    description: "Registra a tu mascota y participa en el sorteo de 1st Choice y Pronature.",
    images: ["/img/pug-gatito.webp"],
  },
  icons: { icon: "/img/logo-1stchoice.webp" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={barlowXB.variable}>
      <body>{children}</body>
    </html>
  );
}
