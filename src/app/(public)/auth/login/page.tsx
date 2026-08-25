"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Download,
  Globe2,
  Leaf,
  LockKeyhole,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Toggle } from "@/components/ui/Toggle";
import { loginSchema } from "@/schemas/auth";
import {
  getLoginFieldErrors,
  type LoginFieldErrors,
} from "@/features/auth/auth-form-errors.utils";
import { getSafeAuthRedirect } from "@/utils/authRedirects";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg p-4">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
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
    <div className="ss-page ss-auth-page flex text-[color:var(--design-ink)]">
      <section className="ss-card ss-auth-card">
        <div className="ss-auth-header">
          <div className="ss-auth-icon flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--design-footer)]">
            <Leaf
              className="h-8 w-8 text-[color:var(--design-sage)]"
              aria-hidden="true"
            />
          </div>
          <h1 className="ss-display ss-auth-title font-bold">SheSync+</h1>
          <p className="ss-auth-copy">Your secure sanctuary for wellbeing.</p>
        </div>

        <form className="ss-auth-form" onSubmit={handleSubmit}>
          {error && (
            <div
              className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <AuthField
            label="Email Address"
            icon={Mail}
            type="email"
            autoComplete="email"
            required
            value={email}
            error={fieldErrors.email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="hello@example.com"
          />

          <AuthField
            label="Password"
            icon={LockKeyhole}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            error={fieldErrors.password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />

          <div className="flex items-center justify-between gap-4">
            <Toggle
              checked={rememberMe}
              onChange={setRememberMe}
              label="Remember me"
            />

            <Link
              href="/auth/forgot-password"
              className="text-sm font-bold text-[color:var(--design-sage)] transition-colors hover:text-[color:var(--design-brown)]"
            >
              Forgot?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[color:var(--design-sage-soft)] px-8 text-lg font-bold text-[color:var(--design-ink)] shadow-[var(--design-shadow-soft)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
            <ArrowRight className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-5 py-2 sm:py-4">
            <span className="h-px flex-1 bg-[color:var(--design-border)]" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--design-muted)]">
              or continue with
            </span>
            <span className="h-px flex-1 bg-[color:var(--design-border)]" />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-[color:var(--design-border)] bg-white px-4 text-base font-bold text-[color:var(--design-ink)] transition hover:border-[color:var(--design-brown)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)]"
            >
              <Download className="h-5 w-5" aria-hidden="true" />
              Apple
            </button>
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-[color:var(--design-border)] bg-white px-4 text-base font-bold text-[color:var(--design-ink)] transition hover:border-[color:var(--design-brown)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)]"
            >
              <Globe2 className="h-5 w-5" aria-hidden="true" />
              Google
            </button>
          </div>

          <div className="space-y-3 pt-2 text-center sm:pt-4">
            <p className="text-base text-[color:var(--design-muted)]">
              New to SheSync+?{" "}
              <Link
                href="/auth/signup"
                className="font-bold text-[color:var(--design-sage)] transition-colors hover:text-[color:var(--design-brown)]"
              >
                Create an account
              </Link>
            </p>
            <p className="inline-flex items-center justify-center gap-2 text-sm font-bold text-[color:var(--design-sage)]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              End-to-end encrypted
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}

function AuthField({
  label,
  icon: Icon,
  error,
  className,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
  error?: string;
}) {
  const generatedId = React.useId();
  const inputId = id ?? `login-${generatedId}`;

  return (
    <div className="ss-auth-field">
      <label
        htmlFor={inputId}
        className="ss-auth-label block"
      >
        {label}
      </label>
      <div className="ss-auth-field-control">
        <Icon
          className="ss-auth-field-icon"
          aria-hidden="true"
        />
        <input
          id={inputId}
          className={`ss-auth-input ${className ?? ""}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm font-semibold text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
