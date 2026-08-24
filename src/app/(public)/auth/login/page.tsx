"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Toggle } from "@/components/ui/Toggle";
import { loginSchema } from "@/schemas/auth";
import {
  getLoginFieldErrors,
  type LoginFieldErrors,
} from "@/features/auth/auth-form-errors.utils";
import { getSafeAuthRedirect } from "@/utils/authRedirects";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { signIn, session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = useMemo(
    () => getSafeAuthRedirect(searchParams.get("next")),
    [searchParams],
  );

  useEffect(() => {
    router.prefetch(redirectPath);
  }, [redirectPath, router]);

  useEffect(() => {
    if (!authLoading && session && user) {
      router.replace(redirectPath);
    }
  }, [authLoading, redirectPath, router, session, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const parsed = loginSchema.safeParse({
      email,
      password,
      rememberMe,
    });

    if (!parsed.success) {
      const nextFieldErrors = getLoginFieldErrors(parsed);
      setFieldErrors(nextFieldErrors);
      setError(
        nextFieldErrors.email ||
          nextFieldErrors.password ||
          "Check your sign-in details.",
      );
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(parsed.data);

      if (result.success) {
        router.replace(redirectPath);
        return;
      }

      setError(result.error);
    } catch (err) {
      console.error("Unexpected login error:", err);
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
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(120deg,rgba(184,211,189,0.12),transparent_42%,rgba(205,182,255,0.08))]" />

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
              Your secure sanctuary for wellbeing.
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
                  autoComplete="current-password"
                  required
                  value={password}
                  error={fieldErrors.password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <Toggle
                  checked={rememberMe}
                  onChange={setRememberMe}
                  label="Remember me"
                />

                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-bold text-cta-start transition-colors hover:text-cta-end"
                >
                  Forgot?
                </Link>
              </div>

              <Button
                type="submit"
                variant="cta"
                size="lg"
                loading={loading}
                className="w-full"
              >
                {loading ? "Signing in..." : "Sign In"}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>

              <div className="flex items-center gap-4 py-4">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                  or continue with
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="min-h-12 rounded-lg border border-border bg-bg-elevated px-4 text-sm font-bold text-foreground hover:border-cta-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                >
                  Apple
                </button>
                <button
                  type="button"
                  className="min-h-12 rounded-lg border border-border bg-bg-elevated px-4 text-sm font-bold text-foreground hover:border-cta-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                >
                  Google
                </button>
              </div>

              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/auth/signup"
                    className="font-bold text-cta-start transition-colors hover:text-cta-end"
                  >
                    Create an account
                  </Link>
                </p>
                <p className="inline-flex items-center justify-center gap-2 text-xs font-bold text-info">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  End-to-end encrypted
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
