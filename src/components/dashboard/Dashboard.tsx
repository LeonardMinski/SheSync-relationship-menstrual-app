"use client";

import { format } from "date-fns";

import { CurrentCycleContext } from "@/components/home/CurrentCycleContext";
import { DailyCheckIn } from "@/components/home/DailyCheckIn";
import { HomeGreeting } from "@/components/home/HomeGreeting";
import { HomeObservationCard } from "@/components/home/HomeObservationCard";
import { HomeRelationshipCard } from "@/components/home/HomeRelationshipCard";
import { IncomingSharedContextCard } from "@/components/home/IncomingSharedContextCard";
import { YourWeek } from "@/components/home/YourWeek";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { findCycleForDate, toCycleDateKey } from "@/features/cycle/cycle.utils";
import { deriveHomeState, deriveObservation } from "@/features/home/homeState";
import { useAuth } from "@/context/AuthContext";
import { useCycleLogger } from "@/hooks/useCycleLogger";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";
import { usePeriodPageState } from "@/hooks/usePeriodPageState";

import { QuickExploreLinks } from "./QuickExploreLinks";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { cycles, loading: cycleLoading, error: cycleError, fetchCycles, clearError } = useCycleLogger();
  const { ownerLink, viewerLink, invitePartner } = usePartnerPortalData();
  const {
    loading: periodLoading,
    activePeriod,
    todayLog,
    history,
  } = usePeriodPageState();

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

  const today = new Date();
  const todayKey = toCycleDateKey(today);
  const firstName = user.name?.split(" ")[0] || user.name || "there";

  const homeState = deriveHomeState({ activePeriod, periodHistory: history });
  const observation = deriveObservation(homeState);
  const todaysEntry = findCycleForDate(cycles, today) ?? null;

  const dayPillLabel =
    homeState.variant === "active_period" ? `Day ${homeState.periodDay} · Period active` : undefined;

  const subtitle =
    homeState.variant === "active_period"
      ? "Focus on comfort. Your period is currently in progress."
      : homeState.variant === "just_ended"
        ? "Your period has ended. Take a moment to review it."
        : homeState.variant === "new"
          ? "Welcome to your space. We're ready to start learning your rhythm."
          : "How are you feeling today?";

  return (
    <div className="min-h-screen bg-bg pb-10">
      <TopNavbar title="Home" subtitle={format(today, "EEEE, MMMM d")} />

      <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-10">
        <HomeGreeting firstName={firstName} subtitle={subtitle} dayPillLabel={dayPillLabel} />

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

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {/* 1. Today / current cycle context — read-only */}
            {!periodLoading && <CurrentCycleContext homeState={homeState} todayLog={todayLog} />}

            {/* 2. How's your day been? — lightweight daily check-in */}
            <DailyCheckIn
              date={todayKey}
              hasActivePeriodToday={Boolean(activePeriod)}
              todaysEntry={todaysEntry}
              onSaved={() => void fetchCycles()}
            />

            {/* 3. What we're noticing — derived, evidence-gated observation */}
            <HomeObservationCard title={observation.title} body={observation.body} />

            {/* 4. Your week — compact visual recent-days strip */}
            <YourWeek cycles={cycles} activePeriod={activePeriod} periodHistory={history} />
          </div>

          {/* 5. Relationship context / action */}
          <div className="space-y-6">
            <HomeRelationshipCard ownerLink={ownerLink} onInvite={invitePartner} />
            {viewerLink?.status === "active" && (
              <IncomingSharedContextCard
                partnerId={viewerLink.owner_user_id}
                partnerName={viewerLink.personName}
              />
            )}
          </div>
        </div>

        <QuickExploreLinks />
      </main>
    </div>
  );
}
