"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import {
  endPeriod as endPeriodRequest,
  getActivePeriod,
  getPeriodHistory,
  startPeriod as startPeriodRequest,
  upsertPeriodDayLog,
} from "@/services/period";
import type {
  Period,
  PeriodDayLog,
  PeriodSummary,
  UpsertPeriodDayLogInput,
} from "@/types/period";

export function usePeriodPageState() {
  const { user, loading: authLoading } = useAuth();

  const [activePeriod, setActivePeriod] = useState<Period | null>(null);
  const [todayLog, setTodayLog] = useState<PeriodDayLog | null>(null);
  const [history, setHistory] = useState<PeriodSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const [activeResult, historyResult] = await Promise.all([
      getActivePeriod(),
      getPeriodHistory(),
    ]);

    if (activeResult.success) {
      setActivePeriod(activeResult.data.active);
      setTodayLog(activeResult.data.todayLog);
    } else {
      setLoadError(activeResult.error);
    }

    if (historyResult.success) {
      setHistory(historyResult.data);
    } else if (activeResult.success) {
      // Only surface the history error if loading the active period already
      // succeeded — otherwise the single active-period error is clearer.
      setLoadError(historyResult.error);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    void loadAll();
  }, [user, authLoading, loadAll]);

  const startPeriod = useCallback(
    async (startDate?: string) => {
      setStarting(true);
      setActionError(null);
      setSuccessMessage(null);

      const result = await startPeriodRequest(startDate ? { startDate } : {});
      setStarting(false);

      if (!result.success) {
        setActionError(result.error);
        return false;
      }

      setSuccessMessage("Period started");
      await loadAll();
      return true;
    },
    [loadAll],
  );

  const endPeriod = useCallback(
    async (endDate?: string) => {
      if (!activePeriod) return false;

      setEnding(true);
      setActionError(null);
      setSuccessMessage(null);

      const result = await endPeriodRequest(
        activePeriod.id,
        endDate ? { endDate } : {},
      );
      setEnding(false);

      if (!result.success) {
        setActionError(result.error);
        return false;
      }

      setSuccessMessage("Period ended");
      await loadAll();
      return true;
    },
    [activePeriod, loadAll],
  );

  const saveDayLog = useCallback(
    async (input: UpsertPeriodDayLogInput) => {
      const isUpdate = Boolean(todayLog);
      setSavingLog(true);
      setActionError(null);
      setSuccessMessage(null);

      const result = await upsertPeriodDayLog(input);
      setSavingLog(false);

      if (!result.success) {
        setActionError(result.error);
        return false;
      }

      setSuccessMessage(isUpdate ? "Day updated" : "Day saved");
      await loadAll();
      return true;
    },
    [loadAll, todayLog],
  );

  const clearActionError = useCallback(() => setActionError(null), []);
  const clearSuccessMessage = useCallback(() => setSuccessMessage(null), []);

  return {
    user,
    authLoading,
    loading,
    loadError,
    activePeriod,
    todayLog,
    history,
    starting,
    ending,
    savingLog,
    actionError,
    successMessage,
    startPeriod,
    endPeriod,
    saveDayLog,
    clearActionError,
    clearSuccessMessage,
    refresh: loadAll,
  };
}
