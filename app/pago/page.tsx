import { redirect } from "next/navigation";
import { getSuscripcionActiva, getUser } from "@/lib/auth";
import { PLANES, type PlanId } from "@/lib/stripe";
import LogoutButton from "@/components/LogoutButton";
import PlanButton from "./PlanButton";

export default async function PagoPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const suscripcion = await getSuscripcionActiva(user.id);
  if (suscripcion) redirect("/inicio");

  const { plan } = await searchParams;
  // Solo se auto-dispara si viene de un link de precios con un plan válido
  // (p. ej. desde la landing, tras registrarse) — nunca por accidente.
  const planPreseleccionado: PlanId | null = plan && plan in PLANES ? (plan as PlanId) : null;

  return (
    <div className="eq">
      <div className="eq-app">
        <div className="screen">
          <h1>Elige tu plan</h1>
          <p className="dim" style={{ marginTop: 6 }}>
            Se renueva automáticamente. Cancela cuando quieras.
          </p>

          <PlanButton
            plan="1_mes"
            nombre={PLANES["1_mes"].nombre}
            precio={`$${PLANES["1_mes"].precioMxn}`}
            autoStart={planPreseleccionado === "1_mes"}
          />
          <PlanButton
            plan="6_meses"
            nombre={PLANES["6_meses"].nombre}
            precio={`$${PLANES["6_meses"].precioMxn}`}
            best
            sub="El más elegido"
            autoStart={planPreseleccionado === "6_meses"}
          />
          <PlanButton
            plan="1_anio"
            nombre={PLANES["1_anio"].nombre}
            precio={`$${PLANES["1_anio"].precioMxn}`}
            autoStart={planPreseleccionado === "1_anio"}
          />

          <div style={{ marginTop: 20 }}>
            <LogoutButton full />
          </div>
        </div>
      </div>
    </div>
  );
}
