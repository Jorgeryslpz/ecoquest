# ECOEMS Quest

App web de preparación para el examen ECOEMS. Next.js (App Router) +
Supabase (auth + Postgres + Realtime) + Stripe + API de Anthropic.

## Estado del proyecto

- ✅ **Etapa 1** — estructura del proyecto, esquema completo de Supabase
  (incluye ya las tablas de Competir y Rachas) con RLS activado, script de
  carga del banco de reactivos, página temporal de verificación.
- ⬜ Etapa 2 — autenticación completa y paywall con Stripe.
- ⬜ Etapas 3-8 — ver `PROMPT_CLAUDE_CODE.md`.

## Documentos de referencia (no son la app)
- **`PROMPT_CLAUDE_CODE.md`** — plan de etapas y reglas de seguridad.
- **`ECOEMS_Quest_Spec_Final.md`** — especificación funcional completa.
- **`ECOEMS_Quest_Diagrama_Flujo_v1.2.docx`** — Competir y Rachas de estudio.
- **`demo/`** — versiones del front end visual (HTML estático, sin backend).

## Cómo correr el proyecto en local

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Copia `.env.example` a `.env.local` y llena las variables (ver abajo qué
   falta).
3. Aplica el esquema de base de datos en tu proyecto de Supabase — pega y
   ejecuta, en este orden, en el **SQL Editor** del dashboard
   (`https://supabase.com/dashboard/project/<tu-project-id>/sql/new`):
   1. `supabase/migrations/0001_init_schema.sql`
   2. `supabase/seed/0001_reactivos_seed.sql`
4. Levanta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre `http://localhost:3000` — mientras no exista la Etapa 3, verás una
   página temporal que confirma la conexión a Supabase y cuenta cuántos
   reactivos hay por materia.

## Banco de reactivos

**2,231 reactivos reales ya cargados en Supabase** (arriba del mínimo de
lanzamiento de 600 de la spec), en `data/banco_2231/` — 11 archivos JSON
que diste, uno por materia, con `id_reactivo`, `asignatura`, `subtemario`,
`dificultad`, `texto_lectura`, `enunciado`, `opciones`, `respuesta_correcta`
y `feedback` ya completos.

**11 materias reales** (Historia de México e Historia Universal cuentan
como materias separadas — decisión confirmada: no hay fuente oficial
gratuita que aclare el desglose exacto sin la guía completa de
miderechomilugar.gob.mx, y el banco ya las desarrolla por separado con 200
reactivos cada una). La spec §0 quedó actualizada: la cuota de 12 que
tenía "Historia" combinada se dividió 6/6 entre ambas, total sigue en 128.

- `scripts/merge-banco-reactivos.mjs` — combina los 11 archivos en
  `supabase/seed/reactivos.json`, con el mapeo exacto a las columnas de la
  tabla `reactivos`. La única conversión real es `dificultad`: viene como
  texto (fácil/media/difícil) y se pasa a 1/2/3.
- `scripts/generate-seed-sql.mjs` — genera
  `supabase/seed/0001_reactivos_seed.sql` a partir de ese JSON (con un
  `TRUNCATE` al inicio), para poder recargar el banco completo por el SQL
  Editor sin necesitar la Secret key.
- `scripts/reset-and-seed-reactivos.mjs` — hace lo mismo que el SQL de
  arriba pero por API (borra todo y vuelve a insertar en lotes). Así se
  cargó el banco real la primera vez:
  ```bash
  node --env-file=.env.local scripts/reset-and-seed-reactivos.mjs
  ```
- `scripts/seed-reactivos.mjs` — hace *upsert* (no borra nada) para cuando
  agregues o corrijas reactivos sueltos más adelante:
  ```bash
  node --env-file=.env.local scripts/seed-reactivos.mjs
  ```

Todos requieren `SUPABASE_SECRET_KEY` y Node **22 o superior** (el cliente
de Supabase necesita WebSocket nativo, que Node 20 no trae).

## Variables de entorno

Ver `.env.example` para la lista completa con comentarios. Resumen de qué
falta y de dónde sacarlo:

| Variable | De dónde sale | Para qué etapa |
|---|---|---|
| `SUPABASE_SECRET_KEY` | ✅ ya está en `.env.local` — Supabase → Project Settings → API → Secret keys si necesitas rotarla | Etapa 1 (backend) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys (modo prueba) | Etapa 2 |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys (modo prueba) | Etapa 2 |
| `STRIPE_WEBHOOK_SECRET` | Se genera al crear el webhook en Stripe | Etapa 2 |
| `ANTHROPIC_API_KEY` | console.anthropic.com | Etapa 4 (TutorIA) |

## Pendientes de tu lado

- Dominio (ecoemsquest.mx o similar).
- Datos fiscales en Stripe antes del primer cobro real.
- Aviso de privacidad y términos (usuarios menores de edad).
