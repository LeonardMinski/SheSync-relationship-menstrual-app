export interface OnboardingStatusUser {
  onboardingCompletedAt?: string | null;
}

/**
 * `onboardingCompletedAt` has three meaningful states:
 *  - undefined -> not yet loaded from the real profile (the brief window
 *    where AuthContext only has the session-derived fallback user).
 *  - null      -> loaded, and onboarding is known incomplete.
 *  - string    -> loaded, and onboarding is known complete.
 *
 * Every navigation decision below must wait for `isOnboardingStatusResolved`
 * before acting, or a real user can be flash-redirected into /onboarding
 * while their profile is still loading.
 */
export function isOnboardingStatusResolved(
  user: OnboardingStatusUser | null | undefined,
): boolean {
  return Boolean(user) && user!.onboardingCompletedAt !== undefined;
}

export function shouldRedirectToOnboarding(
  user: OnboardingStatusUser | null | undefined,
): boolean {
  if (!isOnboardingStatusResolved(user)) return false;
  return user!.onboardingCompletedAt === null;
}

export function shouldRedirectAwayFromOnboarding(
  user: OnboardingStatusUser | null | undefined,
): boolean {
  if (!isOnboardingStatusResolved(user)) return false;
  return user!.onboardingCompletedAt !== null;
}

/**
 * Whether a guard should keep showing a loading state rather than deciding
 * anything yet. This is true only while the real profile genuinely hasn't
 * come back AND there's no known reason it won't (`profileError`).
 *
 * A failed profile load must never be read as "onboarding incomplete" (that
 * would wrongly send a real user into the onboarding wizard on a transient
 * error), and it must not leave the guard waiting forever either (the
 * status will never resolve once the fetch has already failed). So once
 * `profileError` is true, callers should stop waiting and fail open —
 * render normally rather than making an onboarding-based decision.
 */
export function isWaitingForOnboardingStatus(
  user: OnboardingStatusUser | null | undefined,
  profileError: boolean,
): boolean {
  return !isOnboardingStatusResolved(user) && !profileError;
}
