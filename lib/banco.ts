import { createServiceRoleClient } from "@/lib/supabase/server";

export const MATERIAS = [
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

export type Materia = (typeof MATERIAS)[number];

// Distribución oficial de los 128 reactivos del examen (spec §0).
export const DISTRIBUCION_EXAMEN: Record<Materia, number> = {
  "Español": 12,
  "Habilidad Verbal": 16,
  "Matemáticas": 12,
  "Habilidad Matemática": 16,
  "Biología": 12,
  "Física": 12,
  "Química": 12,
  "Historia de México": 6,
  "Historia Universal": 6,
  "Geografía": 12,
  "Formación Cívica y Ética": 12,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type ReactivoPublico = {
  id_reactivo: string;
  asignatura: string;
  subtemario: string | null;
  texto_lectura: string | null;
  enunciado: string;
  opciones: Record<string, string>;
};

/**
 * Arma un set de `cantidad` reactivos de una materia, evitando repetir
 * `excluirIds` si el banco alcanza (si no alcanza, se permite repetir —
 * igual que dice la spec §5).
 */
export async function armarSet(
  materia: string,
  cantidad: number,
  excluirIds: string[] = []
): Promise<ReactivoPublico[]> {
  const admin = createServiceRoleClient();
  const columnas = "id_reactivo, asignatura, subtemario, texto_lectura, enunciado, opciones";

  let query = admin.from("reactivos").select(columnas).eq("asignatura", materia);
  if (excluirIds.length > 0) {
    query = query.not("id_reactivo", "in", `(${excluirIds.join(",")})`);
  }
  const { data } = await query;

  let pool = (data ?? []) as ReactivoPublico[];
  if (pool.length < cantidad) {
    // No alcanza el banco sin repetir: se vuelve a traer todo el banco de
    // esa materia (permitiendo repetir los más antiguos, como dice la spec).
    const { data: completo } = await admin.from("reactivos").select(columnas).eq("asignatura", materia);
    pool = (completo ?? []) as ReactivoPublico[];
  }

  return shuffle(pool).slice(0, Math.min(cantidad, pool.length));
}

/** Arma un set de reactivos de cualquier materia (para Arena PvP). */
export async function armarSetGlobal(cantidad: number): Promise<ReactivoPublico[]> {
  const admin = createServiceRoleClient();
  const columnas = "id_reactivo, asignatura, subtemario, texto_lectura, enunciado, opciones";
  const materiaAlAzar = MATERIAS[Math.floor(Math.random() * MATERIAS.length)];
  const { data } = await admin.from("reactivos").select(columnas).eq("asignatura", materiaAlAzar);
  return shuffle((data ?? []) as ReactivoPublico[]).slice(0, cantidad);
}

/** Arma los 128 reactivos del examen con la distribución oficial. */
export async function armarExamenCompleto(): Promise<ReactivoPublico[]> {
  const bloques = await Promise.all(
    MATERIAS.map((m) => armarSet(m, DISTRIBUCION_EXAMEN[m]))
  );
  return bloques.flat();
}

/** Arma el diagnóstico: 5 preguntas de cada una de las 11 materias. */
export async function armarDiagnostico(): Promise<ReactivoPublico[]> {
  const bloques = await Promise.all(MATERIAS.map((m) => armarSet(m, 5)));
  return bloques.flat();
}

export function clasificar(pct: number): "Fuerte" | "Regular" | "Débil" {
  if (pct >= 80) return "Fuerte";
  if (pct >= 50) return "Regular";
  return "Débil";
}

export type ResultadoCalificacion = {
  aciertos: number;
  total: number;
  detalle: {
    id_reactivo: string;
    elegida: string | null;
    respuesta_correcta: string;
    correcta: boolean;
    feedback: string;
  }[];
  porMateria: Record<string, { aciertos: number; total: number; clasificacion: string }>;
};

/**
 * Califica un set de respuestas contra la base de datos real — el cliente
 * nunca decide su propio puntaje. `respuestas` es {id_reactivo: letra}.
 */
export async function calificar(respuestas: Record<string, string>): Promise<ResultadoCalificacion> {
  const admin = createServiceRoleClient();
  const ids = Object.keys(respuestas);
  const { data } = await admin
    .from("reactivos")
    .select("id_reactivo, asignatura, respuesta_correcta, feedback")
    .in("id_reactivo", ids);

  const reactivos = data ?? [];
  const detalle = reactivos.map((r) => ({
    id_reactivo: r.id_reactivo,
    elegida: respuestas[r.id_reactivo] ?? null,
    respuesta_correcta: r.respuesta_correcta,
    correcta: respuestas[r.id_reactivo] === r.respuesta_correcta,
    feedback: r.feedback,
  }));

  const porMateria: ResultadoCalificacion["porMateria"] = {};
  for (const r of reactivos) {
    porMateria[r.asignatura] ??= { aciertos: 0, total: 0, clasificacion: "" };
    porMateria[r.asignatura].total++;
    if (respuestas[r.id_reactivo] === r.respuesta_correcta) porMateria[r.asignatura].aciertos++;
  }
  for (const m of Object.keys(porMateria)) {
    const { aciertos, total } = porMateria[m];
    porMateria[m].clasificacion = clasificar(total > 0 ? (aciertos / total) * 100 : 0);
  }

  const aciertos = detalle.filter((d) => d.correcta).length;
  return { aciertos, total: detalle.length, detalle, porMateria };
}

/** Suma aciertos a los puntos semanales del clan del usuario, si pertenece a uno. */
export async function sumarPuntosClan(userId: string, puntos: number) {
  if (puntos <= 0) return;
  const admin = createServiceRoleClient();
  const { data: miembro } = await admin
    .from("clan_miembros")
    .select("clan_id, puntos_semana")
    .eq("user_id", userId)
    .maybeSingle();
  if (!miembro) return;
  await admin
    .from("clan_miembros")
    .update({ puntos_semana: miembro.puntos_semana + puntos })
    .eq("user_id", userId);
}
