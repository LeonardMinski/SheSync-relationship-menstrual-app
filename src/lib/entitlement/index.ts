import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The single canonical source of "is this account entitled to Premium
 * features" for the whole app. public.subscriptions is the only table
 * read here — public.users.subscription_tier is a display-only cache
 * (see src/components/layout/Sidebar.tsx) written by the webhook and
 * never consulted for authorization. Every route that gates a Premium
 * feature must go through getEntitlement()/requireVaultAccess() rather
 * than checking Stripe status fields itself.
 */

export type PlanTier = "free" | "premium" | "vip" | "lifetime";
export type BillingType = "recurring" | "lifetime";

export type BillingStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "paused"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "canceled"
  /** No subscriptions row at all — a free account. */
  | "none";

export interface Entitlement {
  tier: PlanTier;
  billingStatus: BillingStatus;
  entitled: boolean;
  hasVaultAccess: boolean;
  currentPeriodEnd: string | null;
  gracePeriodEndsAt: string | null;
}

export interface SubscriptionRow {
  plan: Exclude<PlanTier, "free">;
  billing_type: BillingType;
  status: Exclude<BillingStatus, "none">;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  grace_period_ends_at: string | null;
}

const FREE_ENTITLEMENT: Entitlement = {
  tier: "free",
  billingStatus: "none",
  entitled: false,
  hasVaultAccess: false,
  currentPeriodEnd: null,
  gracePeriodEndsAt: null,
};

/** Grace period granted from the first transition into past_due (see PHASE 5 product decision). */
export const PAST_DUE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Pure decision function — no I/O — so every state in the entitlement
 * matrix can be unit-tested directly without mocking Supabase or Stripe.
 */
export function computeEntitlement(
  row: SubscriptionRow | null,
  now: Date = new Date(),
): Entitlement {
  if (!row) return FREE_ENTITLEMENT;

  const entitled = isEntitled(row, now);

  return {
    tier: row.plan,
    billingStatus: row.status,
    entitled,
    // Every paid tier gets Vault today; kept as its own field (rather
    // than reusing `entitled` at call sites) so a future tier-specific
    // feature doesn't have to touch every caller.
    hasVaultAccess: entitled,
    currentPeriodEnd: row.current_period_end,
    gracePeriodEndsAt: row.grace_period_ends_at,
  };
}

function isEntitled(row: SubscriptionRow, now: Date): boolean {
  if (row.billing_type === "lifetime") {
    return row.status === "active";
  }

  switch (row.status) {
    case "active":
    case "trialing":
      // cancel_at_period_end does not revoke access by itself — Stripe
      // keeps status 'active' until the period actually ends and only
      // then fires the event that flips status to 'canceled'.
      return true;
    case "past_due":
      return (
        row.grace_period_ends_at !== null &&
        now.getTime() < new Date(row.grace_period_ends_at).getTime()
      );
    case "paused":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
    case "canceled":
      return false;
    default:
      return false;
  }
}

/**
 * Reads the caller's own subscription row (RLS restricts this to
 * `auth.uid() = user_id`, so the regular per-request client from
 * authenticateRequest is sufficient — no service-role client needed for
 * reads) and returns their entitlement. Fails CLOSED on a DB error: an
 * unreadable subscription row must never be treated as "entitled".
 */
export async function getEntitlement(
  supabase: SupabaseClient,
  userId: string,
): Promise<Entitlement> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "plan, billing_type, status, current_period_end, cancel_at_period_end, grace_period_ends_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[entitlement] failed to load subscription row", error);
    return FREE_ENTITLEMENT;
  }

  return computeEntitlement(data as SubscriptionRow | null);
}
