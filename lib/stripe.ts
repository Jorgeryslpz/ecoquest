import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY no está configurada en .env.local.");
  }
  return new Stripe(key);
}

export const PLANES = {
  "1_mes": { priceEnv: "STRIPE_PRICE_1_MES", nombre: "1 mes", precioMxn: 149 },
  "6_meses": { priceEnv: "STRIPE_PRICE_6_MESES", nombre: "6 meses", precioMxn: 549 },
  "1_anio": { priceEnv: "STRIPE_PRICE_1_ANIO", nombre: "1 año", precioMxn: 949 },
} as const;

export type PlanId = keyof typeof PLANES;
