"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Topbar from "@/components/Topbar";
import { ClanesIcon } from "@/lib/icons";

type Miembro = { user_id: string; puntos_semana: number; apodo: string };
type MiClan = { id: string; nombre: string; codigo: string; miembros: Miembro[] } | null;

export default function ClanesPage() {
  const [cargando, setCargando] = useState(true);
  const [miClan, setMiClan] = useState<MiClan>(null);
  const [nombre, setNombre] = useState("Los Cerebritos 3ºB");
  const [codigoInput, setCodigoInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membresia } = await supabase
      .from("clan_miembros")
      .select("clan_id, clanes(id, nombre, codigo)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membresia?.clanes) {
      const clan = membresia.clanes as unknown as { id: string; nombre: string; codigo: string };
      const { data: miembrosData } = await supabase
        .from("clan_miembros")
        .select("user_id, puntos_semana, profiles(apodo)")
        .eq("clan_id", clan.id)
        .order("puntos_semana", { ascending: false });

      const miembros: Miembro[] = (miembrosData ?? []).map((m) => ({
        user_id: m.user_id,
        puntos_semana: m.puntos_semana,
        apodo: (m.profiles as unknown as { apodo: string } | null)?.apodo ?? "Aspirante",
      }));
      setMiClan({ id: clan.id, nombre: clan.nombre, codigo: clan.codigo, miembros });
    } else {
      setMiClan(null);
    }
    setCargando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, []);

  async function enviar(cuerpo: { accion: "crear"; nombre: string } | { accion: "unirse"; codigo: string }) {
    setError(null);
    const res = await fetch("/api/clanes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo completar la acción.");
      return;
    }
    await cargar();
  }

  const crear = () => enviar({ accion: "crear", nombre });
  const unirse = () => enviar({ accion: "unirse", codigo: codigoInput });

  async function salir() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("clan_miembros").delete().eq("user_id", user.id);
    await cargar();
  }

  return (
    <div className="eq">
      <div className="eq-app">
        <Topbar title="Grupos de Estudio" backHref="/competir" />
        <div className="screen">
          <h1>
            <span style={{ color: "var(--green)" }}>
              <ClanesIcon />
            </span>{" "}
            Grupos de Estudio
          </h1>

          {cargando && <p className="dim">Cargando...</p>}

          {!cargando && !miClan && (
            <>
              <p className="dim">Grupos de estudio persistentes. Perfectos para un salón o un grupo de amigos.</p>
              <div className="card">
                <h2>Crear un grupo</h2>
                <input className="field" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                <button className="btn small" style={{ width: "auto", display: "inline-block", marginTop: 10 }} onClick={crear}>
                  Crear
                </button>
              </div>
              <div className="card">
                <h2>Unirse con código</h2>
                <input
                  className="field"
                  placeholder="Código de 6 letras"
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                  style={{ textTransform: "uppercase" }}
                />
                <button
                  className="btn small ghost"
                  style={{ width: "auto", display: "inline-block", marginTop: 10 }}
                  onClick={unirse}
                >
                  Unirme
                </button>
              </div>
              {error && <p className="red-t">{error}</p>}
            </>
          )}

          {!cargando && miClan && (
            <>
              <p className="dim">
                Código para invitar: <b className="gold">{miClan.codigo}</b>
              </p>
              <div className="card center">
                <div style={{ fontSize: 30 }}>{miClan.miembros.reduce((a, m) => a + m.puntos_semana, 0)}</div>
                <p className="dim">puntos del grupo esta semana</p>
              </div>
              <div className="card">
                <h2>Ranking del grupo</h2>
                {miClan.miembros.map((m, i) => (
                  <div key={m.user_id} className="mat-row">
                    <span>
                      {i + 1}. {m.apodo}
                    </span>
                    <b>{m.puntos_semana} pts</b>
                  </div>
                ))}
              </div>
              <button className="btn ghost" onClick={salir}>
                Salir del grupo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
