"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, KeyRound, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkRecoverySession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (data.session) {
        setSessionReady(true);
      } else {
        setError("This reset link is invalid or expired. Request a new one.");
      }
    };

    checkRecoverySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword(password);
      if (!result.success) {
        setError(result.error || "Unable to update password");
        return;
      }

      setSuccess("Password updated. Redirecting to sign in...");
      setTimeout(() => {
        router.replace("/auth/login");
      }, 1200);
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
            Choose a new password
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-xl leading-8 text-[color:var(--design-muted)]">
            Set a fresh password for your SheSync+ account.
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

          <PasswordField
            id="password"
            name="password"
            label="New Password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
          />

          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm New Password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
          />

          <button
            type="submit"
            disabled={loading || !sessionReady}
            className="inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-full bg-[color:var(--design-peach)] px-8 text-xl font-bold text-[color:var(--design-ink)] shadow-[var(--design-shadow-soft)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Updating password..." : "Update password"}
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

function PasswordField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={props.id}
        className="block text-base font-bold uppercase tracking-[0.12em] text-[color:var(--design-muted)]"
      >
        {label}
      </label>
      <div className="relative">
        <LockKeyhole
          className="pointer-events-none absolute left-6 top-1/2 h-7 w-7 -translate-y-1/2 text-[color:var(--design-muted)]"
          aria-hidden="true"
        />
        <input
          type="password"
          required
          className="ss-auth-input"
          {...props}
        />
      </div>
    </div>
  );
}
