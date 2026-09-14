import { createServiceRoleClient } from "@/lib/supabase/server";

const MATERIAS = [
  "Español",
  "Habilidad Verbal",
  "Matemáticas",
  "Habilidad Matemática",
  "Biología",
  "Física",
  "Química",
  "Historia",
  "Geografía",
  "Formación Cívica y Ética",
];

type Estado =
  | { tipo: "sin-secret-key" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "ok"; total: number; porMateria: Record<string, number> };

async function getEstado(): Promise<Estado> {
  if (!process.env.SUPABASE_SECRET_KEY) {
    return { tipo: "sin-secret-key" };
  }
  try {
    const supabase = createServiceRoleClient();
    const { data, error, count } = await supabase
      .from("reactivos")
      .select("asignatura", { count: "exact" });

    if (error) return { tipo: "error", mensaje: error.message };

    const porMateria: Record<string, number> = {};
    for (const m of MATERIAS) porMateria[m] = 0;
    for (const row of data ?? []) {
      porMateria[row.asignatura] = (porMateria[row.asignatura] ?? 0) + 1;
    }
    return { tipo: "ok", total: count ?? data?.length ?? 0, porMateria };
  } catch (e) {
    return { tipo: "error", mensaje: e instanceof Error ? e.message : String(e) };
  }
}

export default async function Home() {
  const estado = await getEstado();

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-8 font-sans dark:bg-black">
      <main className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
          Etapa 1 — página temporal
        </p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          ECOEMS Quest — estado del proyecto
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Esta pantalla no es parte de la app real; solo confirma que el proyecto y la
          base de datos están conectados. Se reemplaza en la Etapa 3.
        </p>

        <div className="mt-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Conexión a Supabase
          </h2>

          {estado.tipo === "sin-secret-key" && (
            <div className="mt-2 text-sm text-amber-700 dark:text-amber-400">
              <p>
                ⚠ Falta <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">
                  SUPABASE_SECRET_KEY
                </code>{" "}
                en <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">.env.local</code>.
              </p>
              <p className="mt-2">
                Mientras tanto, aplica el esquema y el seed directamente en el SQL
                Editor de Supabase:
              </p>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                <li>
                  Pega y ejecuta{" "}
                  <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">
                    supabase/migrations/0001_init_schema.sql
                  </code>
                </li>
                <li>
                  Pega y ejecuta{" "}
                  <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">
                    supabase/seed/0001_reactivos_seed.sql
                  </code>
                </li>
              </ol>
              <p className="mt-2">
                Cuando tengas la Secret key, agrégala a{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">.env.local</code>{" "}
                y recarga esta página para ver el conteo real.
              </p>
            </div>
          )}

          {estado.tipo === "error" && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
              <p>✘ No se pudo consultar la tabla `reactivos`:</p>
              <pre className="mt-2 overflow-x-auto rounded bg-red-50 p-2 text-xs dark:bg-red-950">
                {estado.mensaje}
              </pre>
              <p className="mt-2 text-zinc-500">
                Lo más probable es que falte aplicar{" "}
                <code>supabase/migrations/0001_init_schema.sql</code>.
              </p>
            </div>
          )}

          {estado.tipo === "ok" && (
            <div className="mt-2 text-sm">
              <p className="text-green-700 dark:text-green-400">
                ✔ Conectado — {estado.total} reactivos en la base de datos.
              </p>
              <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                {MATERIAS.map((m) => (
                  <li
                    key={m}
                    className="flex items-center justify-between py-1.5 text-zinc-700 dark:text-zinc-300"
                  >
                    <span>{m}</span>
                    <span className="font-mono font-semibold">
                      {estado.porMateria[m] ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
