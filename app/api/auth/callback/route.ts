import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Adonde Supabase redirige después de Google OAuth (o de un link de correo
// tipo magic-link). Intercambia el código por sesión y manda a /inicio —
// el layout protegido decide si te deja pasar o te manda a /pago.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/inicio`);
}
