import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ExamenIcon, FuegoIcon, MATERIA_ICONS, MundosIcon, TrofeoIcon } from "@/lib/icons";
import Topbar from "@/components/Topbar";

export default async function InicioPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const admin = createServiceRoleClient();

  const [{ data: diag }, { data: racha }, { count: nivelesAprobados }, { count: enRepaso }, { data: trofeosRow }] =
    await Promise.all([
      admin.from("diagnostico_resultados").select("completado").eq("user_id", user.id).maybeSingle(),
      admin
        .from("rachas_estudio")
        .select("dias_actuales, ultima_actividad")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("mundos_progreso")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("aprobado", true),
      admin.from("repaso").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      admin.from("trofeos_liga").select("trofeos").eq("user_id", user.id).maybeSingle(),
    ]);

  const diasRacha = racha?.dias_actuales ?? 0;
  const hoy = new Date().toISOString().slice(0, 10);
  const estudiasteHoy = racha?.ultima_actividad === hoy;
  const trofeos = trofeosRow?.trofeos ?? 0;

  const MateriasIcon = MATERIA_ICONS["Español"];

  return (
    <div className="eq">
      <div className="eq-app">
        <Topbar title="Kaanki" />
        <div className="screen">
          <h1>¡Hola, aspirante! 👋</h1>

          <Link href="/perfil" className="dash-card">
            <span className="dash-flame" style={{ color: "var(--gold)" }}>
              <FuegoIcon />
            </span>
            <div className="dash-txt">
              <b>
                {diasRacha} día{diasRacha === 1 ? "" : "s"} de racha
              </b>
              <span className="dim" style={{ fontSize: 12 }}>
                {estudiasteHoy ? "✅ Ya estudiaste hoy" : "⭕ Aún no estudias hoy"}
              </span>
            </div>
            <span className="chev">›</span>
          </Link>

          <div className="dash-stats">
            <div className="stat-box">
              <b>{nivelesAprobados ?? 0}</b>
              <span>Niveles aprobados</span>
            </div>
            <div className="stat-box">
              <b>{enRepaso ?? 0}</b>
              <span>En repaso</span>
            </div>
            <div className="stat-box">
              <b>{trofeos}</b>
              <span>🏆 Trofeos</span>
            </div>
          </div>

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
