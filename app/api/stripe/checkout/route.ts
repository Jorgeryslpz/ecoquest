import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getStripe, PLANES, type PlanId } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "No hay sesión iniciada." }, { status: 401 });
  }

  const { plan } = await request.json().catch(() => ({}));
  if (!plan || !(plan in PLANES)) {
    return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
  }

  const planInfo = PLANES[plan as PlanId];
  const priceId = process.env[planInfo.priceEnv];
  if (!priceId) {
    return NextResponse.json(
      { error: `Falta configurar ${planInfo.priceEnv} en .env.local.` },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Reusar el stripe_customer_id si ya existe uno de un intento anterior.
  const admin = createServiceRoleClient();
  const { data: previa } = await admin
    .from("suscripciones")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { user_id: user.id, plan },
    },
    metadata: { user_id: user.id, plan },
    customer: previa?.stripe_customer_id ?? undefined,
    customer_email: previa?.stripe_customer_id ? undefined : user.email,
    success_url: `${siteUrl}/inicio?pago=exitoso`,
    cancel_url: `${siteUrl}/pago`,
  });

  return NextResponse.json({ url: session.url });
}
