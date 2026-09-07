"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, format, subMonths } from "date-fns";

import { DayDetailPanel } from "@/components/cycle/DayDetailPanel";
import { HistoryCalendar } from "@/components/cycle/HistoryCalendar";
import { MonthlySummary } from "@/components/cycle/MonthlySummary";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { useAuth } from "@/context/AuthContext";
import { findCycleForDate } from "@/features/cycle/cycle.utils";
import { buildMonthGrid, buildMonthlySummary, type HistoryDayCell } from "@/features/cycle/history.utils";
import { useCycleLogger } from "@/hooks/useCycleLogger";
import { usePeriodPageState } from "@/hooks/usePeriodPageState";
import { getPeriodById } from "@/services/period";
import type { PeriodDayLog } from "@/types/period";

export default function CycleHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { cycles, loading: cycleLoading } = useCycleLogger();
  const { activePeriod, history, loading: periodLoading } = usePeriodPageState();

  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [periodLogsByPeriodId, setPeriodLogsByPeriodId] = useState<Record<string, PeriodDayLog[]>>({});
  const [loadingPeriodId, setLoadingPeriodId] = useState<string | null>(null);

  const days = useMemo(
    () => buildMonthGrid({ monthDate, cycles, activePeriod, periodHistory: history }),
    [monthDate, cycles, activePeriod, history],
  );
  const monthlySummary = useMemo(
    () => buildMonthlySummary({ monthDate, cycles, activePeriod, periodHistory: history }),
    [monthDate, cycles, activePeriod, history],
  );
  const selectedDay = days.find((day) => day.dateKey === selectedDateKey) ?? null;

  useEffect(() => {
    if (!selectedDay?.periodId) return;
    if (periodLogsByPeriodId[selectedDay.periodId]) return;

    let active = true;
    setLoadingPeriodId(selectedDay.periodId);
    void getPeriodById(selectedDay.periodId).then((result) => {
      if (!active) return;
      setLoadingPeriodId(null);
      if (result.success) {
        setPeriodLogsByPeriodId((current) => ({ ...current, [selectedDay.periodId as string]: result.data.logs }));
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay?.periodId]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div
          className="h-8 w-8 motion-reduce:animate-none animate-spin rounded-full border-b-2 border-cta-start"
          aria-label="Loading history"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const loading = cycleLoading || periodLoading;

  function selectDay(day: HistoryDayCell) {
    setSelectedDateKey((current) => (current === day.dateKey ? null : day.dateKey));
  }

  const selectedCycleEntry = selectedDay ? findCycleForDate(cycles, new Date(`${selectedDay.dateKey}T00:00:00`)) ?? null : null;
  const selectedPeriodDayLog =
    selectedDay?.periodId && periodLogsByPeriodId[selectedDay.periodId]
      ? periodLogsByPeriodId[selectedDay.periodId].find((log) => log.date === selectedDay.dateKey) ?? null
      : null;

  return (
    <div className="min-h-screen bg-bg pb-10">
      <TopNavbar title="Your History" subtitle={format(new Date(), "EEEE, MMMM d")} />

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div
              className="h-8 w-8 motion-reduce:animate-none animate-spin rounded-full border-b-2 border-cta-start"
              aria-label="Loading history"
            />
          </div>
        ) : (
          <>
            <HistoryCalendar
              monthDate={monthDate}
              days={days}
              selectedDateKey={selectedDateKey}
              onSelectDay={selectDay}
              onPrevMonth={() => {
                setSelectedDateKey(null);
                setMonthDate((current) => subMonths(current, 1));
              }}
              onNextMonth={() => {
                setSelectedDateKey(null);
                setMonthDate((current) => addMonths(current, 1));
              }}
            />

            {selectedDay && (
              <DayDetailPanel
                day={selectedDay}
                cycleEntry={selectedCycleEntry}
                periodDayLog={selectedPeriodDayLog}
                loadingPeriodDetail={loadingPeriodId === selectedDay.periodId && !selectedPeriodDayLog}
              />
            )}

            <MonthlySummary summary={monthlySummary} />
          </>
        )}
      </main>
    </div>
  );
}
