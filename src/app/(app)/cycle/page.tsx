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
    <div className="min-h-screen bg-bg pb-20">
      <TopNavbar
        title="Cycle Tracking"
        subtitle={format(selectedDate, "EEEE, MMMM d")}
        showNotifications={false}
        showThemeToggle={true}
        showMeeting={false}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {cycleError && (
          <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
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
          <Card className="text-center py-8">
            <CardContent>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-cta-start to-cta-end flex items-center justify-center">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Start Tracking Your Cycle
              </h2>
              <p className="text-muted mb-6">
                Log your first cycle entry to begin your wellness journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="cta"
                  size="lg"
                  onClick={() => setShowLogForm(true)}
                >
                  <Plus className="h-5 w-5" />
                  Log Period
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setShowLogForm(true)}
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
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cta-start" />
              {format(selectedDate, "MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {selectedData ? getPhaseEmoji(selectedData.phase) : "🌙"}{" "}
                  {selectedData?.phase || "No data"}
                </div>
                <CardDescription>
                  {selectedData
                    ? "Entry logged for this date"
                    : "No data logged for this date"}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Mood</div>
                <div className="text-lg font-semibold text-foreground">
                  {selectedData?.mood || "—"}/10
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent-rose/10">
                  <Heart className="h-5 w-5 text-accent-rose" />
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
                    className="px-3 py-1 bg-accent-rose/10 text-accent-rose rounded-full text-sm"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
                          ? "bg-cta-start text-white"
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
                  className="w-full p-3 border border-border rounded-lg bg-bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
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
                <div className="h-4 bg-bg-muted rounded"></div>
                <div className="h-4 bg-bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-bg-muted rounded w-1/2"></div>
              </div>
            ) : (
              <>
                {/* Health Insights */}
                {healthInsights.length > 0 ? (
                  <div className="space-y-2">
                    {healthInsights.map((insight, index) => (
                      <div
                        key={index}
                        className="p-3 bg-bg-elevated rounded-lg"
                      >
                        <div className="text-sm font-medium text-foreground capitalize mb-1">
                          {insight.type} Tip
                        </div>
                        <div className="text-sm text-muted">{insight.tip}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted">
                    {API_FALLBACKS.healthInsights}
                  </div>
                )}

                {/* Wellness Suggestion */}
                {nutritionSuggestion ? (
                  <div className="p-3 bg-bg-elevated rounded-lg">
                    <div className="text-sm font-medium text-foreground mb-1">
                      Wellness Suggestion
                    </div>
                    <div className="text-sm font-medium text-foreground mb-1">
                      {nutritionSuggestion.food}
                    </div>
                    <div className="text-sm text-muted mb-2">
                      {nutritionSuggestion.reason}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {nutritionSuggestion.benefits.map((benefit, index) => (
                        <span
                          key={index}
                          className="text-xs bg-accent-rose/10 text-accent-rose px-2 py-1 rounded-full"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted">
                    {API_FALLBACKS.nutrition}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Navbar />
    </div>
  );
}
