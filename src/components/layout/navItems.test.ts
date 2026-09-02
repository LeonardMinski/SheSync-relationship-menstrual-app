import { describe, expect, it } from "vitest";

import { isItemActive, navItems } from "./navItems";

describe("navigation items", () => {
  it("matches exact routes", () => {
    expect(isItemActive("/dashboard", "/dashboard")).toBe(true);
  });

  it("activates nested routes under a primary destination", () => {
    expect(isItemActive("/connect/boundaries", "/connect")).toBe(true);
  });

  it("does not activate unrelated routes", () => {
    expect(isItemActive("/cycle", "/connect")).toBe(false);
  });

  it("does not treat sibling-prefixed routes as active", () => {
    expect(isItemActive("/connect-history", "/connect")).toBe(false);
  });

  it("does not mark hash links active when only pathname is available", () => {
    expect(isItemActive("/dashboard", "/dashboard#insights")).toBe(false);
  });

  it("contains exactly the five primary destinations", () => {
    const hrefs = navItems.map((item) => item.href);

    expect(hrefs).toEqual(["/dashboard", "/cycle", "/coach", "/connect", "/vault"]);
  });

  it("does not contain duplicate hrefs", () => {
    const hrefs = navItems.map((item) => item.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("does not expose settings in primary nav (accessed via avatar menu)", () => {
    const hrefs = navItems.map((item) => item.href);

    expect(hrefs).not.toContain("/settings");
  });

  it("marks no item as 'soon'", () => {
    expect(navItems.every((item) => item.status === undefined)).toBe(true);
  });
});
