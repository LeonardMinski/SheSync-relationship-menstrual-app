"use client";

import { format } from "date-fns";

import { CycleInsightsPanel } from "@/components/cycle/CycleInsightsPanel";
import { CycleLogDialog } from "@/components/cycle/CycleLogDialog";
import { RecentEntries } from "@/components/cycle/RecentEntries";
import { HomeGreeting } from "@/components/home/HomeGreeting";
import { HomeObservationCard } from "@/components/home/HomeObservationCard";
import { HomeRelationshipCard } from "@/components/home/HomeRelationshipCard";
import { QuickCheckIn } from "@/components/home/QuickCheckIn";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { buildDashboardSummary } from "@/features/dashboard/dashboard.utils";
import { deriveHomeState, deriveObservation } from "@/features/home/homeState";
import { useCyclePageState } from "@/hooks/useCyclePageState";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";
import { usePeriodPageState } from "@/hooks/usePeriodPageState";
import type { DashboardCycleLog } from "@/types/dashboard";

import { QuickExploreLinks } from "./QuickExploreLinks";
import { YourStateCard } from "./YourStateCard";

export default function Dashboard() {
  const {
    apiLoading,
    authLoading,
    clearError,
    closeLogForm,
    cycleError,
    cycleLoading,
    cycles,
    formError,
    formState,
    handleLogCycle,
    healthInsights,
    logging,
    nutritionSuggestion,
    openLogForm,
    saveSuccess,
    selectedData,
    selectedDate,
    selectCycleDate,
    showLogForm,
    toggleSymptom,
    updateFormState,
    user,
  } = useCyclePageState();
  const { ownerLink, invitePartner } = usePartnerPortalData();
  const { loading: periodLoading, activePeriod, history } = usePeriodPageState();

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
  const firstName = user.name?.split(" ")[0] || user.name || "there";

  const homeState = deriveHomeState({ activePeriod, periodHistory: history });
  const observation = deriveObservation(homeState);

  // No phase-name pill outside an active period — there's no real phase
  // detection model, and a "Day N" pill without period context would read
  // as a predicted cycle day. See deriveObservation for the honest
  // between_periods/new copy instead.
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
      <TopNavbar title="Home" subtitle={format(new Date(), "EEEE, MMMM d")} />

      <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-10">
        <HomeGreeting firstName={firstName} subtitle={subtitle} dayPillLabel={dayPillLabel} />

        {saveSuccess && (
          <div
            role="status"
            className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-semibold text-success"
          >
            Saved to your private space
          </div>
        )}

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
            {!periodLoading && <QuickCheckIn onCheckIn={openLogForm} seed={homeState.loggedPeriodCount} />}
            <HomeObservationCard title={observation.title} body={observation.body} />
          </div>
          <HomeRelationshipCard ownerLink={ownerLink} onInvite={invitePartner} />
        </div>

        {/* Secondary content: full wellbeing history and detail, below the
            primary Home experience — see Phase 10's priority ordering. */}
        <section className="space-y-6">
          <YourStateCard todaysLog={dashboardSummary.todaysLog} onCheckIn={openLogForm} />
          <RecentEntries cycles={cycles} onSelectCycle={selectCycleDate} onLog={openLogForm} />
          {selectedData && (
            <CycleInsightsPanel
              apiLoading={apiLoading}
              healthInsights={healthInsights}
              nutritionSuggestion={nutritionSuggestion}
            />
          )}
          <QuickExploreLinks />
        </section>
      </main>

      {showLogForm && (
        <CycleLogDialog
          error={formError}
          formState={formState}
          logging={logging}
          selectedDate={selectedDate}
          onCancel={closeLogForm}
          onSave={handleLogCycle}
          onToggleSymptom={toggleSymptom}
          onUpdate={updateFormState}
        />
      )}
    </div>
  );
}
