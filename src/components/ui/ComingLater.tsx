"use client";

import { FormEvent } from "react";
import { Hourglass } from "lucide-react";

import { PublicFooter, PublicHeader } from "@/components/layout/PublicChrome";

interface ComingLaterProps {
  title: string;
  description: string;
}

export default function ComingLater({ title, description }: ComingLaterProps) {
  const handleNotify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="ss-page flex min-h-screen flex-col">
      <PublicHeader showAppNav={false} />

      <main className="flex flex-1 items-center justify-center px-5 py-20">
        <section
          aria-label={`${title} coming soon`}
          className="ss-card w-full max-w-4xl px-6 py-16 text-center sm:px-14 lg:px-20"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--design-footer)] text-[color:var(--design-sage)]">
            <Hourglass className="h-10 w-10" aria-hidden="true" />
          </div>

          <h1 className="ss-display mt-10 text-5xl font-bold leading-none text-[color:var(--design-brown)] sm:text-6xl">
            Coming Soon
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-xl font-semibold leading-relaxed text-[color:var(--design-muted)] sm:text-2xl">
            {description}
          </p>

          <form
            className="mx-auto mt-20 grid max-w-2xl gap-4 sm:grid-cols-[1fr_auto]"
            onSubmit={handleNotify}
          >
            <label className="sr-only" htmlFor="coming-soon-email">
              Email address
            </label>
            <input
              id="coming-soon-email"
              type="email"
              placeholder="Enter your email"
              className="min-h-16 rounded-full border border-[color:var(--design-peach)] bg-white px-8 text-lg font-semibold text-[color:var(--design-ink)] outline-none transition focus:ring-2 focus:ring-[color:var(--design-peach)]"
            />
            <button
              type="submit"
              className="min-h-16 rounded-full bg-[color:var(--design-peach)] px-12 text-lg font-bold text-[color:var(--design-brown)] shadow-[var(--design-shadow-soft)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)]"
            >
              Notify Me
            </button>
          </form>

          <p className="mt-4 text-sm font-bold tracking-wide text-[color:var(--design-muted)]">
            We&apos;ll only email you when it&apos;s ready. No spam.
          </p>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
