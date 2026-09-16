"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuizRunner, { PreguntaQuiz } from "@/components/QuizRunner";

type Resultado = {
  aciertos: number;
  total: number;
  porMateria: Record<string, { aciertos: number; total: number; clasificacion: string }>;
};

export default function ExamenPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<"intro" | "cargando" | "quiz" | "resultado">("intro");
  const [preguntas, setPreguntas] = useState<PreguntaQuiz[]>([]);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function comenzar() {
    setEstado("cargando");
    const res = await fetch("/api/examen/armar");
    const data = await res.json();
    setPreguntas(data.preguntas ?? []);
    setEstado("quiz");
  }

  async function terminar(respuestas: Record<string, string>) {
    const res = await fetch("/api/examen/calificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respuestas }),
    });
    const data = await res.json();
    setResultado(data);
    setEstado("resultado");
  }

  if (estado === "intro") {
    return (
      <div className="eq">
        <div className="eq-app">
          <div className="topbar">
            <button className="iconbtn" onClick={() => router.push("/inicio")}>
              ←
            </button>
            <div className="tb-title">Examen</div>
            <span style={{ width: 40 }} />
          </div>
          <div className="screen">
            <h1>Simulador de examen</h1>
            <div className="card">
              <p>
                <b>128 reactivos</b> con la distribución oficial del ECOEMS, uno diferente cada vez
                que lo presentas. <b>3 horas</b>, cronómetro siempre visible, sin pausa — fiel al
                examen real.
              </p>
            </div>
            <button className="btn" onClick={comenzar}>
              Comenzar simulacro
            </button>
            <button className="btn ghost" onClick={() => router.push("/inicio")}>
              ← Regresar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (estado === "cargando") {
    return (
      <div className="eq">
        <div className="eq-app">
          <div className="screen center" style={{ paddingTop: 60 }}>
            <p className="dim">Armando tus 128 reactivos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (estado === "quiz") {
    return (
      <QuizRunner
        titulo="Examen"
        preguntas={preguntas}
        tiempoSeg={3 * 60 * 60}
        onTerminar={terminar}
        onSalir={() => router.push("/inicio")}
      />
    );
  }

  if (estado === "resultado" && resultado) {
    return (
      <div className="eq">
        <div className="eq-app">
          <div className="screen">
            <h1 className="center">Resultados del examen</h1>
            <p className="score-big">
              {resultado.aciertos}
              <span className="dim" style={{ fontSize: 24 }}>
                /{resultado.total}
              </span>
            </p>
            <div className="card">
              {Object.entries(resultado.porMateria).map(([m, r]) => (
                <div key={m} className="mat-row">
                  <span>{m}</span>
                  <span>
                    <b>
                      {r.aciertos}/{r.total}
                    </b>{" "}
                    <span
                      className={`pill ${r.clasificacion === "Fuerte" ? "f" : r.clasificacion === "Regular" ? "r" : "d"}`}
                    >
                      {r.clasificacion}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <button className="btn" onClick={() => router.push("/inicio")}>
              Ir a inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
