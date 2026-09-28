import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Solo permite redirigir de vuelta a una ruta interna (nunca a otro host)
// para que "next" no se pueda usar como open-redirect.
function rutaSegura(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return "/inicio";
  }
  return next;
}

// Adonde Supabase redirige después de Google OAuth, de un link de correo
// tipo magic-link, o del link de "recuperar contraseña". Intercambia el
// código por sesión y manda a "next" (o a /inicio por defecto) — el layout
// protegido decide si te deja pasar o te manda a /pago.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = rutaSegura(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // El link de recuperación ya expiró o ya se usó: regresa a pedir uno nuevo.
      const destino = next === "/restablecer" ? "/recuperar?expirado=1" : "/login";
      return NextResponse.redirect(`${origin}${destino}`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
