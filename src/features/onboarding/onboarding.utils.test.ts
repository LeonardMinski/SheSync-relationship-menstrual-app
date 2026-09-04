import { describe, expect, it } from "vitest";

import {
  isOnboardingStatusResolved,
  isWaitingForOnboardingStatus,
  shouldRedirectAwayFromOnboarding,
  shouldRedirectToOnboarding,
} from "./onboarding.utils";

describe("isOnboardingStatusResolved", () => {
  it("is false for a null user", () => {
    expect(isOnboardingStatusResolved(null)).toBe(false);
  });

  it("is false while the real profile hasn't loaded yet", () => {
    expect(isOnboardingStatusResolved({ onboardingCompletedAt: undefined })).toBe(false);
  });

  it("is true once the profile has a known incomplete state", () => {
    expect(isOnboardingStatusResolved({ onboardingCompletedAt: null })).toBe(true);
  });

  it("is true once the profile has a known completed timestamp", () => {
    expect(
      isOnboardingStatusResolved({ onboardingCompletedAt: "2026-09-01T00:00:00.000Z" }),
    ).toBe(true);
  });
});

describe("shouldRedirectToOnboarding", () => {
  it("does not redirect while status is unresolved (prevents flash-redirects)", () => {
    expect(shouldRedirectToOnboarding({ onboardingCompletedAt: undefined })).toBe(false);
  });

  it("redirects an authenticated user with a known-incomplete profile", () => {
    expect(shouldRedirectToOnboarding({ onboardingCompletedAt: null })).toBe(true);
  });

  it("does not redirect a user who has already completed onboarding", () => {
    expect(
      shouldRedirectToOnboarding({ onboardingCompletedAt: "2026-09-01T00:00:00.000Z" }),
    ).toBe(false);
  });

  it("does not redirect when there is no user", () => {
    expect(shouldRedirectToOnboarding(null)).toBe(false);
  });
});

describe("shouldRedirectAwayFromOnboarding", () => {
  it("does not redirect while status is unresolved", () => {
    expect(shouldRedirectAwayFromOnboarding({ onboardingCompletedAt: undefined })).toBe(
      false,
    );
  });

  it("does not redirect a user who still needs onboarding", () => {
    expect(shouldRedirectAwayFromOnboarding({ onboardingCompletedAt: null })).toBe(false);
  });

  it("redirects a user who has already completed onboarding", () => {
    expect(
      shouldRedirectAwayFromOnboarding({ onboardingCompletedAt: "2026-09-01T00:00:00.000Z" }),
    ).toBe(true);
  });

  it("does not redirect when there is no user", () => {
    expect(shouldRedirectAwayFromOnboarding(null)).toBe(false);
  });
});

describe("isWaitingForOnboardingStatus", () => {
  it("waits while status is unresolved and there is no known profile error", () => {
    expect(isWaitingForOnboardingStatus({ onboardingCompletedAt: undefined }, false)).toBe(
      true,
    );
  });

  it("stops waiting once the profile load is known to have failed, without deciding onboarding is incomplete", () => {
    expect(isWaitingForOnboardingStatus({ onboardingCompletedAt: undefined }, true)).toBe(
      false,
    );
  });

  it("does not wait once status is already resolved", () => {
    expect(isWaitingForOnboardingStatus({ onboardingCompletedAt: null }, false)).toBe(false);
    expect(
      isWaitingForOnboardingStatus(
        { onboardingCompletedAt: "2026-09-01T00:00:00.000Z" },
        false,
      ),
    ).toBe(false);
  });
});
