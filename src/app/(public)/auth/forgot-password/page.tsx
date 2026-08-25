"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, KeyRound, Mail } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const submittedEmail = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    setEmail(submittedEmail);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/reset-password`
        : undefined;

    try {
      const result = await requestPasswordReset(submittedEmail, redirectTo);
      if (!result.success) {
        setError(result.error || "Unable to send reset email");
        return;
      }

      setSuccess(
        "If an account exists for this email, a reset link has been sent.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ss-page flex min-h-screen items-center justify-center px-5 py-16 text-[color:var(--design-ink)]">
      <section className="ss-card w-full max-w-xl px-6 py-12 sm:px-14 sm:py-16">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--design-footer)]">
            <KeyRound
              className="h-10 w-10 text-[color:var(--design-brown)]"
              aria-hidden="true"
            />
          </div>
          <h1 className="ss-display mt-10 text-5xl font-bold text-[color:var(--design-ink)]">
            Reset your password
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-xl leading-8 text-[color:var(--design-muted)]">
            Enter your email and we&apos;ll send a secure reset link.
          </p>
        </div>

        <form className="mt-12 space-y-7" onSubmit={handleSubmit}>
          {error && (
            <div
              className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-semibold text-success"
              role="status"
            >
              {success}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-base font-bold uppercase tracking-[0.12em] text-[color:var(--design-muted)]"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-6 top-1/2 h-7 w-7 -translate-y-1/2 text-[color:var(--design-muted)]"
                aria-hidden="true"
              />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="ss-auth-input"
                placeholder="hello@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-full bg-[color:var(--design-peach)] px-8 text-xl font-bold text-[color:var(--design-ink)] shadow-[var(--design-shadow-soft)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending reset link..." : "Send reset link"}
            <ArrowRight className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 text-base font-bold text-[color:var(--design-muted)] transition hover:text-[color:var(--design-brown)]"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              Back to sign in
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
