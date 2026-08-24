import { describe, expect, it } from "vitest";

import { loginSchema, signupSchema } from "@/schemas/auth";

import {
  getLoginFieldErrors,
  getSignupFieldErrors,
} from "./auth-form-errors.utils";

describe("auth form error utilities", () => {
  it("maps login validation errors by field", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "",
      rememberMe: false,
    });

    expect(getLoginFieldErrors(result)).toMatchObject({
      email: expect.any(String),
      password: expect.any(String),
    });
  });

  it("returns no login errors for valid values", () => {
    const result = loginSchema.safeParse({
      email: "hello@example.com",
      password: "password123",
      rememberMe: false,
    });

    expect(getLoginFieldErrors(result)).toEqual({});
  });

  it("maps signup validation errors by field", () => {
    const result = signupSchema.safeParse({
      name: "",
      email: "not-an-email",
      password: "short",
      confirmPassword: "different",
    });

    expect(getSignupFieldErrors(result)).toMatchObject({
      name: expect.any(String),
      email: expect.any(String),
      password: expect.any(String),
      confirmPassword: expect.any(String),
    });
  });
});
