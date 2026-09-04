import Link from "next/link";
import { Eye, MessageCircle, Share2, Sparkles } from "lucide-react";

import { OrganicArtwork } from "@/components/ui/OrganicArtwork";
import { PremiumBadge } from "@/components/ui/PremiumBadge";

const FLOW_STEPS = [
  { icon: Sparkles, label: "Notice", description: "Private everyday reflections and soft wellbeing logging." },
  { icon: Eye, label: "Understand", description: "Mood, energy, and cycle pattern insights." },
  { icon: Share2, label: "Share", description: "Select granular pieces of context you want to translate." },
  { icon: MessageCircle, label: "Connect", description: "Partner receives clear translation cards, not raw data." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg text-foreground">
      <header className="border-b border-border px-4 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-display text-lg font-bold tracking-tight">
            SheSync<span className="text-[color:var(--accent-rose)]">+</span>
          </span>

          <nav className="flex items-center gap-3">
            <Link
              className="flex min-h-[44px] items-center text-sm font-semibold text-muted-foreground hover:text-foreground"
              href="/auth/login"
            >
              Sign in
            </Link>
            <Link className="btn-cta flex min-h-[44px] items-center px-4 text-sm" href="/auth/signup">
              Start your space
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Introducing a new category
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
            It&apos;s difficult enough understanding how you feel.
          </h1>
          <p className="font-display mt-2 text-2xl font-bold leading-tight text-[color:var(--accent-rose)] md:text-3xl">
            Explaining it to someone you love can be even harder.
          </p>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            SheSync+ helps you understand your rhythms privately, then share only the context you
            choose — building a considered relationship-translation layer, not a raw data feed.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/signup" className="btn-cta flex min-h-[48px] items-center justify-center px-5">
              Start your space
            </Link>
            <Link
              href="/auth/login"
              className="flex min-h-[48px] items-center justify-center rounded-lg border border-border px-5 font-semibold text-foreground hover:border-cta-start"
            >
              Sign in
            </Link>
          </div>
        </div>
        <OrganicArtwork variant="duo" className="max-w-md justify-self-center" />
      </section>

      {/* Flow */}
      <section className="border-y border-border bg-bg-surface px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-2xl font-bold text-foreground">How it works</h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            A four-step continuous flow from self to connection.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.label} className="rounded-2xl border border-border bg-bg p-5">
                <p className="text-xs font-bold text-[color:var(--accent-rose)]">{`0${i + 1}`}</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
                  <step.icon className="h-4 w-4 text-[color:var(--accent-rose)]" aria-hidden="true" />
                  {step.label}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Private insight -> partner translation */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-display text-2xl font-bold text-foreground">
          Help them understand what you need
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          An optional, deliberate translation interface. Transform private notes into human connection.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--accent-sage)]/30 bg-bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--accent-sage)]">
              Inner private insight
            </p>
            <p className="mt-2 font-display text-lg font-bold text-foreground">Lower energy this week</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Energy levels naturally dipping. Higher emotional sensitivity expected for a few days.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--accent-amber)]/30 bg-bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--accent-amber)]">
              Partner translation
            </p>
            <p className="mt-2 font-display text-lg font-bold text-foreground">
              &ldquo;I could use a quieter evening tonight.&rdquo;
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your partner sees a clear, chosen sentence — never the underlying private log.
            </p>
          </div>
        </div>
      </section>

      {/* Vault teaser */}
      <section className="bg-[color:var(--accent-premium)] px-4 py-16 text-[color:var(--accent-premium-foreground)] sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide opacity-70">The private Vault</p>
            <h2 className="mt-2 font-display text-3xl font-bold">
              A private space for desires, curiosity, and things worth exploring.
            </h2>
            <p className="mt-3 max-w-md text-sm opacity-80">
              Save private thoughts and reflections. Nothing is shared unless you choose to.
            </p>
            <Link
              href="/auth/signup"
              className="btn-cta mt-6 inline-flex min-h-[44px] items-center px-5 text-sm"
            >
              Explore the Vault
            </Link>
          </div>
          <OrganicArtwork variant="trio" className="max-w-xs justify-self-center opacity-90" />
        </div>
      </section>

      {/* Privacy philosophy */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Private by default. Shared intentionally. Always yours.
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Your wellbeing logs stay private by default. Nothing is shared with a partner unless you
          explicitly choose to share it.
        </p>
      </section>

      {/* Pricing teaser */}
      <section className="border-t border-border bg-bg-surface px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-2xl font-bold text-foreground">Elevate your wellbeing journey.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Share what matters, keep what&apos;s private. We never paywall privacy controls.
          </p>
          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-bg p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">SheSync+ Free</p>
              <p className="font-display mt-1 text-2xl font-bold text-foreground">Free</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>Daily wellbeing logging</li>
                <li>Basic history trends</li>
                <li>Privacy controls</li>
                <li>Partner connection</li>
                <li>Limited prompts</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-[color:var(--accent-premium)] p-6 text-[color:var(--accent-premium-foreground)]">
              <PremiumBadge />
              <p className="font-display mt-2 text-2xl font-bold">
                $9.99<span className="text-sm font-normal opacity-70">/mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm opacity-90">
                <li>AI Coach</li>
                <li>Advanced analytics</li>
                <li>Vault</li>
                <li>Partner Translation</li>
                <li>Extended intimacy library</li>
              </ul>
              <Link href="/pricing" className="btn-cta mt-5 flex min-h-[44px] items-center justify-center text-sm">
                See Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          Take command of your rhythm. Build your connection.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing is shared unless you say so. Start your completely private space today.
        </p>
        <Link
          href="/auth/signup"
          className="btn-cta mt-6 inline-flex min-h-[48px] items-center px-6 text-sm"
        >
          Start your space
        </Link>
      </section>
    </main>
  );
}
