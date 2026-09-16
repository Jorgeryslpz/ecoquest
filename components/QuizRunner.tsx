"use client";

import { useEffect, useMemo, useState } from "react";
import { BackIcon, SunIcon, MoonIcon } from "@/lib/icons";

export type PreguntaQuiz = {
  id_reactivo: string;
  asignatura: string;
  subtemario: string | null;
  texto_lectura: string | null;
  enunciado: string;
  opciones: Record<string, string>;
};

const LETRAS = ["A", "B", "C", "D"];

export default function QuizRunner({
  titulo,
  preguntas,
  tiempoSeg,
  onTerminar,
  onSalir,
}: {
  titulo: string;
  preguntas: PreguntaQuiz[];
  tiempoSeg?: number;
  onTerminar: (respuestas: Record<string, string>) => void;
  onSalir: () => void;
}) {
  const [claro, setClaro] = useState(false);
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [tiempoRestante, setTiempoRestante] = useState(tiempoSeg ?? 0);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [confirmarTerminar, setConfirmarTerminar] = useState(false);

  const q = preguntas[indice];
  const respondidas = Object.keys(respuestas).length;

  useEffect(() => {
    if (!tiempoSeg) return;
    if (tiempoRestante <= 0) {
      onTerminar(respuestas);
      return;
    }
    const t = setTimeout(() => setTiempoRestante((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempoRestante, tiempoSeg]);

  const tiempoTexto = useMemo(() => {
    const m = Math.floor(tiempoRestante / 60);
    const s = tiempoRestante % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }, [tiempoRestante]);

  if (!q) return null;

  return (
    <div className={`eq ${claro ? "light" : ""}`}>
      <div className="eq-app">
        <div className="topbar">
          <button className="iconbtn" onClick={() => setConfirmarSalida(true)} title="Salir">
            <BackIcon />
          </button>
          <div className="tb-title">{titulo}</div>
          <button className="iconbtn" onClick={() => setClaro((c) => !c)} title="Cambiar tema">
            {claro ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>

        <div className="screen">
          <div className="quiz-head">
            <span className="badge">{q.asignatura}</span>
            {tiempoSeg ? (
              <span className={`timer ${tiempoRestante <= 30 ? "low" : ""}`}>⏱ {tiempoTexto}</span>
            ) : (
              <span className="badge">{respondidas}/{preguntas.length}</span>
            )}
          </div>
          <div className="progress">
            <i style={{ width: `${(indice / preguntas.length) * 100}%` }} />
          </div>
          <p className="dim">
            Pregunta {indice + 1} de {preguntas.length}
          </p>

          {q.texto_lectura && (
            <div
              style={{
                background: "var(--panel2)",
                border: "2px solid var(--line)",
                borderRadius: 16,
                padding: "12px 14px",
                fontSize: 14,
                lineHeight: 1.5,
                margin: "12px 0",
                maxHeight: 180,
                overflowY: "auto",
              }}
            >
              {q.texto_lectura}
            </div>
          )}

          <p className="enunciado" style={{ textAlign: "left" }}>
            {q.enunciado}
          </p>

          <div>
            {LETRAS.filter((l) => q.opciones[l]).map((l) => {
              const seleccionada = respuestas[q.id_reactivo] === l;
              return (
                <button
                  key={l}
                  className={`opt`}
                  style={{
                    display: "flex",
                    gap: 12,
                    textAlign: "left",
                    justifyContent: "flex-start",
                    borderColor: seleccionada ? "var(--blue)" : undefined,
                    background: seleccionada ? "var(--sel-bg)" : undefined,
                  }}
                  onClick={() => setRespuestas((r) => ({ ...r, [q.id_reactivo]: l }))}
                >
                  <span className="dim" style={{ fontWeight: 800 }}>
                    {l})
                  </span>
                  <span>{q.opciones[l]}</span>
                </button>
              );
            })}
          </div>

          <div className="row2" style={{ marginTop: 16 }}>
            <button className="btn ghost" disabled={indice === 0} onClick={() => setIndice((i) => i - 1)}>
              ← Anterior
            </button>
            {indice < preguntas.length - 1 ? (
              <button className="btn" onClick={() => setIndice((i) => i + 1)}>
                Siguiente →
              </button>
            ) : (
              <button className="btn green" onClick={() => setConfirmarTerminar(true)}>
                Terminar ✔
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`modal-bg ${confirmarSalida ? "show" : ""}`}>
        <div className="modal">
          <h2>¿Salir del ejercicio?</h2>
          <p className="dim">Perderás el progreso de este intento.</p>
          <div className="row2" style={{ marginTop: 14 }}>
            <button className="btn ghost" onClick={() => setConfirmarSalida(false)}>
              Seguir
            </button>
            <button className="btn" onClick={onSalir}>
              Salir
            </button>
          </div>
        </div>
      </div>

      <div className={`modal-bg ${confirmarTerminar ? "show" : ""}`}>
        <div className="modal">
          <h2>Terminar y calificar</h2>
          <p className="dim">
            {respondidas < preguntas.length
              ? `Tienes ${preguntas.length - respondidas} pregunta(s) sin responder.`
              : "Respondiste todo."}
          </p>
          <div className="row2" style={{ marginTop: 14 }}>
            <button className="btn ghost" onClick={() => setConfirmarTerminar(false)}>
              Revisar
            </button>
            <button className="btn green" onClick={() => onTerminar(respuestas)}>
              Calificar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
