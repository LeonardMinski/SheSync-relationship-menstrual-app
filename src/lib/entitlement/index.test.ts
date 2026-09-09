import { describe, expect, it } from "vitest";

import { computeEntitlement, type SubscriptionRow } from "./index";

const NOW = new Date("2026-06-15T00:00:00.000Z");

function row(overrides: Partial<SubscriptionRow>): SubscriptionRow {
  return {
    plan: "premium",
    billing_type: "recurring",
    status: "active",
    current_period_end: null,
    cancel_at_period_end: false,
    grace_period_ends_at: null,
    ...overrides,
  };
}

describe("computeEntitlement", () => {
  it("FREE: no subscription row at all → not entitled, no Vault", () => {
    const entitlement = computeEntitlement(null, NOW);
    expect(entitlement.tier).toBe("free");
    expect(entitlement.entitled).toBe(false);
    expect(entitlement.hasVaultAccess).toBe(false);
  });

  it("PREMIUM active → entitled, Vault allowed", () => {
    const entitlement = computeEntitlement(row({ plan: "premium", status: "active" }), NOW);
    expect(entitlement.entitled).toBe(true);
    expect(entitlement.hasVaultAccess).toBe(true);
  });

  it("VIP active → entitled, Vault allowed", () => {
    const entitlement = computeEntitlement(row({ plan: "vip", status: "active" }), NOW);
    expect(entitlement.entitled).toBe(true);
    expect(entitlement.hasVaultAccess).toBe(true);
  });

  it("LIFETIME → entitled without a recurring subscription", () => {
    const entitlement = computeEntitlement(
      row({ plan: "lifetime", billing_type: "lifetime", status: "active" }),
      NOW,
    );
    expect(entitlement.entitled).toBe(true);
    expect(entitlement.hasVaultAccess).toBe(true);
  });

  it("a lifetime row that somehow isn't 'active' is not entitled (defensive — should never happen)", () => {
    const entitlement = computeEntitlement(
      row({ plan: "lifetime", billing_type: "lifetime", status: "canceled" }),
      NOW,
    );
    expect(entitlement.entitled).toBe(false);
  });

  it("TRIALING → entitled", () => {
    const entitlement = computeEntitlement(row({ status: "trialing" }), NOW);
    expect(entitlement.entitled).toBe(true);
  });

  it("PAST_DUE within the 7-day grace period → entitled", () => {
    const entitlement = computeEntitlement(
      row({ status: "past_due", grace_period_ends_at: "2026-06-20T00:00:00.000Z" }),
      NOW,
    );
    expect(entitlement.entitled).toBe(true);
    expect(entitlement.gracePeriodEndsAt).toBe("2026-06-20T00:00:00.000Z");
  });

  it("PAST_DUE after the grace period has elapsed → not entitled", () => {
    const entitlement = computeEntitlement(
      row({ status: "past_due", grace_period_ends_at: "2026-06-10T00:00:00.000Z" }),
      NOW,
    );
    expect(entitlement.entitled).toBe(false);
  });

  it("PAST_DUE with no grace_period_ends_at recorded → not entitled (fail closed)", () => {
    const entitlement = computeEntitlement(
      row({ status: "past_due", grace_period_ends_at: null }),
      NOW,
    );
    expect(entitlement.entitled).toBe(false);
  });

  it("PAUSED → not entitled", () => {
    expect(computeEntitlement(row({ status: "paused" }), NOW).entitled).toBe(false);
  });

  it("UNPAID → not entitled", () => {
    expect(computeEntitlement(row({ status: "unpaid" }), NOW).entitled).toBe(false);
  });

  it("INCOMPLETE → not entitled", () => {
    expect(computeEntitlement(row({ status: "incomplete" }), NOW).entitled).toBe(false);
  });

  it("INCOMPLETE_EXPIRED → not entitled", () => {
    expect(computeEntitlement(row({ status: "incomplete_expired" }), NOW).entitled).toBe(false);
  });

  it("cancel_at_period_end=true but status still 'active' and before current_period_end → entitled", () => {
    const entitlement = computeEntitlement(
      row({
        status: "active",
        cancel_at_period_end: true,
        current_period_end: "2026-07-01T00:00:00.000Z",
      }),
      NOW,
    );
    expect(entitlement.entitled).toBe(true);
  });

  it("CANCELED (subscription has actually ended) → not entitled", () => {
    expect(computeEntitlement(row({ status: "canceled" }), NOW).entitled).toBe(false);
  });
});
