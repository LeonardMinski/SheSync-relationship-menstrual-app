"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { MoodIcon } from "@/components/home/MoodIcon";
import { DAILY_MOOD_OPTIONS } from "@/features/home/dailyCheckIn";
import { saveDailyCheckIn, upsertDailyMood } from "@/services/cycle/dailyMood";
import type { CycleEntry } from "@/types/cycle";

/**
 * "How's your day been?" — the lightweight, every-day check-in. Default
 * interaction is one tap: pick a feeling, it saves immediately as the
 * canonical daily mood (see services/cycle/dailyMood.ts). "Add more
 * context" is an optional secondary reveal for energy/sleep/stress/a note —
 * never required, and this is NOT the structured menstrual Period Log
 * (bleeding/cramps/etc. — see /cycle for that).
 */
export function DailyCheckIn({
  date,
  hasActivePeriodToday,
  todaysEntry,
  onSaved,
}: {
  date: string;
  hasActivePeriodToday: boolean;
  todaysEntry: CycleEntry | null;
  onSaved: (entry: CycleEntry) => void;
}) {
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [energy, setEnergy] = useState(todaysEntry?.energy ?? 5);
  const [stress, setStress] = useState(todaysEntry?.stress ?? 5);
  const [sleep, setSleep] = useState(todaysEntry?.sleep ?? 5);
  const [notes, setNotes] = useState(todaysEntry?.notes ?? "");
  const [savingContext, setSavingContext] = useState(false);

  async function handleTapMood(value: number) {
    setSaving(value);
    setError(null);
    const result = await upsertDailyMood({ date, mood: value, hasActivePeriodToday });
    setSaving(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onSaved(result.data);
  }

  async function handleSaveContext() {
    const mood = todaysEntry?.mood ?? DAILY_MOOD_OPTIONS[2].value;
    setSavingContext(true);
    setError(null);
    const result = await saveDailyCheckIn({
      date,
      mood,
      energy,
      stress,
      sleep,
      notes: notes.trim(),
      hasActivePeriodToday,
    });
    setSavingContext(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onSaved(result.data);
    setShowContext(false);
  }

  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
        How&apos;s your day been?
      </h2>

      {error && (
        <p role="alert" className="mt-2 text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-3 grid grid-cols-5 gap-2">
        {DAILY_MOOD_OPTIONS.map(({ label, value }) => {
          const isSelected = todaysEntry?.mood === value;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={isSelected}
              aria-label={label}
              onClick={() => void handleTapMood(value)}
              disabled={saving !== null}
              className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start disabled:opacity-60 ${
                isSelected
                  ? "border-[color:var(--accent-rose)] bg-[color:var(--accent-rose)]/15 text-[color:var(--accent-rose)]"
                  : "border-border bg-bg-surface text-foreground hover:border-cta-start/40"
              }`}
            >
              <MoodIcon label={label} className="h-6 w-6" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowContext((current) => !current)}
          aria-expanded={showContext}
          className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
        >
          Add more context
          {showContext ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {showContext && (
        <div className="mt-3 space-y-4 rounded-2xl border border-border bg-bg-surface p-4">
          <ContextSlider label="Energy" value={energy} onChange={setEnergy} />
          <ContextSlider label="Stress" value={stress} onChange={setStress} />
          <ContextSlider label="Sleep" value={sleep} onChange={setSleep} />
          <div>
            <label
              htmlFor="daily-checkin-note"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground"
            >
              Note (optional)
            </label>
            <textarea
              id="daily-checkin-note"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Anything else about today..."
              className="w-full rounded-lg border border-border bg-bg-elevated p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={handleSaveContext} loading={savingContext}>
            Save context
          </Button>
        </div>
      )}
    </div>
  );
}

function ContextSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-2 flex items-baseline justify-between text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <span>{value}/10</span>
      </label>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-border"
        aria-label={`${label}, ${value} out of 10`}
      />
    </div>
  );
}
