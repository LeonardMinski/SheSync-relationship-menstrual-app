export const DEFAULT_AUTH_REDIRECT = "/dashboard";

const AUTH_ROUTE_PREFIX = "/auth";

export function getSafeAuthRedirect(
  nextPath: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT,
): string {
  if (!nextPath) return fallback;

  let decodedPath = nextPath.trim();

  try {
    decodedPath = decodeURIComponent(decodedPath);
  } catch {
    return fallback;
  }

  if (!decodedPath.startsWith("/") || decodedPath.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(decodedPath, "https://shesync.local");

    if (parsed.origin !== "https://shesync.local") {
      return fallback;
    }

    const safePath = `${parsed.pathname}${parsed.search}${parsed.hash}`;

    if (safePath === "/" || safePath.startsWith(AUTH_ROUTE_PREFIX)) {
      return fallback;
    }

    return safePath;
  } catch {
    return fallback;
  }
}

export function getLoginRedirectPath(pathname: string | null | undefined) {
  const nextPath = getSafeAuthRedirect(pathname, DEFAULT_AUTH_REDIRECT);
  return `/auth/login?next=${encodeURIComponent(nextPath)}`;
}
