"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { CycleInsightsPanel } from "@/components/cycle/CycleInsightsPanel";
import { CycleLogDialog } from "@/components/cycle/CycleLogDialog";
import { RecentEntries } from "@/components/cycle/RecentEntries";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buildDashboardSummary } from "@/features/dashboard/dashboard.utils";
import { useCyclePageState } from "@/hooks/useCyclePageState";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";
import type { DashboardCycleLog } from "@/types/dashboard";

import { InsightCard } from "./InsightCard";
import { PartnerCard } from "./PartnerCard";
import { QuickExploreLinks } from "./QuickExploreLinks";
import { RelationshipTranslationTeaser } from "./RelationshipTranslationTeaser";
import { YourStateCard } from "./YourStateCard";

export default function Dashboard() {
  const router = useRouter();
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
  const { ownerLink, ownSharingSummary, invitePartner } =
    usePartnerPortalData();

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
  const firstName = user.name?.split(" ")[0] || user.name || "there";

  return (
    <div className="min-h-screen bg-bg pb-10">
      <TopNavbar
        title={dashboardTitle}
        subtitle={format(new Date(), "EEEE, MMMM d")}
      />

      <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-10">
        <section className="hidden md:block">
          {/* TopNavbar above already renders this page's single <h1>, so this
              heading is demoted to h2 — a supplementary editorial
              restatement, not a second top-level heading. */}
          <SectionHeading
            as="h2"
            eyebrowVariant="pill"
            eyebrow="CORE PHILOSOPHY"
            title={`Good morning, ${firstName}`}
            description={format(new Date(), "EEEE, MMMM d")}
          />
        </section>

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

        {/* "Your State Today" and Recent Entries are connected — the same
            check-in feeds both, and picking a past entry here re-opens it
            for editing via the same dialog. */}
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
        </section>

        <section id="insights" className="grid gap-6">
          <InsightCard />

          <div className="grid gap-6 lg:grid-cols-2">
            <RelationshipTranslationTeaser />
            <PartnerCard
              ownerLink={ownerLink}
              sharingSummary={ownSharingSummary}
              onManage={() => router.push("/settings/privacy")}
              onInvite={invitePartner}
            />
          </div>

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
