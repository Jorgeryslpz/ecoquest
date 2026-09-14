import { createBrowserClient } from "@supabase/ssr";

// Cliente para Client Components. Usa la publishable key (segura para el
// navegador) — nunca la secret key aquí.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
