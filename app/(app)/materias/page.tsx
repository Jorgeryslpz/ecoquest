import Link from "next/link";
import Topbar from "@/components/Topbar";
import { MATERIA_ICONS } from "@/lib/icons";
import { MATERIAS } from "@/lib/banco";

export default function MateriasPage() {
  return (
    <div className="eq">
      <div className="eq-app">
        <Topbar title="Materias" backHref="/inicio" />
        <div className="screen">
          <h1>Materias</h1>
          <p className="dim">Ejercicio tipo examen: 20 preguntas por materia, cronometrado.</p>
          <div className="tile-grid" style={{ marginTop: 14 }}>
            {MATERIAS.map((m) => {
              const Icon = MATERIA_ICONS[m];
              return (
                <Link key={m} href={`/materias/${encodeURIComponent(m)}`} className="tile">
                  <div className="tile-ico" style={{ background: "var(--panel2)", color: "var(--gold)" }}>
                    <Icon />
                  </div>
                  <b>{m}</b>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
