import { describe, expect, it } from "vitest";
import { validateEmail } from "@/utils/validation";

describe("validateEmail", () => {
  it("accepts ordinary email addresses", () => {
    expect(validateEmail("person@example.com")).toBe(true);
    expect(validateEmail("first.last+tag@example.co.uk")).toBe(true);
  });

  it("rejects malformed email addresses", () => {
    expect(validateEmail("not-an-email")).toBe(false);
    expect(validateEmail("person@example")).toBe(false);
    expect(validateEmail("person @example.com")).toBe(false);
  });
});
