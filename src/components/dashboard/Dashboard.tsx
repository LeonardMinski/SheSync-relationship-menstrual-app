"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { TopNavbar } from "@/components/layout/TopNavbar";
import { useAuth } from "@/context/AuthContext";
import { buildDashboardSummary } from "@/features/dashboard/dashboard.utils";
import { useCycleLogger } from "@/hooks/useCycleLogger";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";
import type { DashboardCycleLog } from "@/types/dashboard";

import { CycleHero } from "./CycleHero";
import { DailySnapshot } from "./DailySnapshot";
import { InsightCard } from "./InsightCard";
import { PartnerCard } from "./PartnerCard";
import { QuickExploreLinks } from "./QuickExploreLinks";

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
  const { ownerLink, ownSharingSummary, invitePartner } =
    usePartnerPortalData();

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
          className="h-9 w-9 motion-reduce:animate-none animate-spin rounded-full border-2 border-border border-t-cta-start"
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
  const dashboardTitle = dashboardSummary.cycleDay
    ? `Day ${dashboardSummary.cycleDay} · ${phaseLabel}`
    : phaseLabel;

  return (
    <div className="min-h-screen bg-bg pb-10">
      <TopNavbar
        title={dashboardTitle}
        subtitle={format(new Date(), "EEEE, MMMM d")}
      />

      <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-10">
        <section className="hidden md:block">
          {/* TopNavbar above already renders this page's single <h1>; this is a
              supplementary editorial restatement, not a second heading. */}
          <p className="font-display text-5xl font-bold tracking-tight text-foreground">
            Your Cycle Dashboard
          </p>
          <p className="mt-2 text-xl font-semibold text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d")} ·{" "}
            {dashboardSummary.latestLog
              ? "Latest entry available"
              : "Log an entry to build your dashboard"}
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
            dayNumber={dashboardSummary.cycleDay}
            phaseLabel={phaseLabel}
            hasLog={Boolean(dashboardSummary.todaysLog)}
            onLog={() => router.push("/cycle")}
          />
          <DailySnapshot
            todaysData={dashboardSummary.todaysLog}
            latestLog={dashboardSummary.latestLog}
          />
        </section>

        <section id="insights" className="grid gap-6">
          <InsightCard />
          <PartnerCard
            ownerLink={ownerLink}
            sharingSummary={ownSharingSummary}
            onManage={() => router.push("/settings/privacy")}
            onInvite={invitePartner}
          />
          <QuickExploreLinks />
        </section>
      </main>
    </div>
  );
}
