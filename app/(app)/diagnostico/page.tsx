"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuizRunner, { PreguntaQuiz } from "@/components/QuizRunner";

type Resultado = {
  aciertos: number;
  total: number;
  porMateria: Record<string, { aciertos: number; total: number; clasificacion: string }>;
};

export default function DiagnosticoPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<"cargando" | "quiz" | "resultado" | "error">("cargando");
  const [preguntas, setPreguntas] = useState<PreguntaQuiz[]>([]);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/materias/armar?diagnostico=1");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar el diagnóstico.");
        setEstado("error");
        return;
      }
      setPreguntas(data.preguntas ?? []);
      setEstado("quiz");
    })();
  }, []);

  async function terminar(respuestas: Record<string, string>) {
    const res = await fetch("/api/materias/calificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "diagnostico", respuestas }),
    });
    const data = await res.json();
    setResultado(data);
    setEstado("resultado");
  }

  if (estado === "cargando") {
    return (
      <div className="eq">
        <div className="eq-app">
          <div className="screen center" style={{ paddingTop: 60 }}>
            <p className="dim">Armando tu diagnóstico...</p>
          </div>
        </div>
      </div>
    );
  }

  if (estado === "error") {
    return (
      <div className="eq">
        <div className="eq-app">
          <div className="screen center" style={{ paddingTop: 60 }}>
            <p className="dim">{error}</p>
            <button className="btn" onClick={() => router.push("/inicio")}>
              Ir a inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (estado === "quiz") {
    return (
      <QuizRunner
        titulo="Diagnóstico"
        preguntas={preguntas}
        tiempoSeg={60 * 60}
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
            <h1 className="center">Diagnóstico listo</h1>
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
                  <span
                    className={`pill ${r.clasificacion === "Fuerte" ? "f" : r.clasificacion === "Regular" ? "r" : "d"}`}
                  >
                    {r.clasificacion}
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
