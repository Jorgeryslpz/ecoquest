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

- `data/banco_maestro_raw.json` — archivo original que diste (128
  reactivos, uno por cuota exacta de cada materia en el examen real).
- `scripts/transform-banco-maestro.mjs` — lo convierte al esquema canónico
  de la spec (§8.1) → `supabase/seed/reactivos.json`.
- `scripts/generate-seed-sql.mjs` — genera
  `supabase/seed/0001_reactivos_seed.sql` a partir de ese JSON, para poder
  cargarlo por el SQL Editor sin necesitar la Secret key.
- `scripts/seed-reactivos.mjs` — carga (o actualiza) el banco directo a
  Supabase por API, para cuando agregues más reactivos más adelante.
  Requiere `SUPABASE_SECRET_KEY` en el entorno:
  ```bash
  node scripts/seed-reactivos.mjs
  ```

**Huecos conocidos del banco actual** (no inventé estos datos, son huecos
reales de lo que diste):
- Solo **128 reactivos** en total (12-16 por materia) — la spec pide un
  **mínimo de 60 por materia (600 total)** para lanzar, y una meta de 150
  por materia. Con 128 no alcanza para armar un ejercicio de Materias (que
  necesita 20 preguntas por intento) sin repetir dentro del mismo intento
  en las materias de 12 reactivos.
- Ningún reactivo trae `subtemario` — quedó en `null` en todos. Los Mundos
  necesitan subtemario para organizar sus niveles; por ahora no se puede
  hacer esa separación real.
- Ningún reactivo trae `dificultad` — quedó en `2` (media) en todos.

## Variables de entorno

Ver `.env.example` para la lista completa con comentarios. Resumen de qué
falta y de dónde sacarlo:

| Variable | De dónde sale | Para qué etapa |
|---|---|---|
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API → Secret keys (`sb_secret_...`) | Etapa 1 (backend) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys (modo prueba) | Etapa 2 |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys (modo prueba) | Etapa 2 |
| `STRIPE_WEBHOOK_SECRET` | Se genera al crear el webhook en Stripe | Etapa 2 |
| `ANTHROPIC_API_KEY` | console.anthropic.com | Etapa 4 (TutorIA) |

## Pendientes de tu lado

- Banco de preguntas real hasta el mínimo de lanzamiento (600 reactivos),
  con `subtemario` y `dificultad` por reactivo.
- Dominio (ecoemsquest.mx o similar).
- Datos fiscales en Stripe antes del primer cobro real.
- Aviso de privacidad y términos (usuarios menores de edad).
