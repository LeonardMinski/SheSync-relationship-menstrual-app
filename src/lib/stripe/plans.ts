import { env } from "@/lib/env";
import type { BillingType, PlanTier } from "@/lib/entitlement";

/**
 * The ONLY place that maps a plan to a Stripe Price ID (and back). The
 * browser sends an internal plan identifier, never a raw Price ID — see
 * POST /api/checkout. The webhook uses the same map to translate a
 * verified Stripe event's price back to an internal plan. Never accept
 * or trust a Price ID handed to us by a client.
 */
export type PurchasablePlan = Exclude<PlanTier, "free">;

export const PURCHASABLE_PLANS: readonly PurchasablePlan[] = ["premium", "vip", "lifetime"];

export function isPurchasablePlan(value: unknown): value is PurchasablePlan {
  return typeof value === "string" && (PURCHASABLE_PLANS as readonly string[]).includes(value);
}

export function billingTypeForPlan(plan: PurchasablePlan): BillingType {
  return plan === "lifetime" ? "lifetime" : "recurring";
}

/** Looks up the configured Stripe Price ID for a plan. Null means the server is missing required configuration — a 500, never a 400. */
export function priceIdForPlan(plan: PurchasablePlan): string | null {
  switch (plan) {
    case "premium":
      return env.STRIPE_PRICE_PREMIUM ?? null;
    case "vip":
      return env.STRIPE_PRICE_VIP ?? null;
    case "lifetime":
      return env.STRIPE_PRICE_LIFETIME ?? null;
  }
}

/** Reverse lookup used by the webhook to map a Stripe event's price back to our internal plan. */
export function planForPriceId(priceId: string | null | undefined): PurchasablePlan | null {
  if (!priceId) return null;
  if (priceId === env.STRIPE_PRICE_PREMIUM) return "premium";
  if (priceId === env.STRIPE_PRICE_VIP) return "vip";
  if (priceId === env.STRIPE_PRICE_LIFETIME) return "lifetime";
  return null;
}
