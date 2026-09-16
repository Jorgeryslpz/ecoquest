"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    setCargando(false);
    if (err) {
      setError(err.message);
      return;
    }
    setEnviado(true);
  }

  return (
    <>
      <button className="iconbtn" onClick={() => router.push("/login")} style={{ marginBottom: 14 }}>
        ←
      </button>
      <h1>Recuperar contraseña</h1>

      {enviado ? (
        <p className="dim" style={{ marginTop: 10 }}>
          Si <b>{email}</b> tiene una cuenta, te llegó un correo con un link para crear una nueva
          contraseña (válido 1 hora).
        </p>
      ) : (
        <form onSubmit={enviar}>
          <p className="dim" style={{ marginTop: 6 }}>
            Escribe tu correo y te mandamos un link para restablecer tu contraseña.
          </p>
          <input
            className="field"
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && (
            <p className="red-t" style={{ marginTop: 10, fontSize: 14 }}>
              {error}
            </p>
          )}
          <button className="btn" type="submit" disabled={cargando}>
            {cargando ? "Enviando..." : "Enviar link"}
          </button>
        </form>
      )}
    </>
  );
}
