"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function VerificarContenido() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [reenviado, setReenviado] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function reenviar() {
    if (cooldown > 0) return;
    setError(null);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (resendError) setError(resendError.message);
    else {
      setReenviado(true);
      setCooldown(60);
    }
  }

  return (
    <>
      <h1>Revisa tu correo 📬</h1>
      <p className="dim" style={{ marginTop: 8 }}>
        Te enviamos un link de confirmación a <b>{email || "tu correo"}</b> (expira en 24 horas).
        Ábrelo desde este mismo dispositivo o navegador para continuar — al confirmarlo, pasas
        directo a elegir tu plan.
      </p>
      {error && (
        <p className="red-t" style={{ marginTop: 10, fontSize: 14 }}>
          {error}
        </p>
      )}
      {reenviado && !error && (
        <p className="green-t" style={{ marginTop: 10, fontSize: 14 }}>
          Correo reenviado ✔
        </p>
      )}
      <button className="btn ghost" onClick={reenviar} disabled={cooldown > 0} style={{ marginTop: 16 }}>
        {cooldown > 0 ? `Reenviar correo (${cooldown}s)` : "Reenviar correo"}
      </button>
    </>
  );
}

export default function VerificarPage() {
  return (
    <Suspense fallback={null}>
      <VerificarContenido />
    </Suspense>
  );
}
