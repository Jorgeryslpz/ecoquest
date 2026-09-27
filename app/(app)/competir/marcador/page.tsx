"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { MarcadorIcon } from "@/lib/icons";

type Fila = { id: string; apodo: string; score: number; tu: boolean };

export default function MarcadorPage() {
  const [top, setTop] = useState<Fila[]>([]);
  const [posicion, setPosicion] = useState<number | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/marcador");
      const data = await res.json();
      setTop(data.top ?? []);
      setPosicion(data.posicion ?? null);
      setTotal(data.total ?? 0);
    })();
  }, []);

  return (
    <div className="eq">
      <div className="eq-app">
        <Topbar title="Marcador Global" backHref="/competir" />
        <div className="screen">
          <h1>
            <span style={{ color: "var(--red)" }}>
              <MarcadorIcon />
            </span>{" "}
            Marcador Global
          </h1>
          <p className="dim">Combina trofeos de Arena + progreso de Mundo de Preguntas. Solo apodos.</p>

          <div className="card center" style={{ borderColor: "var(--gold)" }}>
            <p className="dim">Tu posición</p>
            <div className="score-big" style={{ fontSize: 30 }}>
              #{posicion ?? "..."} <span className="dim" style={{ fontSize: 15 }}>de {total}</span>
            </div>
          </div>

          <div className="card">
            <h2>Top 10</h2>
            {top.map((f, i) => (
              <div key={f.id} className="mat-row">
                <span>
                  {i + 1}. {f.apodo}
                  {f.tu && (
                    <span className="badge" style={{ marginLeft: 6, color: "var(--gold)", borderColor: "var(--gold)" }}>
                      Tú
                    </span>
                  )}
                </span>
                <b>{f.score} pts</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
