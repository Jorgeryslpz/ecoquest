import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Nunca confiamos en el cliente para saber si "ya pagó" — este webhook,
// verificado con la firma de Stripe, es la ÚNICA fuente de verdad que
// escribe en `suscripciones`.
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Falta STRIPE_WEBHOOK_SECRET." }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta la firma de Stripe." }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Firma inválida: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 }
    );
  }

  const admin = createServiceRoleClient();

  async function upsertDesdeSuscripcion(sub: Stripe.Subscription) {
    const userId = sub.metadata?.user_id;
    const plan = sub.metadata?.plan;
    if (!userId || !plan) return;

    const item = sub.items.data[0];
    const finUnix = item?.current_period_end ?? sub.items.data[0]?.current_period_end;
    const fin = finUnix ? new Date(finUnix * 1000).toISOString() : new Date().toISOString();

    const estado: "activa" | "vencida" | "cancelada" =
      sub.status === "trialing" || sub.status === "active"
        ? "activa"
        : sub.status === "canceled"
          ? "cancelada"
          : "vencida";

    await admin.from("suscripciones").upsert(
      {
        user_id: userId,
        plan,
        estado,
        fin,
        stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        stripe_subscription_id: sub.id,
      },
      { onConflict: "stripe_subscription_id" }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await upsertDesdeSuscripcion(sub);

        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;
        if (userId && plan) {
          await admin.from("pagos").insert({
            user_id: userId,
            plan,
            monto_mxn: Math.round((session.amount_total ?? 0) / 100),
            estado: "exitoso",
            stripe_payment_intent_id:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
          });
        }
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await upsertDesdeSuscripcion(sub);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
