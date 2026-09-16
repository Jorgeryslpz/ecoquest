"use client";

import { useState } from "react";

const MATERIAS = [
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

type Pregunta = {
  id_item: string;
  instruccion: string;
  oracion: string;
  opciones: string[];
};

type Feedback = {
  correcto: boolean;
  respuesta_correcta: string;
  explicacion: string;
};

type Progreso = Record<string, { 1?: number; 2?: number; 3?: number }>; // materia -> nivel -> mejor aciertos (0-10)

const PROGRESO_KEY = "ecoquest_mundos_progreso_local";

function cargarProgreso(): Progreso {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PROGRESO_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function guardarProgreso(p: Progreso) {
  localStorage.setItem(PROGRESO_KEY, JSON.stringify(p));
}

export default function MundosPage() {
  const [pantalla, setPantalla] = useState<"materias" | "niveles" | "quiz" | "resultado">(
    "materias"
  );
  const [progreso, setProgreso] = useState<Progreso>(() => cargarProgreso());
  const [materia, setMateria] = useState<string | null>(null);
  const [nivel, setNivel] = useState<1 | 2 | 3 | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [indice, setIndice] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [elegida, setElegida] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [cargando, setCargando] = useState(false);

  function abrirMateria(m: string) {
    setMateria(m);
    setPantalla("niveles");
  }

  async function iniciarNivel(n: 1 | 2 | 3) {
    if (!materia) return;
    setCargando(true);
    setNivel(n);
    const res = await fetch(
      `/api/modo-basico?asignatura=${encodeURIComponent(materia)}&nivel=${n}`
    );
    const data = await res.json();
    setPreguntas(data.preguntas ?? []);
    setIndice(0);
    setAciertos(0);
    setElegida(null);
    setFeedback(null);
    setCargando(false);
    setPantalla("quiz");
  }

  async function elegirOpcion(opcion: string) {
    if (feedback || !preguntas[indice]) return;
    setElegida(opcion);
    const res = await fetch("/api/modo-basico/verificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_item: preguntas[indice].id_item, respuesta: opcion }),
    });
    const data: Feedback = await res.json();
    setFeedback(data);
    if (data.correcto) setAciertos((a) => a + 1);
  }

  function siguiente() {
    if (indice + 1 >= preguntas.length) {
      if (materia && nivel) {
        const nuevo = { ...progreso };
        nuevo[materia] = { ...nuevo[materia] };
        const anterior = nuevo[materia][nivel] ?? 0;
        nuevo[materia][nivel] = Math.max(anterior, aciertos);
        setProgreso(nuevo);
        guardarProgreso(nuevo);
      }
      setPantalla("resultado");
      return;
    }
    setIndice((i) => i + 1);
    setElegida(null);
    setFeedback(null);
  }

  function nivelDesbloqueado(m: string, n: 1 | 2 | 3) {
    if (n === 1) return true;
    const mejorAnterior = progreso[m]?.[(n - 1) as 1 | 2] ?? 0;
    return mejorAnterior >= 6; // aprobado = 6/10, igual que Materias/Examen
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-8 dark:bg-black">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
          Mundo de Preguntas
        </p>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {pantalla === "materias" && "Elige una materia"}
          {pantalla === "niveles" && materia}
          {(pantalla === "quiz" || pantalla === "resultado") && materia}
        </h1>
        {pantalla !== "materias" && (
          <button
            onClick={() => {
              if (pantalla === "quiz" || pantalla === "resultado") setPantalla("niveles");
              else setPantalla("materias");
            }}
            className="mt-2 text-sm text-zinc-500 underline"
          >
            ← Regresar
          </button>
        )}
      </header>

      {pantalla === "materias" && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MATERIAS.map((m) => (
            <li key={m}>
              <button
                onClick={() => abrirMateria(m)}
                className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left font-medium text-zinc-800 shadow-sm hover:border-orange-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}

      {pantalla === "niveles" && materia && (
        <div className="flex flex-col gap-3">
          {([1, 2, 3] as const).map((n) => {
            const desbloqueado = nivelDesbloqueado(materia, n);
            const mejor = progreso[materia]?.[n];
            return (
              <button
                key={n}
                disabled={!desbloqueado || cargando}
                onClick={() => iniciarNivel(n)}
                className={`flex items-center justify-between rounded-xl border p-4 text-left ${
                  desbloqueado
                    ? "border-zinc-200 bg-white hover:border-orange-400 dark:border-zinc-800 dark:bg-zinc-950"
                    : "cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-400 dark:border-zinc-900 dark:bg-zinc-900"
                }`}
              >
                <span className="font-semibold">Nivel {n}</span>
                <span className="text-sm">
                  {desbloqueado ? (mejor !== undefined ? `Mejor: ${mejor}/10` : "10 preguntas") : "🔒 Bloqueado"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {pantalla === "quiz" && preguntas[indice] && (
        <div>
          <p className="mb-1 text-sm text-zinc-500">
            Pregunta {indice + 1} de {preguntas.length} — Nivel {nivel}
          </p>
          <div className="mb-6 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-2 rounded-full bg-orange-500 transition-all"
              style={{ width: `${(indice / preguntas.length) * 100}%` }}
            />
          </div>

          <p className="mb-2 text-sm text-zinc-500">{preguntas[indice].instruccion}</p>
          <p className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {preguntas[indice].oracion.split("___")[0]}
            <span
              className={`mx-1 inline-block min-w-[3rem] rounded-md border-b-2 px-1 text-center ${
                !feedback
                  ? "border-zinc-400"
                  : feedback.correcto
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950"
                    : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950"
              }`}
            >
              {elegida ?? "____"}
            </span>
            {preguntas[indice].oracion.split("___")[1]}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {preguntas[indice].opciones.map((op) => {
              let estilo =
                "border-zinc-200 bg-white hover:border-orange-400 dark:border-zinc-800 dark:bg-zinc-950";
              if (feedback) {
                if (op === feedback.respuesta_correcta) {
                  estilo = "border-green-500 bg-green-50 dark:bg-green-950";
                } else if (op === elegida) {
                  estilo = "border-red-500 bg-red-50 dark:bg-red-950";
                } else {
                  estilo = "border-zinc-100 bg-zinc-50 text-zinc-400 dark:border-zinc-900 dark:bg-zinc-900";
                }
              }
              return (
                <button
                  key={op}
                  disabled={!!feedback}
                  onClick={() => elegirOpcion(op)}
                  className={`rounded-xl border p-4 font-medium ${estilo}`}
                >
                  {op}
                </button>
              );
            })}
          </div>

          {feedback && (
            <div
              className={`mt-6 rounded-xl border p-4 ${
                feedback.correcto
                  ? "border-green-500 bg-green-50 dark:bg-green-950"
                  : "border-red-500 bg-red-50 dark:bg-red-950"
              }`}
            >
              <p className="font-semibold">
                {feedback.correcto ? "¡Correcto! ✔" : "Incorrecto ✘"}
              </p>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                {feedback.explicacion}
              </p>
              <button
                onClick={siguiente}
                className="mt-4 w-full rounded-xl bg-orange-500 p-3 font-semibold text-white hover:bg-orange-600"
              >
                {indice + 1 >= preguntas.length ? "Ver resultado" : "Siguiente →"}
              </button>
            </div>
          )}
        </div>
      )}

      {pantalla === "resultado" && (
        <div className="text-center">
          <p className="text-5xl font-bold text-zinc-900 dark:text-zinc-50">
            {aciertos}/{preguntas.length}
          </p>
          <p className="mt-2 text-zinc-500">
            {aciertos >= 6 ? "¡Nivel aprobado! 🎉" : "Necesitas 6/10 para aprobar. Inténtalo de nuevo."}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => nivel && iniciarNivel(nivel)}
              className="rounded-xl border border-zinc-200 p-3 font-semibold dark:border-zinc-800"
            >
              Reintentar
            </button>
            <button
              onClick={() => setPantalla("niveles")}
              className="rounded-xl bg-orange-500 p-3 font-semibold text-white hover:bg-orange-600"
            >
              Volver a niveles
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
