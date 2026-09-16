import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { LogoIcon } from "@/lib/icons";

export default async function Portada() {
  const user = await getUser();
  if (user) redirect("/inicio");

  return (
    <div className="eq">
      <div className="eq-app">
        <div className="screen">
          <div className="hero">
            <div className="logo-shield">
              <LogoIcon />
            </div>
            <h1>
              ECOEMS <span>QUEST</span>
            </h1>
            <p className="dim" style={{ marginTop: 6 }}>
              Tu aventura rumbo a la prepa que quieres.
              <br />
              2,231 reactivos. 11 materias. Un mapa.
            </p>
            <div style={{ width: "100%", marginTop: 26 }}>
              <Link href="/registro" className="btn">
                Crear cuenta
              </Link>
              <Link href="/login" className="btn ghost">
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
