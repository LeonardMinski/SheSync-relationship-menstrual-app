"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  HeartHandshake,
  Sprout,
} from "lucide-react";

import { PublicFooter, PublicHeader } from "@/components/layout/PublicChrome";
import { useAuth } from "@/context/AuthContext";
import { buildDashboardSummary } from "@/features/dashboard/dashboard.utils";
import { useCycleLogger } from "@/hooks/useCycleLogger";
import type { DashboardCycleLog } from "@/types/dashboard";

import { CycleHero } from "./CycleHero";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    cycles,
    fetchCycles,
    loading: cycleLoading,
    error: cycleError,
    clearError,
  } = useCycleLogger();

  useEffect(() => {
    if (user && !authLoading) {
      void fetchCycles();
    }
  }, [user, authLoading, fetchCycles]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || cycleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-cta-start"
          aria-label="Loading dashboard"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const dashboardCycles = cycles satisfies DashboardCycleLog[];
  const dashboardSummary = buildDashboardSummary(dashboardCycles, today);
  const phaseLabel = dashboardSummary.phaseLabel ?? "No cycle data yet";
  const firstName = user.name?.split(" ")[0] || "Sarah";

  return (
    <div className="ss-page flex min-h-screen flex-col">
      <PublicHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-20 sm:px-8 lg:px-10">
        <section className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="ss-display text-5xl font-bold leading-tight text-[color:var(--design-brown)] sm:text-6xl">
              Good morning, {firstName}.
            </h1>
            <p className="mt-4 text-xl text-[color:var(--design-ink)]">
              {dashboardSummary.latestLog
                ? `${phaseLabel}. Your cycle context is ready.`
                : "Here is your wellness overview for today."}
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--design-border)] bg-white px-5 py-3 text-sm font-bold tracking-[0.08em] text-[color:var(--design-sage)] shadow-[var(--design-shadow-soft)]">
            <HeartHandshake className="h-4 w-4" aria-hidden="true" />
            Partner Synced
          </div>
        </section>

        {cycleError && (
          <div
            role="alert"
            className="mt-10 flex items-start justify-between gap-4 rounded-2xl border border-error/25 bg-error/10 px-4 py-3 text-sm text-error"
          >
            <span>{cycleError}</span>
            <button
              type="button"
              onClick={clearError}
              className="shrink-0 font-semibold underline underline-offset-4"
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="mt-20 grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
          <CycleHero
            dayNumber={dashboardSummary.cycleDay}
            phaseLabel={phaseLabel}
            hasLog={Boolean(dashboardSummary.todaysLog)}
            onLog={() => router.push("/cycle")}
          />

          <div className="grid gap-8">
            <DashboardInfoCard
              eyebrow="Upcoming"
              icon={Sprout}
              title="Ovulation"
              description="Expected in 2 days"
              footer="Your energy levels are typically highest during this phase."
            />

            <PartnerSharingCard onManage={() => router.push("/settings/privacy")} />
          </div>
        </section>

        <section id="insights" className="mt-28">
          <h2 className="ss-display text-4xl font-bold text-[color:var(--design-brown)]">
            Insights &amp; Patterns
          </h2>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <CycleTrendsCard />
            <MoodDistributionCard />
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

function DashboardInfoCard({
  eyebrow,
  icon: Icon,
  title,
  description,
  footer,
}: {
  eyebrow: string;
  icon: typeof Sprout;
  title: string;
  description: string;
  footer: string;
}) {
  return (
    <article className="ss-card p-7">
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--design-ink)]">
        {eyebrow}
      </p>

      <div className="mt-7 flex items-center gap-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--design-sage-soft)] text-[color:var(--design-sage)]">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h3 className="ss-display text-3xl font-bold leading-none text-[color:var(--design-brown)]">
            {title}
          </h3>
          <p className="mt-1 text-base text-[color:var(--design-ink)]">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-20 border-t border-[color:var(--design-border)] pt-7">
        <p className="text-base leading-relaxed text-[color:var(--design-ink)]">
          {footer}
        </p>
      </div>
    </article>
  );
}

function PartnerSharingCard({ onManage }: { onManage: () => void }) {
  return (
    <article className="ss-card p-7">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-semibold text-[color:var(--design-brown)]">
            Partner Sharing
          </h3>
          <p className="mt-3 max-w-sm leading-relaxed text-[color:var(--design-ink)]">
            Currently sharing phase and mood data.
          </p>
        </div>

        <button
          type="button"
          onClick={onManage}
          aria-label="Manage partner sharing"
          className="relative h-8 w-16 rounded-full bg-[color:var(--design-sage)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)]"
        >
          <span className="absolute right-1 top-1 h-6 w-6 rounded-full bg-white" />
        </button>
      </div>
    </article>
  );
}

function CycleTrendsCard() {
  const bars = [44, 22, 60, 30, 15];

  return (
    <article className="ss-card p-7">
      <div className="flex items-center justify-between">
        <h3 className="ss-display text-3xl font-bold text-[color:var(--design-brown)]">
          Cycle Trends
        </h3>
        <span className="rounded-full bg-[color:var(--design-footer)] px-5 py-2 text-sm font-bold text-[color:var(--design-ink)]">
          3 Months
        </span>
      </div>

      <div className="mt-10 grid min-h-72 grid-cols-[auto_1fr] gap-5">
        <div className="flex flex-col justify-between py-2 text-sm text-[color:var(--design-muted)]">
          <span>High</span>
          <span>Med</span>
          <span>Low</span>
        </div>

        <div className="relative border-b border-l border-[color:var(--design-border)]">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 420 240"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M20 130 C70 185 115 115 145 45 C185 -40 250 40 235 160 C225 255 300 270 320 175"
              fill="none"
              stroke="var(--design-brown)"
              strokeDasharray="4 7"
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>

          <div className="absolute inset-x-4 bottom-0 flex h-full items-end justify-between gap-10">
            {bars.map((height, index) => (
              <span
                key={index}
                className="w-10 rounded-t-sm bg-[color:var(--design-peach)]"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>

          <div className="absolute inset-x-4 -bottom-8 flex justify-between text-sm text-[color:var(--design-muted)]">
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function MoodDistributionCard() {
  return (
    <article className="ss-card p-7">
      <h3 className="ss-display text-3xl font-bold text-[color:var(--design-brown)]">
        Mood Distribution
      </h3>

      <div className="mt-12 flex justify-center">
        <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-[conic-gradient(var(--design-peach)_0_50%,#dfe5c8_50%_80%,#ffd99c_80%_100%)]">
          <div className="flex h-36 w-36 items-center justify-center rounded-full bg-white text-center">
            <div>
              <p className="ss-display text-5xl leading-none text-[color:var(--design-brown)]">
                80%
              </p>
              <p className="mt-1 text-sm font-bold tracking-[0.08em] text-[color:var(--design-ink)]">
                Positive
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-5 text-sm font-semibold tracking-wide text-[color:var(--design-ink)]">
        <Legend color="var(--design-peach)" label="Calm (50%)" />
        <Legend color="#dfe5c8" label="Energized (30%)" />
        <Legend color="#ffd99c" label="Anxious (20%)" />
      </div>
    </article>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
