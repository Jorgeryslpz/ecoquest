import LandingClient from "../LandingClient";

// Vista previa de la landing inmersiva completa mientras "/" muestra la
// página de "muy pronto". Sin gate de sesión a propósito: es para revisarla
// en el navegador, no la entrada real todavía. El día del lanzamiento,
// app/page.tsx vuelve a renderizar esto mismo en "/".
export const metadata = {
  title: "Kaanki · Tu aventura rumbo a la prepa que quieres",
  description:
    "Kaanki: tu aventura rumbo a la prepa que quieres. Practica para el ECOEMS / COMIPEMS con retos, rachas y competencia.",
};

export default function LanzamientoPage() {
  return <LandingClient />;
}
