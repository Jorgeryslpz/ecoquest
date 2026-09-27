import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

function codigoAleatorio() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => letras[Math.floor(Math.random() * letras.length)]).join("");
}

// Crear un grupo o unirse con código. Va por aquí (service_role) y no
// directo desde el cliente para que nadie pueda insertarse con
// puntos_semana inflados: la fila siempre nace con el default (0).
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const admin = createServiceRoleClient();

  const { data: yaMiembro } = await admin
    .from("clan_miembros")
    .select("clan_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (yaMiembro) {
    return NextResponse.json({ error: "Ya perteneces a un grupo." }, { status: 409 });
  }

  let clanId: string;

  if (body?.accion === "crear") {
    const nombre =
      typeof body.nombre === "string" && body.nombre.trim() ? body.nombre.trim().slice(0, 40) : "Mi Grupo";
    let creado: string | null = null;
    for (let intento = 0; intento < 5 && !creado; intento++) {
      const { data, error } = await admin
        .from("clanes")
        .insert({ nombre, codigo: codigoAleatorio(), creado_por: user.id })
        .select("id")
        .single();
      if (data) creado = data.id;
      else if (error?.code !== "23505") {
        return NextResponse.json({ error: error?.message ?? "No se pudo crear el grupo." }, { status: 500 });
      }
    }
    if (!creado) {
      return NextResponse.json({ error: "No se pudo generar un código único, intenta de nuevo." }, { status: 500 });
    }
    clanId = creado;
  } else if (body?.accion === "unirse") {
    const codigo = typeof body.codigo === "string" ? body.codigo.trim().toUpperCase() : "";
    const { data: clan } = await admin.from("clanes").select("id").eq("codigo", codigo).maybeSingle();
    if (!clan) return NextResponse.json({ error: "No existe un grupo con ese código." }, { status: 404 });
    clanId = clan.id;
  } else {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  const { error: errMiembro } = await admin
    .from("clan_miembros")
    .insert({ clan_id: clanId, user_id: user.id });
  if (errMiembro) {
    return NextResponse.json(
      { error: errMiembro.code === "23505" ? "Ya perteneces a un grupo." : errMiembro.message },
      { status: errMiembro.code === "23505" ? 409 : 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
