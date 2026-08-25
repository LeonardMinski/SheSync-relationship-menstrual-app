"use client";

import { format } from "date-fns";

import { CycleEmptyState } from "@/components/cycle/CycleEmptyState";
import { CycleInsightsPanel } from "@/components/cycle/CycleInsightsPanel";
import { CycleIntro } from "@/components/cycle/CycleIntro";
import { CycleLogDialog } from "@/components/cycle/CycleLogDialog";
import { CycleSummaryCards } from "@/components/cycle/CycleSummaryCards";
import { PublicFooter, PublicHeader } from "@/components/layout/PublicChrome";
import { useCyclePageState } from "@/hooks/useCyclePageState";

export default function CyclePage() {
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
    selectedData,
    selectedDate,
    selectCycleDate,
    showLogForm,
    toggleSymptom,
    updateFormState,
    user,
  } = useCyclePageState();

  if (authLoading || cycleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div
          className="h-8 w-8 animate-spin rounded-full border-b-2 border-cta-start"
          aria-label="Loading cycle logger"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="ss-page min-h-screen text-[color:var(--design-ink)]">
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl space-y-8 px-5 py-12 sm:px-8 lg:px-10">
        <section className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[color:var(--design-sage)]">
            {format(selectedDate, "EEEE, MMMM d")}
          </p>
          <h1 className="ss-display mt-4 text-5xl font-bold leading-tight text-[color:var(--design-ink)] md:text-6xl">
            How are you feeling today?
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-xl leading-8 text-[color:var(--design-muted)]">
            Log your daily metrics to discover personal insights.
          </p>
        </section>

        <CycleIntro hasEntry={Boolean(selectedData)} onLog={openLogForm} />

        {cycleError && (
          <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {cycleError}
            <button
              type="button"
              onClick={clearError}
              className="ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {cycles.length === 0 && <CycleEmptyState onLog={openLogForm} />}

        <CycleSummaryCards
          cycles={cycles}
          selectedData={selectedData}
          selectedDate={selectedDate}
          onLog={openLogForm}
          onSelectCycle={selectCycleDate}
        />
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

      {selectedData && (
        <CycleInsightsPanel
          apiLoading={apiLoading}
          healthInsights={healthInsights}
          nutritionSuggestion={nutritionSuggestion}
        />
      )}

      <PublicFooter />
    </div>
  );
}
