"use client";

import { useEffect } from "react";
import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Activity,
  BarChart3,
  BatteryCharging,
  Heart,
  Moon,
  PenLine,
  Plus,
  ShieldCheck,
  Smile,
} from "lucide-react";

import { TopNavbar, Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useCycleLogger } from "@/hooks/useCycleLogger";
import { cn } from "@/utils/cn";

type CycleLog = {
  date: string;
  phase?: string | null;
  mood?: number | null;
  energy?: number | null;
  stress?: number | null;
  symptoms?: string[] | null;
};

const fallbackPhase = "follicular";

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
  const todaysData = cycles.find((cycle) => cycle.date === today);
  const latestLog = todaysData ?? getLatestCycle(cycles);
  const phase = latestLog?.phase ?? fallbackPhase;
  const dayNumber = estimateCycleDay(latestLog?.date);
  const phaseLabel = toPhaseLabel(phase);

  return (
    <div className="min-h-screen bg-bg pb-10">
      <TopNavbar
        title={`Day ${dayNumber} · ${phaseLabel}`}
        subtitle={format(new Date(), "EEEE, MMMM d")}
        showNotifications
      />

      <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-10">
        <section className="hidden md:block">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Your Cycle Dashboard
          </h1>
          <p className="mt-2 text-xl font-semibold text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d")} · Feeling Rested
          </p>
        </section>

        {cycleError && (
          <div
            role="alert"
            className="flex items-start justify-between gap-4 rounded-2xl border border-error/25 bg-error/10 px-4 py-3 text-sm text-error"
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

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <CycleHero
            dayNumber={dayNumber}
            phaseLabel={phaseLabel}
            hasLog={Boolean(todaysData)}
            onLog={() => router.push("/cycle")}
          />
          <DailySnapshot todaysData={todaysData} latestLog={latestLog} />
        </section>

        <section
          id="insights"
          className="grid gap-6"
        >
          <InsightCard />
          <PartnerCard onManage={() => router.push("/settings/privacy")} />
          <ComingSoonTile
            label="Insights"
            description="Deep pattern summaries are parked until the MVP loop is reliable."
            icon={BarChart3}
          />
          <ComingSoonTile
            label="AI Coach"
            description="Personalized guidance will return after the core journey is stable."
            icon={Moon}
          />
        </section>
      </main>

      <Navbar />
    </div>
  );
}

function CycleHero({
  dayNumber,
  phaseLabel,
  hasLog,
  onLog,
}: {
  dayNumber: number;
  phaseLabel: string;
  hasLog: boolean;
  onLog: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-border bg-bg-surface px-5 py-8 text-center shadow-lg sm:px-8 md:py-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-info" aria-hidden="true" />
          Privacy first
        </div>

        <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
          {phaseLabel}
        </h2>

        <div className="mt-8 flex aspect-square w-full max-w-[280px] items-center justify-center rounded-full border-[10px] border-cta-start/80 bg-bg sm:max-w-[320px]">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-muted-foreground">
              Day
            </p>
            <p className="mt-1 text-7xl font-black leading-none text-foreground sm:text-8xl">
              {dayNumber}
            </p>
          </div>
        </div>

        <div className="mt-8 max-w-2xl">
          <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Estrogen is rising. You might feel a gentle increase in energy,
            focus, and sociability today.
          </p>
        </div>

        <Button className="mt-9 w-full max-w-xs" onClick={onLog}>
          <PenLine className="h-5 w-5" aria-hidden="true" />
          {hasLog ? "Update Log" : "Log Today"}
        </Button>
      </div>
    </section>
  );
}

function DailySnapshot({
  todaysData,
  latestLog,
}: {
  todaysData?: CycleLog;
  latestLog?: CycleLog;
}) {
  const log = todaysData ?? latestLog;

  return (
    <section className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Daily Snapshot</h2>
        <PenLine className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>

      <div className="grid gap-3">
        <MetricTile
          label="Mood"
          value={scoreToMood(log?.mood)}
          icon={Smile}
          accent="text-cta-start"
        />
        <MetricTile
          label="Energy"
          value={scoreToEnergy(log?.energy)}
          icon={BatteryCharging}
          accent="text-info"
        />
        <MetricTile
          label="Stress"
          value={scoreToStress(log?.stress)}
          icon={Activity}
          accent="text-[color:var(--accent-lilac)]"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-border bg-bg p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Symptoms
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {log?.symptoms?.length ? (
            log.symptoms.slice(0, 3).map((symptom) => (
              <span
                key={symptom}
                className="rounded-full bg-bg-elevated px-3 py-1 text-sm font-semibold text-foreground"
              >
                {symptom}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Log Symptoms
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-bg p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {label === "Mood" ? "Logged today" : "Latest signal"}
          </p>
        </div>
        <Icon className={cn("h-5 w-5 shrink-0", accent)} aria-hidden="true" />
      </div>
    </div>
  );
}

function InsightCard() {
  return (
    <article className="flex min-w-0 flex-col rounded-[2rem] border border-border bg-bg-surface p-5 shadow-md">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 shrink-0 text-info" aria-hidden="true" />
        <h2 className="min-w-0 truncate text-xl font-bold text-foreground">
          AI Insight
        </h2>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        Your energy levels typically peak during this late follicular phase.
        Focused work and movement may feel easier today.
      </p>
      <p className="mt-6 text-sm font-bold text-info">Read analysis</p>
    </article>
  );
}

function PartnerCard({ onManage }: { onManage: () => void }) {
  const partnerName = "Alexandria Montgomery-Santos";

  return (
    <article className="flex min-w-0 flex-col rounded-[2rem] border border-border border-l-[6px] border-l-[color:var(--accent-peach)] bg-bg-surface p-5 shadow-md">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-elevated">
            <Heart
              className="h-5 w-5 text-[color:var(--accent-peach)]"
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-foreground">
              Partner View
            </h2>
            <p className="mt-1 truncate text-sm font-semibold text-muted-foreground">
              Sharing summary
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        <StatusPill label="Shared" value="Cycle phase, mood logs" tone="sage" />
        <StatusPill label="Private" value="Symptoms, notes" tone="muted" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Selected context is visible. Private categories stay hidden.
      </p>

      <div className="mt-5">
        <div className="rounded-2xl border border-border bg-bg p-3">
          <div className="flex min-w-0 flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-bg-elevated text-sm font-black text-foreground ring-1 ring-border">
              {partnerName.charAt(0)}
            </span>
            <div className="min-w-0 max-w-full">
              <p
                className="break-words text-base font-bold leading-snug text-foreground"
                title={partnerName}
              >
                {partnerName}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Connected partner
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onManage}
            className="mt-3 min-h-11 w-full rounded-full border border-border bg-bg-surface px-4 text-sm font-bold text-foreground transition hover:border-cta-start hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
          >
            Manage Sharing
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "sage" | "muted";
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-bg p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={
          tone === "sage"
            ? "mt-1 truncate text-sm font-bold text-cta-start"
            : "mt-1 truncate text-sm font-bold text-muted-foreground"
        }
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function ComingSoonTile({
  label,
  description,
  icon: Icon,
}: {
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <article className="flex min-w-0 flex-col rounded-[2rem] border border-border bg-bg-surface p-5 opacity-75 shadow-md">
      <span className="rounded-md bg-bg-elevated px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        Coming Soon
      </span>
      <div className="mt-5 flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-lg font-bold text-foreground">{label}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

function getLatestCycle(cycles: CycleLog[]) {
  return [...cycles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )[0];
}

function estimateCycleDay(date?: string) {
  if (!date) {
    return 14;
  }

  const loggedAt = new Date(`${date}T00:00:00`);
  const elapsed = Math.max(0, Date.now() - loggedAt.getTime());
  return Math.min(28, Math.max(1, 14 + Math.floor(elapsed / 86400000)));
}

function toPhaseLabel(phase: string) {
  return `${phase.charAt(0).toUpperCase()}${phase.slice(1)} Phase`;
}

function scoreToMood(score?: number | null) {
  if (typeof score !== "number") {
    return "Calm";
  }
  if (score >= 8) return "Energetic";
  if (score >= 5) return "Calm";
  return "Tender";
}

function scoreToEnergy(score?: number | null) {
  if (typeof score !== "number") {
    return "Good";
  }
  if (score >= 8) return "High";
  if (score >= 5) return "Good";
  return "Low";
}

function scoreToStress(score?: number | null) {
  if (typeof score !== "number") {
    return "Mild";
  }
  if (score >= 8) return "Peak";
  if (score >= 5) return "Mild";
  return "Calm";
}
