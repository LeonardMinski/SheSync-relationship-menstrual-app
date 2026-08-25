"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleCheck } from "lucide-react";

export default function AuthCallback() {
  return (
    <div className="ss-page flex min-h-screen items-center justify-center px-5 py-16 text-[color:var(--design-ink)]">
      <section className="ss-card w-full max-w-xl px-6 py-14 text-center sm:px-14 sm:py-16">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--design-sage-soft)]">
          <CircleCheck
            className="h-11 w-11 text-[color:var(--design-sage)]"
            aria-hidden="true"
          />
        </div>

        <h1 className="ss-display mt-10 text-5xl font-bold text-[color:var(--design-ink)]">
          Email confirmed
        </h1>

        <p className="mx-auto mt-6 max-w-sm text-xl leading-8 text-[color:var(--design-muted)]">
          Your email has been confirmed successfully. You can now log in to
          your account.
        </p>

        <Link
          href="/auth/login"
          className="mt-12 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[color:var(--design-peach)] px-8 text-lg font-bold text-[color:var(--design-ink)] shadow-[var(--design-shadow-soft)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)]"
        >
          Continue to Login
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>

        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center gap-2 text-sm font-bold text-[color:var(--design-muted)] transition hover:text-[color:var(--design-brown)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Home
        </Link>
      </section>
    </div>
  );
}
