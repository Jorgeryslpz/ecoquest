import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { armarExamenCompleto } from "@/lib/banco";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

  const preguntas = await armarExamenCompleto();
  return NextResponse.json({ preguntas });
}
