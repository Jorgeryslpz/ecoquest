"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ligaDeTrofeos } from "@/lib/liga";
import QuizRunner, { PreguntaQuiz } from "@/components/QuizRunner";
import LogoutButton from "@/components/LogoutButton";

type ResultadoDuelo = {
  aciertos: number;
  total: number;
  rival: string;
  aciertosRival: number;
  cambio: number;
  desenlace: "gano" | "perdio" | "empate";
  trofeosTotal: number;
};

export default function ArenaPage() {
  const [trofeos, setTrofeos] = useState<number | null>(null);
  const [estado, setEstado] = useState<"inicio" | "cargando" | "duelo" | "resultado">("inicio");
  const [preguntas, setPreguntas] = useState<PreguntaQuiz[]>([]);
  const [resultado, setResultado] = useState<ResultadoDuelo | null>(null);

  async function cargarTrofeos() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("trofeos_liga").select("trofeos").eq("user_id", user.id).maybeSingle();
    setTrofeos(data?.trofeos ?? 0);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTrofeos();
  }, []);

  async function buscarRival() {
    setEstado("cargando");
    const res = await fetch("/api/arena/duelo");
    const data = await res.json();
    setPreguntas(data.preguntas ?? []);
    setEstado("duelo");
  }

  async function terminar(respuestas: Record<string, string>) {
    const res = await fetch("/api/arena/calificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respuestas }),
    });
    const data = await res.json();
    setResultado(data);
    setTrofeos(data.trofeosTotal);
    setEstado("resultado");
  }

  if (estado === "duelo") {
    return (
      <QuizRunner
        titulo="Duelo Arena"
        preguntas={preguntas}
        tiempoSeg={2 * 60}
        onTerminar={terminar}
        onSalir={() => setEstado("inicio")}
      />
    );
  }

  const liga = trofeos !== null ? ligaDeTrofeos(trofeos) : null;

  return (
    <div className="eq">
      <div className="eq-app">
        <div className="topbar">
          <Link href="/competir" className="iconbtn" title="Regresar">
            ←
          </Link>
          <div className="tb-title">Arena PvP</div>
          <LogoutButton />
        </div>
        <div className="screen">
          <h1>Arena PvP</h1>

          <div className="card center">
            <h2>Liga {liga ?? "..."}</h2>
            <p className="dim">{trofeos ?? "..."} 🏆 trofeos</p>
          </div>

          <div className="card">
            <h2>Ligas por trofeos</h2>
            <div className="mat-row">
              <span>Bronce</span>
              <span className="dim">0–99</span>
            </div>
            <div className="mat-row">
              <span>Plata</span>
              <span className="dim">100–249</span>
            </div>
            <div className="mat-row">
              <span>Oro</span>
              <span className="dim">250–499</span>
            </div>
            <div className="mat-row">
              <span>Diamante</span>
              <span className="dim">500+</span>
            </div>
          </div>

          {estado === "resultado" && resultado && (
            <div className="card center" style={{ borderColor: "var(--gold)" }}>
              <h2>
                {resultado.desenlace === "gano"
                  ? "¡Ganaste! 🎉"
                  : resultado.desenlace === "perdio"
                    ? "Perdiste 😕"
                    : "Empate 🤝"}
              </h2>
              <div className="mat-row">
                <span>Tú</span>
                <b>
                  {resultado.aciertos}/{resultado.total}
                </b>
              </div>
              <div className="mat-row">
                <span>{resultado.rival}</span>
                <b>
                  {resultado.aciertosRival}/{resultado.total}
                </b>
              </div>
              <p className="score-big" style={{ fontSize: 30 }}>
                {resultado.cambio > 0 ? "+" : ""}
                {resultado.cambio} 🏆
              </p>
            </div>
          )}

          <button className="btn" disabled={estado === "cargando"} onClick={buscarRival}>
            {estado === "cargando" ? "Buscando rival..." : "Buscar rival"}
          </button>
          <p className="dim center" style={{ marginTop: 8 }}>
            Duelo de 5 preguntas · +20 🏆 si ganas, −15 si pierdes
          </p>
        </div>
      </div>
    </div>
  );
}
