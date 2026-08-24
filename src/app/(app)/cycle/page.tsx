"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar,
  TrendingUp,
  Heart,
  Zap,
  Brain,
  Plus,
  Droplet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCycleLogger } from "@/hooks/useCycleLogger";
import { TopNavbar } from "@/components/layout/Navbar";
import { Navbar } from "@/components/layout/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getPhaseEmoji } from "@/utils/mockData";
import {
  getHealthInsights,
  getNutritionSuggestion,
  API_FALLBACKS,
} from "@/services/cycle/insights";
import type {
  HealthInsight,
  NutritionSuggestion,
} from "@/services/cycle/insights";

export default function CyclePage() {
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
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [libido, setLibido] = useState(5);
  const [stress, setStress] = useState(5);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [logging, setLogging] = useState(false);
  const [healthInsights, setHealthInsights] = useState<HealthInsight[]>([]);
  const [nutritionSuggestion, setNutritionSuggestion] =
    useState<NutritionSuggestion | null>(null);
  const [apiLoading, setApiLoading] = useState(true);

  // Get selected date's cycle data
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedData = cycles.find((cycle) => {
    const cycleDateStr = format(cycle.date, "yyyy-MM-dd");
    return cycleDateStr === selectedDateStr;
  });

  useEffect(() => {
    if (user && !authLoading) {
      fetchCycles();
    }
  }, [user, authLoading, fetchCycles]);

  // Load API insights for selected date
  useEffect(() => {
    const loadInsights = async () => {
      if (!selectedData) return;

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

    loadInsights();
  }, [selectedData]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  const handleLogCycle = async () => {
    if (!user) return;

    setLogging(true);
    try {
      const success = await logCycle({
        date: selectedDateStr,
        phase: selectedData?.phase || "follicular",
        mood,
        energy,
        libido,
        stress,
        symptoms,
        notes,
      });

      if (success) {
        setShowLogForm(false);
        // Reset form
        setMood(5);
        setEnergy(5);
        setLibido(5);
        setStress(5);
        setSymptoms([]);
        setNotes("");
      }
    } catch (error) {
      console.error("[cycle-page] failed to log cycle", error);
    } finally {
      setLogging(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom],
    );
  };

  const openLogForm = () => {
    setMood(selectedData?.mood ?? 5);
    setEnergy(selectedData?.energy ?? 5);
    setLibido(selectedData?.libido ?? 5);
    setStress(selectedData?.stress ?? 5);
    setSymptoms(selectedData?.symptoms ?? []);
    setNotes(selectedData?.notes ?? "");
    setShowLogForm(true);
  };

  const symptomOptions = [
    "Cramps",
    "Bloating",
    "Headache",
    "Fatigue",
    "Mood swings",
    "Breast tenderness",
    "Acne",
    "Food cravings",
    "Insomnia",
  ];

  if (authLoading || cycleLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cta-start"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg pb-10">
      <TopNavbar
        title="Day 14 · Follicular Phase"
        subtitle={format(selectedDate, "EEEE, MMMM d")}
        showNotifications
      />

      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <section className="rounded-[2rem] border border-border bg-bg-surface px-5 py-8 text-center shadow-md sm:px-8 md:py-10">
          <div className="mx-auto max-w-2xl space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
              How are you feeling today?
            </h1>
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
              Log your daily metrics to discover personal insights.
            </p>
          </div>

          <Button
            variant="cta"
            size="lg"
            onClick={openLogForm}
            className="mx-auto mt-7 w-full max-w-xs"
          >
            <Plus className="h-5 w-5" />
            {selectedData ? "Edit Log" : "Log Today"}
          </Button>
        </section>

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

        {/* No Cycle Data CTA */}
        {cycles.length === 0 && (
          <Card className="py-8 text-center">
            <CardContent>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cta-start">
                <Calendar className="h-8 w-8 text-[color:var(--cta-foreground)]" />
              </div>
              <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
                Start Tracking Your Cycle
              </h2>
              <p className="mx-auto mb-6 max-w-md text-center leading-relaxed text-muted-foreground">
                Log your first cycle entry to begin your wellness journey.
              </p>
              <div className="mx-auto flex max-w-md flex-col justify-center gap-3 sm:flex-row">
                <Button
                  variant="cta"
                  size="lg"
                  onClick={openLogForm}
                  className="flex-1"
                >
                  <Plus className="h-5 w-5" />
                  Log Period
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={openLogForm}
                  className="flex-1"
                >
                  <Droplet className="h-5 w-5" />
                  Log Symptoms
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Date Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-center sm:justify-start sm:text-left">
              <Calendar className="h-5 w-5 text-cta-start" />
              {format(selectedDate, "MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 text-center sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:text-left">
              <div className="min-w-0">
                <div className="text-2xl font-bold capitalize text-foreground">
                  {selectedData ? getPhaseEmoji(selectedData.phase) : "🌙"}{" "}
                  {selectedData?.phase || "No data"}
                </div>
                <CardDescription>
                  {selectedData
                    ? "Entry logged for this date"
                    : "No data logged for this date"}
                </CardDescription>
              </div>
              <div className="rounded-2xl bg-bg-elevated px-5 py-3 text-center">
                <div className="text-sm text-muted-foreground">Mood</div>
                <div className="text-lg font-semibold text-foreground">
                  {selectedData?.mood || "—"}/10
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={openLogForm}
                className="mx-auto w-full max-w-xs sm:w-auto"
              >
                {selectedData ? "Edit Entry" : "Add Entry"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-bg-elevated p-2">
                  <Heart className="h-5 w-5 text-[color:var(--accent-peach)]" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Energy</div>
                  <div className="text-lg font-semibold text-foreground">
                    {selectedData?.energy || "—"}/10
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent-purple/10">
                  <Zap className="h-5 w-5 text-accent-purple" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Libido</div>
                  <div className="text-lg font-semibold text-foreground">
                    {selectedData?.libido || "—"}/10
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Brain className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Stress</div>
                  <div className="text-lg font-semibold text-foreground">
                    {selectedData?.stress || "—"}/10
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Droplet className="h-5 w-5 text-info" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Symptoms</div>
                  <div className="text-lg font-semibold text-foreground">
                    {selectedData?.symptoms?.length || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Symptoms List */}
        {selectedData?.symptoms && selectedData.symptoms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Symptoms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedData.symptoms.map((symptom, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-bg-elevated px-3 py-1 text-sm font-semibold text-[color:var(--accent-peach)]"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {selectedData?.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{selectedData.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
            <CardDescription>Your last 5 cycle entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cycles.slice(0, 5).map((cycle, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-bg-elevated rounded-lg cursor-pointer hover:bg-bg-muted transition-colors"
                  onClick={() => setSelectedDate(new Date(cycle.date))}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {getPhaseEmoji(cycle.phase)}
                    </span>
                    <div>
                      <div className="font-medium text-foreground">
                        {format(new Date(cycle.date), "MMM d")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {cycle.phase} • Mood: {cycle.mood}/10
                      </div>
                    </div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log Cycle Modal */}
      {showLogForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                Log Entry for {format(selectedDate, "MMM d")}
              </CardTitle>
              <CardDescription>
                Track your mood, energy, and symptoms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mood Slider */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mood: {mood}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={mood}
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Energy Slider */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Energy: {energy}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Libido Slider */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Libido: {libido}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={libido}
                  onChange={(e) => setLibido(Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Stress Slider */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Stress: {stress}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stress}
                  onChange={(e) => setStress(Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Symptoms
                </label>
                <div className="flex flex-wrap gap-2">
                  {symptomOptions.map((symptom) => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        symptoms.includes(symptom)
                          ? "bg-cta-start text-[color:var(--cta-foreground)]"
                          : "bg-bg-elevated text-foreground border border-border"
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How are you feeling today?"
                  className="w-full rounded-lg border border-border bg-bg-surface p-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowLogForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="cta"
                  onClick={handleLogCycle}
                  loading={logging}
                  className="flex-1"
                >
                  {logging ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Insights Section */}
      {selectedData && (
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-10">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-cta-start" />
                Mood & Symptoms Tips
              </CardTitle>
              <CardDescription>
                Personalized recommendations based on your cycle data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 rounded bg-bg-muted"></div>
                  <div className="h-4 w-3/4 rounded bg-bg-muted"></div>
                  <div className="h-4 w-1/2 rounded bg-bg-muted"></div>
                </div>
              ) : (
                <>
                  {healthInsights.length > 0 ? (
                    <div className="space-y-2">
                      {healthInsights.map((insight, index) => (
                        <div
                          key={index}
                          className="rounded-lg bg-bg-elevated p-3"
                        >
                          <div className="mb-1 text-sm font-medium capitalize text-foreground">
                            {insight.type} Tip
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {insight.tip}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {API_FALLBACKS.healthInsights}
                    </div>
                  )}

                  {nutritionSuggestion ? (
                    <div className="rounded-lg bg-bg-elevated p-3">
                      <div className="mb-1 text-sm font-medium text-foreground">
                        Wellness Suggestion
                      </div>
                      <div className="mb-1 text-sm font-medium text-foreground">
                        {nutritionSuggestion.food}
                      </div>
                      <div className="mb-2 text-sm text-muted-foreground">
                        {nutritionSuggestion.reason}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {nutritionSuggestion.benefits.map((benefit, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-bg-elevated px-2 py-1 text-xs text-[color:var(--accent-peach)]"
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {API_FALLBACKS.nutrition}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Navbar />
    </div>
  );
}
