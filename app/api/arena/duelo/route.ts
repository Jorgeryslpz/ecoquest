import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { armarSetGlobal } from "@/lib/banco";
import { crearSesion } from "@/lib/sesiones";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

  const preguntas = await armarSetGlobal(5);
  const sesion_id = await crearSesion(
    user.id,
    "arena",
    preguntas.map((p) => p.id_reactivo)
  );
  return NextResponse.json({ sesion_id, preguntas });
}
