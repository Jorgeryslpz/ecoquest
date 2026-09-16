import { redirect } from "next/navigation";
import { getSuscripcionActiva, getUser } from "@/lib/auth";
import { PLANES } from "@/lib/stripe";
import LogoutButton from "@/components/LogoutButton";
import PlanButton from "./PlanButton";

export default async function PagoPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const suscripcion = await getSuscripcionActiva(user.id);
  if (suscripcion) redirect("/inicio");

  return (
    <div className="eq">
      <div className="eq-app">
        <div className="screen">
          <h1>Elige tu plan</h1>
          <p className="dim" style={{ marginTop: 6 }}>
            7 días de prueba gratis, luego se cobra automáticamente. Cancela cuando quieras.
          </p>

          <PlanButton plan="1_mes" nombre={PLANES["1_mes"].nombre} precio={`$${PLANES["1_mes"].precioMxn}`} />
          <PlanButton
            plan="6_meses"
            nombre={PLANES["6_meses"].nombre}
            precio={`$${PLANES["6_meses"].precioMxn}`}
            best
            sub="El más elegido"
          />
          <PlanButton plan="1_anio" nombre={PLANES["1_anio"].nombre} precio={`$${PLANES["1_anio"].precioMxn}`} />

          <div style={{ marginTop: 20 }}>
            <LogoutButton full />
          </div>
        </div>
      </div>
    </div>
  );
}
