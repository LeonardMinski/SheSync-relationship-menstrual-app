"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Leaf, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { signupSchema, type SignupFormValues } from "@/schemas/auth";
import { DEFAULT_AUTH_REDIRECT } from "@/utils/authRedirects";

type SignupFieldErrors = Partial<Record<keyof SignupFormValues, string>>;

const getFieldErrors = (result: ReturnType<typeof signupSchema.safeParse>) => {
  if (result.success) return {};

  const flattened = result.error.flatten().fieldErrors;

  return {
    name: flattened.name?.[0],
    email: flattened.email?.[0],
    password: flattened.password?.[0],
    confirmPassword: flattened.confirmPassword?.[0],
  } satisfies SignupFieldErrors;
};

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      const nextFieldErrors = getFieldErrors(parsed);
      setFieldErrors(nextFieldErrors);
      setError(
        nextFieldErrors.confirmPassword ||
          nextFieldErrors.password ||
          nextFieldErrors.email ||
          nextFieldErrors.name ||
          "Check your account details.",
      );
      return;
    }

    setLoading(true);

    try {
      const result = await signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
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
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10 text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(120deg,rgba(184,211,189,0.12),transparent_42%,rgba(239,168,142,0.08))]" />

      <div className="relative w-full max-w-lg">
        <Card className="border-border bg-[var(--bg-surface)] px-4 py-8 shadow-lg sm:px-10 sm:py-12">
          <CardHeader className="pb-8 text-center">
            <div className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-bg">
              <Leaf className="h-7 w-7 text-cta-start" aria-hidden="true" />
            </div>
            <CardTitle className="text-5xl font-black tracking-tight text-foreground">
              SheSync+
            </CardTitle>
            <CardDescription className="mx-auto mt-4 max-w-xs text-lg leading-relaxed text-muted-foreground">
              Your private sanctuary for health and cycle tracking.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div
                  className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

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
