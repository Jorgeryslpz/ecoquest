"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function RecuperarContenido() {
  const router = useRouter();
  const params = useSearchParams();
  const expirado = params.get("expirado") === "1";
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
      redirectTo: `${window.location.origin}/api/auth/callback?next=/restablecer`,
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

      {expirado && !enviado && (
        <p className="red-t" style={{ marginTop: 10, fontSize: 14 }}>
          El link anterior ya expiró o ya se usó. Pide uno nuevo.
        </p>
      )}

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

export default function RecuperarPage() {
  return (
    <Suspense fallback={null}>
      <RecuperarContenido />
    </Suspense>
  );
}
