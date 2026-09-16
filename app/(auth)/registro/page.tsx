"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function crearCuenta(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.includes("@")) {
      setError("Escribe un correo válido.");
      return;
    }
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
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: pass1,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    setCargando(false);

    if (signUpError) {
      setError(
        signUpError.message.includes("already registered")
          ? "Ese correo ya está registrado. Intenta iniciar sesión."
          : signUpError.message
      );
      return;
    }

    router.push(`/verificar?email=${encodeURIComponent(email)}`);
  }

  async function conGoogle() {
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (oauthError) setError(oauthError.message);
  }

  return (
    <>
      <button className="iconbtn" onClick={() => router.back()} style={{ marginBottom: 14 }}>
        ←
      </button>
      <h1>Crear cuenta</h1>

      <button className="btn ghost" onClick={conGoogle} style={{ marginTop: 16 }}>
        Continuar con Google
      </button>
      <div className="dim center" style={{ margin: "14px 0" }}>
        — o con tu correo —
      </div>

      <form onSubmit={crearCuenta}>
        <input
          className="field"
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className="field"
          type="password"
          placeholder="Contraseña"
          value={pass1}
          onChange={(e) => setPass1(e.target.value)}
          autoComplete="new-password"
        />
        <input
          className="field"
          type="password"
          placeholder="Confirmar contraseña"
          value={pass2}
          onChange={(e) => setPass2(e.target.value)}
          autoComplete="new-password"
        />
        {error && (
          <p className="red-t" style={{ marginTop: 10, fontSize: 14 }}>
            {error}
          </p>
        )}
        <button className="btn" type="submit" disabled={cargando}>
          {cargando ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="dim center" style={{ marginTop: 16 }}>
        ¿Ya tienes cuenta? <Link href="/login" style={{ textDecoration: "underline" }}>Inicia sesión</Link>
      </p>
    </>
  );
}
