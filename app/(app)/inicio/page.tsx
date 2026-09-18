import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ExamenIcon, MATERIA_ICONS, MundosIcon, TrofeoIcon } from "@/lib/icons";
import LogoutButton from "@/components/LogoutButton";

export default async function InicioPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const admin = createServiceRoleClient();

  const { data: diag } = await admin
    .from("diagnostico_resultados")
    .select("completado")
    .eq("user_id", user.id)
    .maybeSingle();

  const MateriasIcon = MATERIA_ICONS["Español"];

  return (
    <div className="eq">
      <div className="eq-app">
        <div className="topbar">
          <div className="tb-title">ECOEMS Quest</div>
          <LogoutButton />
        </div>
        <div className="screen">
          <h1>¡Hola, aspirante!</h1>

          {diag && !diag.completado && (
            <div className="card" style={{ borderColor: "var(--gold)" }}>
              <h2>Examen diagnóstico</h2>
              <p className="dim">55 preguntas (5 por materia) para saber de dónde partes. Solo se hace una vez.</p>
              <Link href="/diagnostico" className="btn small" style={{ width: "auto", display: "inline-block" }}>
                Comenzar
              </Link>
            </div>
          )}

          <Link href="/mundos" className="mode-card" style={{ marginTop: 12 }}>
            <div className="mode-ico" style={{ background: "var(--tint-ok)", color: "var(--green)" }}>
              <MundosIcon />
            </div>
            <div className="mc-txt">
              <b>Mundo de Preguntas</b>
              <span>Completa la oración, sin cronómetro</span>
            </div>
            <span className="chev">›</span>
          </Link>

          <Link href="/materias" className="mode-card">
            <div className="mode-ico" style={{ background: "#263A5E", color: "#fff" }}>
              <MateriasIcon />
            </div>
            <div className="mc-txt">
              <b>Materias</b>
              <span>Ejercicios de 20 preguntas tipo examen</span>
            </div>
            <span className="chev">›</span>
          </Link>

          <Link href="/examen" className="mode-card">
            <div className="mode-ico" style={{ background: "var(--tint-warn)", color: "var(--gold-deep)" }}>
              <ExamenIcon />
            </div>
            <div className="mc-txt">
              <b>Examen</b>
              <span>Simulador de 128 reactivos, 3 horas</span>
            </div>
            <span className="chev">›</span>
          </Link>

          <Link href="/competir" className="mode-card" style={{ borderColor: "var(--gold)" }}>
            <div
              className="mode-ico"
              style={{ background: "linear-gradient(135deg,var(--gold),var(--gold-deep))", color: "#fff" }}
            >
              <TrofeoIcon />
            </div>
            <div className="mc-txt">
              <b>Competir</b>
              <span>Arena, Grupos de Estudio y Marcador Global</span>
            </div>
            <span className="chev">›</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
