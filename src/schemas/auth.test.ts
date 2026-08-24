import { describe, expect, it } from "vitest";
import {
  loginSchema,
  passwordUpdateSchema,
  signupSchema,
} from "@/schemas/auth";

describe("auth schemas", () => {
  it("accepts a valid login email and existing password", () => {
    const result = loginSchema.safeParse({
      email: "person@example.com",
      password: "short",
    });

    expect(result.success).toBe(true);
  });

  it("rejects login without a password", () => {
    const result = loginSchema.safeParse({
      email: "person@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects weak signup passwords", () => {
    const result = signupSchema.safeParse({
      name: "Person",
      email: "person@example.com",
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("Expected weak password to fail");
    expect(result.error.flatten().fieldErrors.password?.[0]).toBe(
      "Password must be at least 8 characters.",
    );
  });

  it("attaches signup password mismatch errors to confirmPassword", () => {
    const result = signupSchema.safeParse({
      name: "Person",
      email: "person@example.com",
      password: "long-enough",
      confirmPassword: "different",
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("Expected password mismatch to fail");
    expect(result.error.flatten().fieldErrors.confirmPassword?.[0]).toBe(
      "Passwords do not match.",
    );
  });

  it("attaches reset password mismatch errors to confirmPassword", () => {
    const result = passwordUpdateSchema.safeParse({
      password: "long-enough",
      confirmPassword: "different",
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("Expected password mismatch to fail");
    expect(result.error.flatten().fieldErrors.confirmPassword?.[0]).toBe(
      "Passwords do not match.",
    );
  });
});
