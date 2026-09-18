-- BUG encontrado en pruebas reales: la migración 0004 creó un índice
-- único PARCIAL (`where stripe_subscription_id is not null`). Postgres no
-- puede usar un índice parcial como "arbiter" de un ON CONFLICT a menos
-- que el ON CONFLICT repita la misma condición WHERE — y el upsert que
-- genera supabase-js no la repite. Resultado: el upsert del webhook
-- fallaba en silencio (Postgres regresaba error, pero el código no lo
-- revisaba) y la fila de suscripción nunca se escribía, aunque Stripe
-- confirmara el pago y el webhook respondiera 200.
--
-- Arreglo: un unique constraint normal (sin WHERE). En Postgres, NULL se
-- trata como distinto de cualquier otro NULL por default, así que varias
-- filas con stripe_subscription_id NULL siguen siendo válidas sin
-- necesitar la condición parcial.
drop index if exists public.suscripciones_stripe_subscription_id_key;

alter table public.suscripciones
  add constraint suscripciones_stripe_subscription_id_key unique (stripe_subscription_id);
