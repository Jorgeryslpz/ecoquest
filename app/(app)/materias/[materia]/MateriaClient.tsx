"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuizRunner, { PreguntaQuiz } from "@/components/QuizRunner";

type Resultado = {
  aciertos: number;
  total: number;
  detalle: {
    id_reactivo: string;
    elegida: string | null;
    respuesta_correcta: string;
    correcta: boolean;
    feedback: string;
  }[];
};

export default function MateriaClient({ materia }: { materia: string }) {
  const router = useRouter();
  const [estado, setEstado] = useState<"cargando" | "quiz" | "resultado">("cargando");
  const [preguntas, setPreguntas] = useState<PreguntaQuiz[]>([]);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const tiempoSeg = materia.startsWith("Habilidad") ? 20 * 60 : 15 * 60;

  async function cargar() {
    setEstado("cargando");
    const res = await fetch(`/api/materias/armar?materia=${encodeURIComponent(materia)}`);
    const data = await res.json();
    setPreguntas(data.preguntas ?? []);
    setEstado("quiz");
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materia]);

  async function terminar(respuestas: Record<string, string>) {
    const res = await fetch("/api/materias/calificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "materias", materia, respuestas }),
    });
    const data = await res.json();
    setResultado(data);
    setEstado("resultado");
  }

  async function guardarRepaso(id_reactivo: string) {
    await fetch("/api/repaso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_reactivo }),
    });
  }

  if (estado === "cargando") {
    return (
      <div className="eq">
        <div className="eq-app">
          <div className="screen center" style={{ paddingTop: 60 }}>
            <p className="dim">Armando tu ejercicio de {materia}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (estado === "quiz") {
    return (
      <QuizRunner
        titulo={`${materia}`}
        preguntas={preguntas}
        tiempoSeg={tiempoSeg}
        onTerminar={terminar}
        onSalir={() => router.push("/materias")}
      />
    );
  }

  if (estado === "resultado" && resultado) {
    return (
      <div className="eq">
        <div className="eq-app">
          <div className="screen">
            <h1 className="center">Ejercicio terminado</h1>
            <p className="score-big">
              {resultado.aciertos}
              <span className="dim" style={{ fontSize: 24 }}>
                /{resultado.total}
              </span>
            </p>
            <div className="card">
              {resultado.detalle.map((d) => (
                <div key={d.id_reactivo} className="mat-row" style={{ alignItems: "flex-start" }}>
                  <span style={{ flex: 1, fontSize: 14 }}>
                    {d.feedback}
                    <br />
                    <span
                      className="dim"
                      style={{ textDecoration: "underline", cursor: "pointer" }}
                      onClick={() => guardarRepaso(d.id_reactivo)}
                    >
                      Guardar para repasar
                    </span>
                  </span>
                  <span className={`pill ${d.correcta ? "f" : "d"}`}>{d.correcta ? "✔" : "✘"}</span>
                </div>
              ))}
            </div>
            <div className="row2" style={{ marginTop: 12 }}>
              <button className="btn ghost" onClick={cargar}>
                Otro ejercicio
              </button>
              <button className="btn" onClick={() => router.push("/materias")}>
                Materias
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
