import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg text-foreground">
      <header className="border-b border-border px-4 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cta-start text-[color:var(--cta-foreground)]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight">SheSync+</span>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              className="flex min-h-[44px] items-center text-sm font-semibold text-muted-foreground hover:text-foreground"
              href="/auth/login"
            >
              Log in
            </Link>
            <Link className="btn-cta flex min-h-[44px] items-center px-4 text-sm" href="/auth/signup">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
            Understand yourself. Share only what you choose.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Log your cycle privately, see it reflected on your dashboard, and decide exactly what
            a connected partner can see — nothing is shared until you turn it on.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/signup" className="btn-cta flex min-h-[48px] items-center justify-center px-5">
              Create free account
            </Link>
            <Link
              href="/auth/login"
              className="flex min-h-[48px] items-center justify-center rounded-lg border border-border px-5 font-semibold text-foreground hover:border-cta-start"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon="C"
            title="Cycle logging"
            description="Save phase, mood, energy, stress, symptoms, and notes by date."
          />
          <FeatureCard
            icon="P"
            title="Privacy controls"
            description="Choose exactly whether cycle phase and mood are visible to a partner. Off by default."
          />
          <FeatureCard
            icon="2"
            title="Partner connection"
            description="An optional, read-only partner view that only shows what you've explicitly enabled."
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-surface p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[color:var(--accent-rose)]/10 text-[color:var(--accent-rose)]">
        <span className="text-sm font-bold" aria-hidden="true">
          {icon}
        </span>
      </div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
