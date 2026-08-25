import Link from "next/link";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";

import { PublicFooter, PublicHeader } from "@/components/layout/PublicChrome";

export default function HomePage() {
  return (
    <div className="ss-page min-h-screen text-[color:var(--design-ink)]">
      <PublicHeader />

      <main>
        <section className="mx-auto grid min-h-[720px] w-full max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div className="max-w-xl">
            <h1 className="ss-display text-5xl font-bold leading-[0.98] tracking-tight text-[color:var(--design-ink)] sm:text-6xl lg:text-7xl">
              Harmony in your hands, shared with your heart.
            </h1>
            <p className="mt-8 max-w-lg text-xl leading-9 text-[color:var(--design-muted)]">
              Empower your intimate wellness journey with a sophisticated,
              private space for menstrual health and partner sharing.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-[color:var(--design-peach)] px-9 text-base font-bold text-[color:var(--design-ink)] shadow-[var(--design-shadow-soft)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)]"
              >
                Get Started
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-[color:var(--design-brown)] px-9 text-base font-bold text-[color:var(--design-ink)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)]"
              >
                How it works
              </Link>
            </div>
          </div>

          <div className="ss-card mx-auto w-full max-w-xl p-6">
            <div className="relative aspect-[1.04] overflow-hidden rounded-xl border border-[color:var(--design-border)] bg-[#faf7f0]">
              <div className="absolute inset-x-0 top-0 flex h-16 items-center justify-center border-b border-[color:var(--design-border)] bg-white/70">
                <span className="ss-display text-3xl font-bold text-[color:var(--design-brown)]">
                  SheSync+
                </span>
              </div>
              <div className="absolute inset-0 top-16">
                <div className="absolute -left-24 top-20 h-40 w-[120%] rotate-[-10deg] rounded-[50%] bg-[color:var(--design-peach)]/45 blur-sm" />
                <div className="absolute left-16 top-28 h-32 w-[95%] rotate-[8deg] rounded-[50%] bg-[color:var(--design-sage-soft)]/80 blur-[2px]" />
                <div className="absolute left-28 top-36 h-36 w-[92%] rotate-[-14deg] rounded-[50%] bg-[#d9bd9a]/50 blur-[2px]" />
              </div>
              <div className="absolute inset-x-0 top-24 text-center">
                <p className="ss-display text-3xl font-semibold text-[color:var(--design-brown)]">
                  Welcome
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[color:var(--design-border)] bg-white/45 px-5 py-24 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <h2 className="ss-display text-4xl font-bold text-[color:var(--design-ink)] md:text-5xl">
                Elevate your awareness
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[color:var(--design-muted)]">
                Designed with radical privacy and soft tactility to support
                your holistic wellbeing.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={Sparkles}
                title="Deep Cycle Insights"
                description="Track your natural rhythms with precision. Minimalist logs reduce cognitive load while keeping patterns useful."
              />
              <FeatureCard
                icon={ShieldCheck}
                title="Radical Privacy"
                description="Your intimate data remains yours, with explicit controls for what a partner can see."
              />
              <FeatureCard
                icon={Heart}
                title="Empowered Partnerships"
                description="Foster empathy and connection through calm, discreet partner context."
              />
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
}) {
  return (
    <article className="ss-card min-h-[260px] p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--design-footer)]">
        <Icon className="h-6 w-6 text-[color:var(--design-sage)]" aria-hidden="true" />
      </div>
      <h3 className="ss-display mt-12 text-3xl font-bold text-[color:var(--design-ink)]">
        {title}
      </h3>
      <p className="mt-5 text-base leading-7 text-[color:var(--design-muted)]">
        {description}
      </p>
    </article>
  );
}
