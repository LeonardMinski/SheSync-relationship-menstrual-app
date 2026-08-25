"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LockKeyhole,
  Mail,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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
    <div className="ss-page ss-auth-page flex text-[color:var(--design-ink)]">
      <section className="ss-card ss-auth-card ss-auth-card--wide">
        <div className="ss-auth-header">
          <h1 className="ss-display ss-auth-title font-bold">
            SheSync+
          </h1>
          <p className="ss-auth-copy">
            Begin your intimate wellness journey in a safe, sophisticated space.
          </p>
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

          <SignupField
            label="Full Name"
            icon={UserRound}
            type="text"
            autoComplete="name"
            required
            value={name}
            error={fieldErrors.name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jane Doe"
          />

          <SignupField
            label="Email Address"
            icon={Mail}
            type="email"
            autoComplete="email"
            required
            value={email}
            error={fieldErrors.email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="jane@example.com"
          />

          <SignupField
            label="Password"
            icon={LockKeyhole}
            type="password"
            autoComplete="new-password"
            required
            value={password}
            error={fieldErrors.password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />

          <SignupField
            label="Confirm Password"
            icon={LockKeyhole}
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            error={fieldErrors.confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="••••••••"
          />

          <div className="flex items-start gap-4">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="mt-1 h-6 w-6 rounded-md border border-[color:var(--design-border)] text-[color:var(--design-peach)] focus:ring-[color:var(--design-peach)]"
            />
            <label
              htmlFor="terms"
              className="text-base leading-relaxed text-[color:var(--design-muted)]"
            >
              I agree to the{" "}
              <Link
                href="/terms"
                className="underline decoration-[color:var(--design-brown)] underline-offset-4 transition-colors hover:text-[color:var(--design-brown)]"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline decoration-[color:var(--design-brown)] underline-offset-4 transition-colors hover:text-[color:var(--design-brown)]"
              >
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="min-h-14 w-full rounded-full bg-[color:var(--design-peach)] px-8 text-lg font-bold text-[color:var(--design-ink)] shadow-[var(--design-shadow-soft)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="pt-2 text-center text-base text-[color:var(--design-muted)] sm:pt-4">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-bold underline decoration-[color:var(--design-brown)] underline-offset-4 transition-colors hover:text-[color:var(--design-brown)]"
            >
              Log In
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}

function SignupField({
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
  const inputId = id ?? `signup-${generatedId}`;

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
          className={`ss-auth-input border-[color:var(--design-peach)] ${className ?? ""}`}
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
