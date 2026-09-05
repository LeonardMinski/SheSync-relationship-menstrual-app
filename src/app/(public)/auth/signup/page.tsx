"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { OrganicArtwork } from "@/components/ui/OrganicArtwork";
import { signupSchema } from "@/schemas/auth";
import {
  getSignupFieldErrors,
  type SignupFieldErrors,
} from "@/features/auth/auth-form-errors.utils";
import { DEFAULT_AUTH_REDIRECT } from "@/utils/authRedirects";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [loading, setLoading] = useState(false);

  const { signUp, session, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && session && user) {
      router.replace(DEFAULT_AUTH_REDIRECT);
    }
  }, [authLoading, router, session, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const parsed = signupSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const nextFieldErrors = getSignupFieldErrors(parsed);
      setFieldErrors(nextFieldErrors);
      const hasFieldError = Object.values(nextFieldErrors).some(Boolean);
      setError(hasFieldError ? "" : "Check your account details.");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
        trackingEnabled,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.replace(
        result.requiresEmailVerification
          ? "/auth/verify-email"
          : DEFAULT_AUTH_REDIRECT,
      );
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (session && user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-4">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center bg-bg px-4 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
            Your space starts entirely private.
          </h1>
          <p className="mt-4 max-w-sm text-base text-muted-foreground">
            Nothing is shared with a partner unless you choose to share it.
          </p>
          <OrganicArtwork variant="duo" className="mt-10 hidden max-w-xs md:block" />
        </div>

        <Card className="border-border bg-[var(--bg-surface)] px-4 py-8 shadow-lg sm:px-8 sm:py-10">
          <p className="mb-6 font-display text-2xl font-bold text-foreground">Create your space</p>

          <CardContent className="p-0">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div
                  className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-foreground">
                  What brings you to SheSync+?
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label
                    className={`min-h-[44px] cursor-pointer rounded-lg border p-3 text-sm transition-colors ${
                      trackingEnabled
                        ? "border-cta-start bg-cta-start/10 font-semibold text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="account-purpose"
                      className="sr-only"
                      checked={trackingEnabled}
                      onChange={() => setTrackingEnabled(true)}
                    />
                    Track my own cycle
                  </label>
                  <label
                    className={`min-h-[44px] cursor-pointer rounded-lg border p-3 text-sm transition-colors ${
                      !trackingEnabled
                        ? "border-cta-start bg-cta-start/10 font-semibold text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="account-purpose"
                      className="sr-only"
                      checked={!trackingEnabled}
                      onChange={() => setTrackingEnabled(false)}
                    />
                    I&apos;m here to support a partner
                  </label>
                </div>
                {!trackingEnabled && (
                  <p className="text-xs text-muted-foreground">
                    You can connect with a partner and see what they choose to share. You
                    won&apos;t be asked to log your own cycle.
                  </p>
                )}
              </fieldset>

              <div className="space-y-4">
                <Input
                  label="Full Name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  error={fieldErrors.name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Sarah Jones"
                />

                <Input
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  error={fieldErrors.email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                />

                <Input
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  error={fieldErrors.password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  helperText="Must be at least 8 characters long"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  error={fieldErrors.confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-start space-x-3">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 rounded border-border text-cta-start focus:ring-cta-start"
                />
                <label htmlFor="terms" className="text-sm text-foreground">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="font-bold text-cta-start transition-colors hover:text-cta-end"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-bold text-cta-start transition-colors hover:text-cta-end"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                variant="cta"
                size="lg"
                loading={loading}
                className="w-full"
              >
                {loading ? "Creating account..." : "Create Account"}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>

              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="font-bold text-cta-start transition-colors hover:text-cta-end"
                  >
                    Sign in
                  </Link>
                </p>
                <p className="inline-flex items-center justify-center gap-2 text-xs font-bold text-info">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Privacy first
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
