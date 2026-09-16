"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({ full }: { full?: boolean }) {
  const router = useRouter();

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (full) {
    return (
      <button className="btn ghost" onClick={salir}>
        Cerrar sesión
      </button>
    );
  }

  return (
    <button className="iconbtn" onClick={salir} title="Cerrar sesión">
      ⏻
    </button>
  );
}
