"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setCargando(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo iniciar sesión.");
      return;
    }
    router.push("/inicio");
    router.refresh();
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
      <button className="iconbtn" onClick={() => router.push("/")} style={{ marginBottom: 14 }}>
        ←
      </button>
      <h1>Iniciar sesión</h1>

      <button className="btn ghost" onClick={conGoogle} style={{ marginTop: 16 }}>
        Continuar con Google
      </button>
      <div className="dim center" style={{ margin: "14px 0" }}>
        — o con tu correo —
      </div>

      <form onSubmit={entrar}>
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && (
          <p className="red-t" style={{ marginTop: 10, fontSize: 14 }}>
            {error}
          </p>
        )}
        <button className="btn" type="submit" disabled={cargando}>
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p
        className="dim center"
        style={{ marginTop: 14, textDecoration: "underline", cursor: "pointer" }}
        onClick={() => router.push("/recuperar")}
      >
        ¿Olvidaste tu contraseña?
      </p>
      <p className="dim center" style={{ marginTop: 8 }}>
        ¿No tienes cuenta? <Link href="/registro" style={{ textDecoration: "underline" }}>Créala</Link>
      </p>
    </>
  );
}
