import { getUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import MundosClient from "./MundosClient";

export default async function MundosPage() {
  const user = await getUser();
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("mundos_progreso")
    .select("materia, nivel, mejor_aciertos")
    .eq("user_id", user!.id);

  const progreso: Record<string, Record<number, number>> = {};
  for (const row of data ?? []) {
    progreso[row.materia] ??= {};
    progreso[row.materia][row.nivel] = row.mejor_aciertos;
  }

  return <MundosClient progresoInicial={progreso} />;
}
