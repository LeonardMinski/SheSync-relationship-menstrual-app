import { describe, expect, it } from "vitest";

import {
  canUseCoach,
  canUseCycle,
  canUseTracking,
  canUseVault,
  isTrackedOnlyRoute,
  isTrackingStatusResolved,
  isWaitingForTrackingStatus,
  shouldBlockTrackedRoute,
} from "./capabilities";

describe("isTrackingStatusResolved", () => {
  it("is false for a null user", () => {
    expect(isTrackingStatusResolved(null)).toBe(false);
  });

  it("is false while the real profile hasn't loaded yet", () => {
    expect(isTrackingStatusResolved({ trackingEnabled: undefined })).toBe(false);
  });

  it("is true once tracking is known enabled", () => {
    expect(isTrackingStatusResolved({ trackingEnabled: true })).toBe(true);
  });

  it("is true once tracking is known disabled", () => {
    expect(isTrackingStatusResolved({ trackingEnabled: false })).toBe(true);
  });
});

describe("canUseTracking / canUseCycle / canUseCoach / canUseVault", () => {
  it("is false while unresolved (never optimistically grants access)", () => {
    expect(canUseTracking({ trackingEnabled: undefined })).toBe(false);
    expect(canUseCycle({ trackingEnabled: undefined })).toBe(false);
    expect(canUseCoach({ trackingEnabled: undefined })).toBe(false);
    expect(canUseVault({ trackingEnabled: undefined })).toBe(false);
  });

  it("is false for a null user", () => {
    expect(canUseTracking(null)).toBe(false);
  });

  it("is true once tracking is known enabled", () => {
    expect(canUseTracking({ trackingEnabled: true })).toBe(true);
  });

  it("is false once tracking is known disabled (partner-only account)", () => {
    expect(canUseTracking({ trackingEnabled: false })).toBe(false);
  });
});

describe("isTrackedOnlyRoute", () => {
  it("matches the exact tracked-only routes", () => {
    expect(isTrackedOnlyRoute("/cycle")).toBe(true);
    expect(isTrackedOnlyRoute("/coach")).toBe(true);
    expect(isTrackedOnlyRoute("/vault")).toBe(true);
  });

  it("matches nested routes under a tracked-only destination", () => {
    expect(isTrackedOnlyRoute("/cycle/patterns")).toBe(true);
    expect(isTrackedOnlyRoute("/vault/new")).toBe(true);
  });

  it("does not match unrelated routes", () => {
    expect(isTrackedOnlyRoute("/dashboard")).toBe(false);
    expect(isTrackedOnlyRoute("/connect")).toBe(false);
    expect(isTrackedOnlyRoute("/partner")).toBe(false);
    expect(isTrackedOnlyRoute("/settings")).toBe(false);
  });

  it("does not treat sibling-prefixed routes as matching", () => {
    expect(isTrackedOnlyRoute("/coaching")).toBe(false);
    expect(isTrackedOnlyRoute("/vault-items")).toBe(false);
  });
});

describe("isWaitingForTrackingStatus", () => {
  it("waits while status is unresolved and there is no known profile error", () => {
    expect(isWaitingForTrackingStatus({ trackingEnabled: undefined }, false)).toBe(true);
  });

  it("stops waiting once the profile load is known to have failed", () => {
    expect(isWaitingForTrackingStatus({ trackingEnabled: undefined }, true)).toBe(false);
  });

  it("does not wait once status is already resolved", () => {
    expect(isWaitingForTrackingStatus({ trackingEnabled: true }, false)).toBe(false);
    expect(isWaitingForTrackingStatus({ trackingEnabled: false }, false)).toBe(false);
  });
});

describe("shouldBlockTrackedRoute", () => {
  it("does not block a non-tracked-only route regardless of capability", () => {
    expect(shouldBlockTrackedRoute({ trackingEnabled: false }, "/dashboard")).toBe(false);
    expect(shouldBlockTrackedRoute({ trackingEnabled: false }, "/connect")).toBe(false);
    expect(shouldBlockTrackedRoute({ trackingEnabled: false }, "/partner")).toBe(false);
  });

  it("blocks a tracked-only route for a known partner-only account", () => {
    expect(shouldBlockTrackedRoute({ trackingEnabled: false }, "/cycle")).toBe(true);
    expect(shouldBlockTrackedRoute({ trackingEnabled: false }, "/coach")).toBe(true);
    expect(shouldBlockTrackedRoute({ trackingEnabled: false }, "/vault")).toBe(true);
    expect(shouldBlockTrackedRoute({ trackingEnabled: false }, "/vault/new")).toBe(true);
  });

  it("does not block a tracked-only route for a tracking-enabled account", () => {
    expect(shouldBlockTrackedRoute({ trackingEnabled: true }, "/cycle")).toBe(false);
  });

  it("fails open (does not block) while status is unresolved, to avoid flash-locking a real tracking user", () => {
    expect(shouldBlockTrackedRoute({ trackingEnabled: undefined }, "/cycle")).toBe(false);
  });

  it("fails open for a null user", () => {
    expect(shouldBlockTrackedRoute(null, "/cycle")).toBe(false);
  });
});
