import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const MAX_INTENTOS = 5;
const BLOQUEO_MIN = 10;

export async function POST(request: NextRequest) {
  const { email, password } = await request.json().catch(() => ({}));
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Correo y contraseña son requeridos." }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const emailLower = email.trim().toLowerCase();

  const { data: intento } = await admin
    .from("login_intentos")
    .select("intentos, bloqueado_hasta")
    .eq("email", emailLower)
    .maybeSingle();

  if (intento?.bloqueado_hasta && new Date(intento.bloqueado_hasta) > new Date()) {
    const minutosRestantes = Math.ceil(
      (new Date(intento.bloqueado_hasta).getTime() - Date.now()) / 60000
    );
    return NextResponse.json(
      {
        error: `Demasiados intentos. Espera ${minutosRestantes} minuto${minutosRestantes === 1 ? "" : "s"} para volver a intentar.`,
        bloqueado: true,
      },
      { status: 429 }
    );
  }

  // Este cliente sí escribe la cookie de sesión en la respuesta (createClient
  // de lib/supabase/server usa las cookies de la petición actual).
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: emailLower,
    password,
  });

  if (signInError) {
    const intentosNuevos = (intento?.intentos ?? 0) + 1;
    const bloqueado = intentosNuevos >= MAX_INTENTOS;
    await admin.from("login_intentos").upsert({
      email: emailLower,
      intentos: bloqueado ? 0 : intentosNuevos,
      bloqueado_hasta: bloqueado
        ? new Date(Date.now() + BLOQUEO_MIN * 60000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        error: bloqueado
          ? `Demasiados intentos. Espera ${BLOQUEO_MIN} minutos para volver a intentar.`
          : "Correo o contraseña incorrectos.",
      },
      { status: 401 }
    );
  }

  // Login exitoso: limpiar el contador de intentos fallidos.
  await admin.from("login_intentos").delete().eq("email", emailLower);

  return NextResponse.json({ ok: true });
}
