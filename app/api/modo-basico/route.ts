import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const MATERIAS_MODO_BASICO = [
  "Español",
  "Habilidad Verbal",
  "Matemáticas",
  "Habilidad Matemática",
  "Biología",
  "Física",
  "Química",
  "Historia de México",
  "Historia Universal",
  "Geografía",
  "Formación Cívica y Ética",
] as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Devuelve las 10 preguntas de un nivel (materia + nivel) SIN la
// respuesta_correcta ni la explicación — el cliente nunca debe poder ver
// la respuesta antes de contestar. La calificación real ocurre en
// /api/modo-basico/verificar.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const asignatura = searchParams.get("asignatura");
  const nivelRaw = searchParams.get("nivel");
  const nivel = nivelRaw ? Number(nivelRaw) : NaN;

  if (!asignatura || !MATERIAS_MODO_BASICO.includes(asignatura as (typeof MATERIAS_MODO_BASICO)[number])) {
    return NextResponse.json({ error: "asignatura inválida" }, { status: 400 });
  }
  if (![1, 2, 3].includes(nivel)) {
    return NextResponse.json({ error: "nivel inválido (debe ser 1, 2 o 3)" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("modo_basico_items")
    .select("id_item, instruccion, oracion, opciones")
    .eq("asignatura", asignatura)
    .eq("nivel", nivel);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const preguntas = shuffle(data ?? []).map((p) => ({
    ...p,
    opciones: shuffle(p.opciones as string[]),
  }));

  return NextResponse.json({ preguntas });
}
