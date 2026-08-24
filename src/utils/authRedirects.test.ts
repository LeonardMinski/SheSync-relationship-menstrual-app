import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUTH_REDIRECT,
  getLoginRedirectPath,
  getSafeAuthRedirect,
} from "@/utils/authRedirects";

describe("auth redirects", () => {
  it("keeps safe internal next paths", () => {
    expect(getSafeAuthRedirect("/fantasy")).toBe("/fantasy");
    expect(getSafeAuthRedirect("/cycle?day=today#log")).toBe(
      "/cycle?day=today#log",
    );
  });

  it("rejects unsafe external next paths", () => {
    expect(getSafeAuthRedirect("https://example.com/fantasy")).toBe(
      DEFAULT_AUTH_REDIRECT,
    );
    expect(getSafeAuthRedirect("//example.com/fantasy")).toBe(
      DEFAULT_AUTH_REDIRECT,
    );
  });

  it("rejects public auth paths as next targets", () => {
    expect(getSafeAuthRedirect("/auth/login")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(getSafeAuthRedirect("/auth/signup")).toBe(DEFAULT_AUTH_REDIRECT);
  });

  it("builds protected-route login redirects", () => {
    expect(getLoginRedirectPath("/fantasy")).toBe(
      "/auth/login?next=%2Ffantasy",
    );
  });
});
