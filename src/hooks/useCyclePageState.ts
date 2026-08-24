"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useCycleLogger } from "@/hooks/useCycleLogger";
import {
  getHealthInsights,
  getNutritionSuggestion,
} from "@/services/cycle/insights";
import type {
  HealthInsight,
  NutritionSuggestion,
} from "@/services/cycle/insights";
import type { CycleEntry, CycleLogFormState } from "@/types";
import {
  defaultCycleLogFormState,
  findCycleForDate,
  toCycleLogFormState,
  toCycleLogPayload,
} from "@/features/cycle/cycle.utils";

export function useCyclePageState() {
  const { user, loading: authLoading } = useAuth();
  const {
    cycles,
    fetchCycles,
    logCycle,
    loading: cycleLoading,
    error: cycleError,
    clearError,
  } = useCycleLogger();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showLogForm, setShowLogForm] = useState(false);
  const [formState, setFormState] =
    useState<CycleLogFormState>(defaultCycleLogFormState);
  const [logging, setLogging] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [healthInsights, setHealthInsights] = useState<HealthInsight[]>([]);
  const [nutritionSuggestion, setNutritionSuggestion] =
    useState<NutritionSuggestion | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const selectedData = findCycleForDate(cycles, selectedDate);

  useEffect(() => {
    if (user && !authLoading) {
      void fetchCycles();
    }
  }, [user, authLoading, fetchCycles]);

  useEffect(() => {
    if (!selectedData) {
      setHealthInsights([]);
      setNutritionSuggestion(null);
      setApiLoading(false);
      return;
    }

    const loadInsights = async () => {
      setApiLoading(true);
      try {
        const [insights, nutrition] = await Promise.all([
          getHealthInsights(selectedData.phase, selectedData.symptoms),
          getNutritionSuggestion(selectedData.phase, selectedData.mood),
        ]);

        setHealthInsights(insights);
        setNutritionSuggestion(nutrition);
      } catch (error) {
        console.error("Error loading insights:", error);
      } finally {
        setApiLoading(false);
      }
    };

    void loadInsights();
  }, [selectedData]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  const updateFormState = (updates: Partial<CycleLogFormState>) => {
    setFormError(null);
    setFormState((current) => ({ ...current, ...updates }));
  };

  const resetForm = () => {
    setFormState(defaultCycleLogFormState);
    setFormError(null);
  };

  const openLogForm = () => {
    setFormState(toCycleLogFormState(selectedData));
    setFormError(null);
    setShowLogForm(true);
  };

  const closeLogForm = () => {
    setShowLogForm(false);
  };

  const handleLogCycle = async () => {
    if (!user) return;

    setLogging(true);
    try {
      const payload = toCycleLogPayload({
        selectedDate,
        selectedData,
        formState,
      });

      if (!payload) {
        setFormError("Choose a cycle phase before saving this entry.");
        return;
      }

      const success = await logCycle(payload);

      if (success) {
        setShowLogForm(false);
        resetForm();
      }
    } catch (error) {
      console.error("[cycle-page] failed to log cycle", error);
    } finally {
      setLogging(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setFormError(null);
    setFormState((current) => ({
      ...current,
      symptoms: current.symptoms.includes(symptom)
        ? current.symptoms.filter((item) => item !== symptom)
        : [...current.symptoms, symptom],
    }));
  };

  const selectCycleDate = (cycle: CycleEntry) => {
    setSelectedDate(new Date(cycle.date));
  };

  return {
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
  };
}
