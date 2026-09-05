export interface CapabilityUser {
  /**
   * `undefined` = not yet loaded from the real profile (the brief window
   * where AuthContext only has the session-derived fallback user).
   * `true`/`false` = loaded, and tracking capability is known.
   *
   * Mirrors onboardingCompletedAt's tri-state pattern in onboarding.utils —
   * every capability decision below must wait for
   * `isTrackingStatusResolved` before acting, or a real tracking-enabled
   * user can be flash-redirected out of /cycle, /coach, /vault while their
   * profile is still loading.
   */
  trackingEnabled?: boolean;
}

export function isTrackingStatusResolved(
  user: CapabilityUser | null | undefined,
): boolean {
  return Boolean(user) && user!.trackingEnabled !== undefined;
}

/**
 * Whether a capability guard should keep showing a loading state rather
 * than deciding anything yet. Mirrors isWaitingForOnboardingStatus: a
 * failed profile load must never be read as "tracking disabled" (that
 * would wrongly lock a real tracking-enabled user out of /cycle on a
 * transient error), and it must not leave the guard waiting forever
 * either. Once `profileError` is true, callers stop waiting and fail
 * open — tracking_enabled only gates UX routing, not data access; RLS and
 * partner_links remain the real authority over cross-user data, so
 * failing open here cannot leak anyone else's data.
 */
export function isWaitingForTrackingStatus(
  user: CapabilityUser | null | undefined,
  profileError: boolean,
): boolean {
  return !isTrackingStatusResolved(user) && !profileError;
}

/** True only once we know, for certain, that this account cannot track. */
function isKnownNotTrackingEnabled(
  user: CapabilityUser | null | undefined,
): boolean {
  return isTrackingStatusResolved(user) && user!.trackingEnabled === false;
}

/** Can this account use self-tracking features at all? */
export function canUseTracking(user: CapabilityUser | null | undefined): boolean {
  return isTrackingStatusResolved(user) && user!.trackingEnabled === true;
}

// Cycle logging, Coach, and Vault creation are all gated on the same single
// tracking capability today. Kept as distinct named exports (rather than one
// generic canUseTracking call at every call site) so each can diverge
// independently later without renaming callers.
export const canUseCycle = canUseTracking;
export const canUseCoach = canUseTracking;
export const canUseVault = canUseTracking;

const TRACKED_ONLY_ROUTE_PREFIXES = ["/cycle", "/coach", "/vault"];

/** Whether `pathname` is one of the tracked-only routes gated by capability. */
export function isTrackedOnlyRoute(pathname: string): boolean {
  return TRACKED_ONLY_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Whether the app layout should redirect a request for a tracked-only route
 * away. Fails open (no redirect) while status is unresolved or on a known
 * profile error — see isWaitingForTrackingStatus for why.
 */
export function shouldBlockTrackedRoute(
  user: CapabilityUser | null | undefined,
  pathname: string,
): boolean {
  if (!isTrackedOnlyRoute(pathname)) return false;
  return isKnownNotTrackingEnabled(user);
}
