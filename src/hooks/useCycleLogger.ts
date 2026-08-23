"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import type { CyclePhase } from "@/types";

export interface CycleEntry {
  id?: string;
  user_id: string;
  date: string;
  phase: CyclePhase;
  mood: number;
  energy: number;
  libido: number;
  stress: number;
  symptoms: string[];
  notes?: string;
  created_at?: string;
}

export interface LogCycleData {
  date?: string;
  phase: CyclePhase;
  mood: number;
  energy?: number;
  libido?: number;
  stress?: number;
  symptoms: string[];
  notes?: string;
}

export const useCycleLogger = () => {
  const { user, session, loading: authLoading } = useAuth();

  const [cycles, setCycles] = useState<CycleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback((): string | null => {
    // Critical: do NOT treat missing session during load as an error
    if (authLoading) return null;

    if (!session?.access_token) {
      console.error("[cycle-logger] no token after auth ready");
      setError("Session expired. Please sign in again.");
      return null;
    }

    return session.access_token;
  }, [authLoading, session]);

  const fetchCycles = useCallback(async (): Promise<void> => {
    if (authLoading) return;

    if (!user) {
      setError("User not authenticated");
      return;
    }

    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/cycle", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("[cycle-logger] fetch failed", json);
        throw new Error(json?.error || "Failed to fetch cycles");
      }

      setCycles(json?.data || []);
    } catch (err) {
      console.error("[cycle-logger] fetchCycles error", err);
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, getToken]);

  const logCycle = useCallback(
    async (data: LogCycleData): Promise<boolean> => {
      if (authLoading) return false;

      if (!user) {
        setError("User not authenticated");
        return false;
      }

      const token = getToken();
      if (!token) return false;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/cycle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          console.error("[cycle-logger] log failed", json);
          throw new Error(json?.error || "Failed to log cycle");
        }

        await fetchCycles();
        return true;
      } catch (err) {
        console.error("[cycle-logger] logCycle error", err);
        setError(err instanceof Error ? err.message : "Log failed");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user, authLoading, fetchCycles, getToken],
  );

  const clearError = () => setError(null);

  return {
    cycles,
    loading,
    error,
    fetchCycles,
    logCycle,
    clearError,
  };
};
