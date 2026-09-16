import { redirect } from "next/navigation";
import { getSuscripcionActiva, getUser } from "@/lib/auth";

// Protege TODO lo que esté dentro de este grupo de rutas: sin sesión ->
// /login; con sesión pero sin suscripción activa (ni en prueba) -> /pago.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  const suscripcion = await getSuscripcionActiva(user.id);
  if (!suscripcion) redirect("/pago");

  return <>{children}</>;
}
