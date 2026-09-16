-- El webhook de Stripe hace upsert en `suscripciones` por
-- stripe_subscription_id (una fila por suscripción de Stripe, se
-- actualiza en vez de duplicarse en cada evento). Postgres exige un
-- índice único para poder hacer ON CONFLICT sobre esa columna.
create unique index suscripciones_stripe_subscription_id_key
  on public.suscripciones (stripe_subscription_id)
  where stripe_subscription_id is not null;
