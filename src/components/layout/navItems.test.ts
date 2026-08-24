import { describe, expect, it } from "vitest";

import { isItemActive, navItems } from "./navItems";

describe("navigation items", () => {
  it("matches exact routes", () => {
    expect(isItemActive("/dashboard", "/dashboard")).toBe(true);
  });

  it("activates settings for nested settings routes", () => {
    expect(isItemActive("/settings/privacy", "/settings")).toBe(true);
  });

  it("does not activate unrelated routes", () => {
    expect(isItemActive("/cycle", "/settings")).toBe(false);
  });

  it("does not treat partner-like prefixes as active partner routes", () => {
    expect(isItemActive("/partner/history", "/partner")).toBe(false);
    expect(isItemActive("/partner-history", "/partner")).toBe(false);
  });

  it("does not mark hash links active when only pathname is available", () => {
    expect(isItemActive("/dashboard", "/dashboard#insights")).toBe(false);
  });

  it("contains expected MVP destinations", () => {
    const hrefs = navItems.map((item) => item.href);

    expect(hrefs).toEqual(
      expect.arrayContaining(["/dashboard", "/cycle", "/partner", "/settings"]),
    );
  });

  it("does not contain duplicate hrefs", () => {
    const hrefs = navItems.map((item) => item.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("marks parked feature links consistently", () => {
    const parkedHrefs = [
      "/dashboard#insights",
      "/coach",
      "/ai-coach",
      "/fantasy",
      "/intimacy",
      "/partner/intimacy",
      "/pricing",
    ];

    for (const href of parkedHrefs) {
      expect(navItems.find((item) => item.href === href)?.status).toBe("soon");
    }
  });
});
