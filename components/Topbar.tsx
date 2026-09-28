import Link from "next/link";
import { BackIcon, HomeIcon, LogoIcon, PerfilIcon } from "@/lib/icons";
import ThemeToggle from "./ThemeToggle";

export default function Topbar({ title, backHref }: { title: string; backHref?: string }) {
  return (
    <div className="topbar">
      {backHref && (
        <Link href={backHref} className="iconbtn" title="Regresar">
          <BackIcon />
        </Link>
      )}
      <LogoIcon size={28} />
      <div className="tb-title">{title}</div>
      <ThemeToggle />
      <Link href="/inicio" className="iconbtn" title="Inicio">
        <HomeIcon />
      </Link>
      <Link href="/perfil" className="iconbtn" title="Perfil">
        <PerfilIcon />
      </Link>
    </div>
  );
}
