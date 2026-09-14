import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente para Server Components / Route Handlers, atado a la sesión del
// usuario que hace la petición (respeta RLS como ese usuario). Usa la
// publishable key — sigue siendo seguro porque va autenticado con las
// cookies de sesión, no con privilegios elevados.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se llama desde un Server Component; el middleware ya refresca
            // la sesión, así que esto es seguro de ignorar.
          }
        },
      },
    }
  );
}

// Cliente con privilegios de servidor (bypassa RLS). SOLO para código que
// corre en el servidor y necesita leer/escribir tablas sin policies para el
// cliente (reactivos, suscripciones, pagos, monedero, webhooks de Stripe).
// NUNCA importar este archivo desde un Client Component.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServiceRoleClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY no está configurada en .env.local — necesaria para operaciones de servidor."
    );
  }
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    auth: { persistSession: false },
  });
}
