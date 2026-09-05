"use client";

import { useState } from "react";
import { format } from "date-fns";

import { CycleEmptyState } from "@/components/cycle/CycleEmptyState";
import { CycleInsightsPanel } from "@/components/cycle/CycleInsightsPanel";
import { CycleIntro } from "@/components/cycle/CycleIntro";
import { CycleLogDialog } from "@/components/cycle/CycleLogDialog";
import { CycleSummaryCards } from "@/components/cycle/CycleSummaryCards";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { ActivePeriodView } from "@/components/period/ActivePeriodView";
import { LogPeriodDayDialog } from "@/components/period/LogPeriodDayDialog";
import { NoActivePeriodView } from "@/components/period/NoActivePeriodView";
import { PeriodHistorySection } from "@/components/period/PeriodHistorySection";
import { useCyclePageState } from "@/hooks/useCyclePageState";
import { usePeriodPageState } from "@/hooks/usePeriodPageState";

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

  const {
    loading: periodLoading,
    loadError: periodLoadError,
    activePeriod,
    todayLog,
    history,
    starting,
    ending,
    savingLog,
    actionError: periodActionError,
    successMessage: periodSuccessMessage,
    startPeriod,
    endPeriod,
    saveDayLog,
    clearActionError: clearPeriodActionError,
  } = usePeriodPageState();

  const [showPeriodLogDialog, setShowPeriodLogDialog] = useState(false);

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

      <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-6 sm:px-6 lg:px-10">
        {/* --- Period tracking (public.periods / public.period_day_logs) --- */}
        <section className="space-y-4">
          {periodLoadError && (
            <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
              {periodLoadError}
            </div>
          )}

          {periodSuccessMessage && (
            <div
              role="status"
              className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-semibold text-success"
            >
              {periodSuccessMessage}
            </div>
          )}

          {periodActionError && (
            <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
              {periodActionError}
              <button
                type="button"
                onClick={clearPeriodActionError}
                className="ml-2 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {periodLoading ? (
            <div className="flex items-center justify-center py-10">
              <div
                className="h-8 w-8 motion-reduce:animate-none animate-spin rounded-full border-b-2 border-cta-start"
                aria-label="Loading period tracking"
              />
            </div>
          ) : activePeriod ? (
            <ActivePeriodView
              period={activePeriod}
              todayLog={todayLog}
              onLogToday={() => setShowPeriodLogDialog(true)}
              onEndPeriod={() => void endPeriod()}
              ending={ending}
            />
          ) : (
            <NoActivePeriodView
              history={history}
              onStartPeriod={() => void startPeriod()}
              starting={starting}
            />
          )}

          {!periodLoading && <PeriodHistorySection history={history} />}
        </section>

        <div className="border-t border-border" />

        {/* --- Existing daily wellbeing log (public.cycle_data) — unchanged --- */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-foreground">Daily Wellbeing Log</h2>

          <CycleIntro hasEntry={Boolean(selectedData)} onLog={openLogForm} />

          {saveSuccess && (
            <div
              role="status"
              className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-semibold text-success"
            >
              Saved to your private space
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

      {showPeriodLogDialog && (
        <LogPeriodDayDialog
          selectedDate={new Date()}
          existingLog={todayLog}
          saving={savingLog}
          error={periodActionError}
          onCancel={() => setShowPeriodLogDialog(false)}
          onSave={async (input) => {
            const success = await saveDayLog(input);
            if (success) {
              setShowPeriodLogDialog(false);
            }
          }}
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
