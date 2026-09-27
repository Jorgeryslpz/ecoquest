import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { FuegoIcon } from "@/lib/icons";
import Topbar from "@/components/Topbar";
import LogoutButton from "@/components/LogoutButton";

export default async function PerfilPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const admin = createServiceRoleClient();

  const [{ data: perfil }, { data: racha }] = await Promise.all([
    admin.from("profiles").select("apodo").eq("id", user.id).maybeSingle(),
    admin
      .from("rachas_estudio")
      .select("dias_actuales, mejor_racha, ultima_actividad")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const diasRacha = racha?.dias_actuales ?? 0;
  const mejorRacha = racha?.mejor_racha ?? 0;
  const hoy = new Date().toISOString().slice(0, 10);
  const estudiasteHoy = racha?.ultima_actividad === hoy;

  return (
    <div className="eq">
      <div className="eq-app">
        <Topbar title="Perfil" backHref="/inicio" />
        <div className="screen">
          <h1>{perfil?.apodo ?? "Tu perfil"}</h1>

          <div className="card" style={{ borderColor: "var(--gold)" }}>
            <h2>
              <span style={{ color: "var(--gold)" }}>
                <FuegoIcon />
              </span>{" "}
              Racha de estudio
            </h2>
            <div className="score-big" style={{ fontSize: 40 }}>
              {diasRacha} <span className="dim" style={{ fontSize: 16 }}>día{diasRacha === 1 ? "" : "s"}</span>
            </div>
            <p className="dim center">Mejor racha: {mejorRacha} días</p>
            <div className="mat-row">
              <span>Hoy</span>
              <span className={`pill ${estudiasteHoy ? "f" : "d"}`}>
                {estudiasteHoy ? "✔ Cumplido" : "Pendiente"}
              </span>
            </div>
          </div>

          <div className="card">
            <h2>Cuenta</h2>
            <p className="dim">{user.email ?? "Sin correo registrado"}</p>
            <LogoutButton full />
          </div>
        </div>
      </div>
    </div>
  );
}
