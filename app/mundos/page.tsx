"use client";

import { useState } from "react";
import { BackIcon, LockIcon, MATERIA_ICONS, MoonIcon, SunIcon } from "@/lib/icons";

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

type Progreso = Record<string, { 1?: number; 2?: number; 3?: number }>;

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
  const [claro, setClaro] = useState(false);
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

  function regresar() {
    if (pantalla === "quiz" || pantalla === "resultado") setPantalla("niveles");
    else setPantalla("materias");
  }

  async function iniciarNivel(n: 1 | 2 | 3) {
    if (!materia) return;
    setCargando(true);
    setNivel(n);
    const res = await fetch(`/api/modo-basico?asignatura=${encodeURIComponent(materia)}&nivel=${n}`);
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
        const nuevo = { ...progreso, [materia]: { ...progreso[materia] } };
        nuevo[materia][nivel] = Math.max(nuevo[materia][nivel] ?? 0, aciertos);
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
    return (progreso[m]?.[(n - 1) as 1 | 2] ?? 0) >= 6;
  }

  const preguntaActual = preguntas[indice];
  const titulo =
    pantalla === "materias" ? "Mundo de Preguntas" : pantalla === "niveles" ? materia! : materia!;

  return (
    <div className={`eq ${claro ? "light" : ""}`}>
      <div className="eq-app">
        <div className="topbar">
          {pantalla !== "materias" ? (
            <button className="iconbtn" onClick={regresar} title="Regresar">
              <BackIcon />
            </button>
          ) : (
            <span style={{ width: 40 }} />
          )}
          <div className="tb-title">{titulo}</div>
          <button className="iconbtn" onClick={() => setClaro((c) => !c)} title="Cambiar tema">
            {claro ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>

        <div className="screen">
          {pantalla === "materias" && (
            <>
              <h1>
                Mundo de <span className="gold">Preguntas</span>
              </h1>
              <p className="dim" style={{ marginTop: 6, marginBottom: 14 }}>
                Practica sin presión: sin cronómetro, solo completa la oración.
              </p>
              <div className="tile-grid">
                {MATERIAS.map((m) => {
                  const Icon = MATERIA_ICONS[m];
                  return (
                    <button key={m} className="tile" onClick={() => abrirMateria(m)}>
                      <div className="tile-ico" style={{ background: "var(--panel2)", color: "var(--gold)" }}>
                        <Icon />
                      </div>
                      <b>{m}</b>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {pantalla === "niveles" && materia && (
            <>
              <p className="dim">Elige un nivel para practicar {materia}.</p>
              {([1, 2, 3] as const).map((n) => {
                const desbloqueado = nivelDesbloqueado(materia, n);
                const mejor = progreso[materia]?.[n];
                return (
                  <button
                    key={n}
                    className="lvl-row"
                    disabled={!desbloqueado || cargando}
                    onClick={() => iniciarNivel(n)}
                  >
                    <div className={`lvl-node ${desbloqueado ? "open" : "locked"}`}>
                      {desbloqueado ? n : <LockIcon />}
                    </div>
                    <div className="lvl-info">
                      <b>Nivel {n}</b>
                      <span className="dim">
                        {desbloqueado ? (mejor !== undefined ? `Mejor: ${mejor}/10` : "10 preguntas") : "Bloqueado"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {pantalla === "quiz" && preguntaActual && (
            <>
              <div className="quiz-head">
                <span className="badge">{materia}</span>
                <span className="badge">Nivel {nivel}</span>
              </div>
              <div className="progress">
                <i style={{ width: `${(indice / preguntas.length) * 100}%` }} />
              </div>
              <p className="dim center" style={{ marginBottom: 4 }}>
                Pregunta {indice + 1} de {preguntas.length}
              </p>
              <p className="dim center" style={{ marginBottom: 10 }}>{preguntaActual.instruccion}</p>

              <p className="enunciado">
                {preguntaActual.oracion.split("___")[0]}
                <span
                  className={`hueco ${feedback ? (feedback.correcto ? "ok" : "bad") : ""}`}
                >
                  {elegida ?? "    "}
                </span>
                {preguntaActual.oracion.split("___")[1]}
              </p>

              <div className="opt-grid">
                {preguntaActual.opciones.map((op) => {
                  let cls = "opt";
                  if (feedback) {
                    if (op === feedback.respuesta_correcta) cls += " ok";
                    else if (op === elegida) cls += " bad";
                    else cls += " fade";
                  }
                  return (
                    <button key={op} className={cls} disabled={!!feedback} onClick={() => elegirOpcion(op)}>
                      {op}
                    </button>
                  );
                })}
              </div>

              {feedback && (
                <div className={`feedback ${feedback.correcto ? "ok" : "bad"}`}>
                  <b className={feedback.correcto ? "green-t" : "red-t"}>
                    {feedback.correcto ? "¡Correcto! ✔" : "Incorrecto ✘"}
                  </b>
                  {feedback.explicacion}
                  <button className="btn" onClick={siguiente}>
                    {indice + 1 >= preguntas.length ? "Ver resultado" : "Siguiente →"}
                  </button>
                </div>
              )}
            </>
          )}

          {pantalla === "resultado" && (
            <div className="center">
              <p className="dim" style={{ marginTop: 20 }}>Resultado</p>
              <p className="score-big">
                {aciertos}
                <span className="dim" style={{ fontSize: 24 }}>/{preguntas.length}</span>
              </p>
              <p className="dim">
                {aciertos >= 6 ? "¡Nivel aprobado! 🎉" : "Necesitas 6/10 para aprobar. Inténtalo de nuevo."}
              </p>
              <div className="row2" style={{ marginTop: 18 }}>
                <button className="btn ghost" onClick={() => nivel && iniciarNivel(nivel)}>
                  Reintentar
                </button>
                <button className="btn" onClick={() => setPantalla("niveles")}>
                  Volver a niveles
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
