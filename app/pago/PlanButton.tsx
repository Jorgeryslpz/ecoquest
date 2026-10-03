"use client";

import { useEffect, useState } from "react";
import type { PlanId } from "@/lib/stripe";

export default function PlanButton({
  plan,
  nombre,
  precio,
  sub,
  best,
  autoStart,
}: {
  plan: PlanId;
  nombre: string;
  precio: string;
  sub?: string;
  best?: boolean;
  // Si viene de un link de precios (?plan=...), dispara el checkout solo,
  // sin esperar a que el usuario vuelva a darle clic al plan que ya eligió.
  autoStart?: boolean;
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function elegir() {
    setError(null);
    setCargando(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      setCargando(false);
      setError(data.error ?? "No se pudo iniciar el pago.");
      return;
    }
    window.location.href = data.url;
  }

  useEffect(() => {
    if (!autoStart) return;
    // setTimeout defiere la llamada fuera del cuerpo síncrono del efecto
    // (evita el aviso de React sobre setState síncrono dentro de un efecto).
    const id = setTimeout(() => {
      elegir();
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <>
      <button className={`plan ${best ? "best" : ""}`} onClick={elegir} disabled={cargando}>
        <div>
          <b>
            {nombre} {best ? "⭐" : ""}
          </b>
          <span className="sub">
            {cargando && autoStart ? "Preparando tu pago..." : (sub ?? "Para el empujón final")}
          </span>
        </div>
        <span className="price">{precio}</span>
      </button>
      {error && (
        <p className="red-t" style={{ marginTop: 6, fontSize: 14 }}>
          {error}
        </p>
      )}
    </>
  );
}
