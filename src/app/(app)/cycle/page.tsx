"use client";

import { format } from "date-fns";

import { CycleEmptyState } from "@/components/cycle/CycleEmptyState";
import { CycleInsightsPanel } from "@/components/cycle/CycleInsightsPanel";
import { CycleIntro } from "@/components/cycle/CycleIntro";
import { CycleLogDialog } from "@/components/cycle/CycleLogDialog";
import { CycleSummaryCards } from "@/components/cycle/CycleSummaryCards";
import { TopNavbar } from "@/components/layout/TopNavbar";
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
    saveSuccess,
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
          className="h-8 w-8 motion-reduce:animate-none animate-spin rounded-full border-b-2 border-cta-start"
          aria-label="Loading cycle logger"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg pb-10">
      <TopNavbar
        title={selectedData ? `${selectedData.phase} phase` : "Cycle log"}
        subtitle={format(selectedDate, "EEEE, MMMM d")}
      />

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <CycleIntro hasEntry={Boolean(selectedData)} onLog={openLogForm} />

        {saveSuccess && (
          <div
            role="status"
            className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-semibold text-success"
          >
            Today&apos;s log saved
          </div>
        )}

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
    </div>
  );
}
