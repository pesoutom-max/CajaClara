import { redirect } from "next/navigation";

export default function Home() {
  // Redirigir el index (/) siempre hacia la ruta de autenticación o el dashboard.
  // Next.js (Server Component) puede manejar redirecciones limpias aquí.
  redirect("/login");
}
