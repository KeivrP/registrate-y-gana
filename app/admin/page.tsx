import type { Metadata } from "next";
import { esAdmin } from "@/lib/auth";
import Login from "./Login";
import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Panel · Regístrate y gana",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const ok = await esAdmin();
  return <div className="admin">{ok ? <Dashboard /> : <Login />}</div>;
}
