"use client";

import { useEffect } from "react";
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
import { selectHomeObservation } from "@/features/patterns/engine";
import { useAuth } from "@/context/AuthContext";
import { useCycleLogger } from "@/hooks/useCycleLogger";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";
import { usePatterns } from "@/hooks/usePatterns";
import { usePeriodPageState } from "@/hooks/usePeriodPageState";

import { QuickExploreLinks } from "./QuickExploreLinks";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { cycles, loading: cycleLoading, error: cycleError, fetchCycles, clearError } = useCycleLogger();
  const { ownerLink, viewerLink, invitePartner } = usePartnerPortalData();

  // useCycleLogger only fetches when explicitly told to (see its other
  // callers: cycle/patterns and useSettingsPageState both do this same
  // mount-effect) — without it, `cycles` stays the hook's initial empty
  // array until the first save-triggered refetch, so today's Daily
  // Check-in silently shows as unanswered on every fresh load/reload even
  // when it was already saved. Found live during the 2026-09-08 showcase
  // audit: a real fixture account's saved mood vanished from the UI on
  // reload despite the database row being correct.
  useEffect(() => {
    if (user && !authLoading) {
      void fetchCycles();
    }
  }, [user, authLoading, fetchCycles]);
  const {
    loading: periodLoading,
    activePeriod,
    todayLog,
    history,
  } = usePeriodPageState();
  const { observations } = usePatterns();

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
  // Real Pattern Engine observation takes priority; falls back to the
  // existing honest "still learning" copy when nothing sufficient exists
  // yet — never a fabricated replacement. See features/patterns/engine.ts.
  const patternObservation = selectHomeObservation(observations, Boolean(activePeriod));
  const fallbackObservation = deriveObservation(homeState);
  const observation = patternObservation
    ? { title: patternObservation.title, body: patternObservation.statement }
    : fallbackObservation;
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
