"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RestablecerPage() {
  const router = useRouter();
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pass1.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres.");
      return;
    }
    if (pass1 !== pass2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setCargando(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: pass1 });
    setCargando(false);
    if (err) {
      setError(err.message);
      return;
    }
    setListo(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <>
      <h1>Nueva contraseña</h1>
      {listo ? (
        <p className="green-t" style={{ marginTop: 10 }}>
          Contraseña actualizada ✔ Redirigiendo a Iniciar sesión...
        </p>
      ) : (
        <form onSubmit={guardar}>
          <p className="dim" style={{ marginTop: 6 }}>Escribe tu nueva contraseña.</p>
          <input
            className="field"
            type="password"
            placeholder="Nueva contraseña"
            value={pass1}
            onChange={(e) => setPass1(e.target.value)}
          />
          <input
            className="field"
            type="password"
            placeholder="Confirmar contraseña"
            value={pass2}
            onChange={(e) => setPass2(e.target.value)}
          />
          {error && (
            <p className="red-t" style={{ marginTop: 10, fontSize: 14 }}>
              {error}
            </p>
          )}
          <button className="btn" type="submit" disabled={cargando}>
            {cargando ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      )}
    </>
  );
}
