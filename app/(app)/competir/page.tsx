import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { ArenaIcon, ClanesIcon, MarcadorIcon, TrofeoIcon } from "@/lib/icons";

export default function CompetirPage() {
  return (
    <div className="eq">
      <div className="eq-app">
        <div className="topbar">
          <Link href="/inicio" className="iconbtn" title="Inicio">
            ←
          </Link>
          <div className="tb-title">Competir</div>
          <LogoutButton />
        </div>
        <div className="screen">
          <h1>
            <span className="gold">
              <TrofeoIcon />
            </span>{" "}
            Competir
          </h1>
          <p className="dim">Reta a tus compañeros o compite contra todo el país.</p>

          <Link href="/competir/arena" className="mode-card" style={{ marginTop: 12 }}>
            <div className="mode-ico" style={{ background: "var(--panel2)", color: "var(--blue)" }}>
              <ArenaIcon />
            </div>
            <div className="mc-txt">
              <b>Arena PvP</b>
              <span>Duelos asíncronos · trofeos y liga</span>
            </div>
            <span className="chev">›</span>
          </Link>

          <Link href="/competir/clanes" className="mode-card">
            <div className="mode-ico" style={{ background: "var(--tint-ok)", color: "var(--green)" }}>
              <ClanesIcon />
            </div>
            <div className="mc-txt">
              <b>Grupos de Estudio</b>
              <span>Crea o únete con un código</span>
            </div>
            <span className="chev">›</span>
          </Link>

          <Link href="/competir/marcador" className="mode-card">
            <div className="mode-ico" style={{ background: "var(--tint-bad)", color: "var(--red)" }}>
              <MarcadorIcon />
            </div>
            <div className="mc-txt">
              <b>Marcador Global</b>
              <span>Tu posición entre todos los aspirantes</span>
            </div>
            <span className="chev">›</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
