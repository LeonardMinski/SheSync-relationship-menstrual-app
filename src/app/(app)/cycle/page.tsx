"use client";

import { useState } from "react";
import { format } from "date-fns";

import { TopNavbar } from "@/components/layout/TopNavbar";
import { ActivePeriodView } from "@/components/period/ActivePeriodView";
import { LogPeriodDayDialog } from "@/components/period/LogPeriodDayDialog";
import { NoActivePeriodView } from "@/components/period/NoActivePeriodView";
import { PeriodHistorySection } from "@/components/period/PeriodHistorySection";
import { useAuth } from "@/context/AuthContext";
import { usePeriodPageState } from "@/hooks/usePeriodPageState";

export default function CyclePage() {
  const { user, loading: authLoading } = useAuth();

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

  if (authLoading) {
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
      <TopNavbar title="Cycle" subtitle={format(new Date(), "EEEE, MMMM d")} />

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
      </main>

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
    </div>
  );
}
