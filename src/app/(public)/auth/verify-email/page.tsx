"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, MailCheck, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="ss-page relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16 text-[color:var(--design-ink)]">
      <div className="pointer-events-none absolute -left-52 -top-52 h-[560px] w-[560px] rounded-full border-[70px] border-[color:var(--design-peach)]/35 bg-[color:var(--design-peach)]/10 blur-[1px]" />
      <div className="pointer-events-none absolute -bottom-64 -right-52 h-[620px] w-[620px] rounded-full border-[70px] border-[color:var(--design-sage-soft)] bg-[color:var(--design-sage-soft)]/40 blur-[1px]" />

      <section className="ss-card relative w-full max-w-xl px-6 py-14 text-center sm:px-16 sm:py-20">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[color:var(--design-footer)]">
          <MailCheck
            className="h-12 w-12 text-[color:var(--design-brown)]"
            aria-hidden="true"
          />
        </div>

        <h1 className="ss-display mt-12 text-5xl font-bold text-[color:var(--design-ink)]">
          Check your inbox
        </h1>
        <p className="mx-auto mt-7 max-w-md text-xl leading-8 text-[color:var(--design-muted)]">
          We&apos;ve sent a verification link to your email. Please click the
          link to confirm your address and enter your sanctuary.
        </p>

        <div className="mt-14 space-y-6">
          <a
            href="mailto:"
            className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[color:var(--design-peach)] px-8 text-lg font-bold text-[color:var(--design-brown)] shadow-[var(--design-shadow-soft)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)]"
          >
            Open Email App
            <ExternalLink className="h-5 w-5" aria-hidden="true" />
          </a>

          <Link
            href="/auth/signup"
            className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full border border-[color:var(--design-sage)] bg-white px-8 text-lg font-bold text-[color:var(--design-sage)] transition hover:bg-[color:var(--design-footer)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)]"
          >
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
            Resend Verification Email
          </Link>
        </div>

        <Link
          href="/auth/login"
          className="mt-12 inline-flex items-center justify-center gap-2 text-base font-bold text-[color:var(--design-muted)] transition hover:text-[color:var(--design-brown)]"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          Return to login
        </Link>
      </section>
    </div>
  );
}
