"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  Droplet,
  FolderClosed,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type {
  ActivityImpact,
  BleedingColour,
  BleedingLevel,
  BowelChange,
  ClotLevel,
  PeriodDayLog,
  SymptomSeverity,
  UpsertPeriodDayLogInput,
} from "@/types/period";

/**
 * Matches the supplied design's per-section colour coding (Flow=rose,
 * Pain & Head=amber, Body=sage, Wellness=blue, Management & Notes=purple)
 * rather than one flat colour everywhere. Uses a soft background + a
 * saturated text/border colour — the same pairing StatusPill already uses
 * safely in both light and dark mode — instead of a solid fill with
 * `--cta-foreground`, which is a DARK colour in dark mode (meant for text
 * on a small bright button) and produces low-contrast, hard-to-read text
 * on a large filled pill or circle.
 */
type FieldTone = "rose" | "amber" | "sage" | "blue" | "purple";

const TONE_STYLES: Record<
  FieldTone,
  { active: string; icon: string; iconBg: string }
> = {
  rose: {
    active:
      "border-[color:var(--accent-rose)] bg-[color:var(--accent-rose)]/15 text-[color:var(--accent-rose)]",
    icon: "text-[color:var(--accent-rose)]",
    iconBg: "bg-[color:var(--accent-rose)]/15",
  },
  amber: {
    active:
      "border-[color:var(--accent-amber)] bg-[color:var(--accent-amber-soft)] text-[color:var(--accent-amber)]",
    icon: "text-[color:var(--accent-amber)]",
    iconBg: "bg-[color:var(--accent-amber-soft)]",
  },
  sage: {
    active:
      "border-[color:var(--accent-sage)] bg-[color:var(--accent-sage-soft)] text-[color:var(--accent-sage)]",
    icon: "text-[color:var(--accent-sage)]",
    iconBg: "bg-[color:var(--accent-sage-soft)]",
  },
  blue: {
    active:
      "border-[color:var(--accent-blue)] bg-[color:var(--accent-blue)]/15 text-[color:var(--accent-blue)]",
    icon: "text-[color:var(--accent-blue)]",
    iconBg: "bg-[color:var(--accent-blue)]/15",
  },
  purple: {
    active:
      "border-[color:var(--accent-purple)] bg-[color:var(--accent-purple)]/15 text-[color:var(--accent-purple)]",
    icon: "text-[color:var(--accent-purple)]",
    iconBg: "bg-[color:var(--accent-purple)]/15",
  },
};

const BLEEDING_LEVELS: { value: BleedingLevel; label: string }[] = [
  { value: "spotting", label: "Spotting" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
];

const BLEEDING_COLOURS: { value: BleedingColour; label: string }[] = [
  { value: "bright_red", label: "Bright red" },
  { value: "dark_red", label: "Dark red" },
  { value: "brown", label: "Brown" },
];

const CLOT_LEVELS: { value: ClotLevel; label: string }[] = [
  { value: "none", label: "None" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const SEVERITY_LEVELS: { value: SymptomSeverity; label: string }[] = [
  { value: "none", label: "None" },
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];

const BOWEL_CHANGES: { value: BowelChange; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "loose", label: "Loose" },
  { value: "constipated", label: "Constipated" },
  { value: "more_frequent", label: "More frequent" },
];

const ACTIVITY_IMPACTS: { value: ActivityImpact; label: string }[] = [
  { value: "none", label: "None" },
  { value: "some", label: "Some" },
  { value: "significant", label: "Significant" },
];

const PAIN_RELIEF_OPTIONS = ["None", "Ibuprofen", "Paracetamol", "Other"] as const;

interface FormState {
  bleedingLevel: BleedingLevel;
  bleedingColour: BleedingColour | null;
  clots: ClotLevel;
  cramps: number;
  lowerBackPain: number;
  headache: SymptomSeverity;
  bloating: SymptomSeverity;
  fatigue: number;
  nausea: SymptomSeverity;
  bowelChanges: BowelChange;
  sleepQuality: number | null;
  mood: number;
  painReliefOption: (typeof PAIN_RELIEF_OPTIONS)[number];
  painReliefOtherText: string;
  painReliefTime: string;
  activityImpact: ActivityImpact;
  notes: string;
}

function toFormState(existing?: PeriodDayLog | null): FormState {
  const knownMedication = existing?.pain_relief_medication;
  const painReliefOption: FormState["painReliefOption"] = !existing?.pain_relief_used
    ? "None"
    : knownMedication === "Ibuprofen" || knownMedication === "Paracetamol"
      ? knownMedication
      : "Other";

  return {
    bleedingLevel: existing?.bleeding_level ?? "medium",
    bleedingColour: existing?.bleeding_colour ?? null,
    clots: existing?.clots ?? "none",
    cramps: existing?.cramps ?? 0,
    lowerBackPain: existing?.lower_back_pain ?? 0,
    headache: existing?.headache ?? "none",
    bloating: existing?.bloating ?? "none",
    fatigue: existing?.fatigue ?? 0,
    nausea: existing?.nausea ?? "none",
    bowelChanges: existing?.bowel_changes ?? "normal",
    sleepQuality: existing?.sleep_quality ?? null,
    mood: existing?.mood ?? 5,
    painReliefOption,
    painReliefOtherText: painReliefOption === "Other" ? knownMedication ?? "" : "",
    painReliefTime: existing?.pain_relief_time ?? "",
    activityImpact: existing?.activity_impact ?? "none",
    notes: existing?.notes ?? "",
  };
}

export function LogPeriodDayDialog({
  selectedDate,
  existingLog,
  saving,
  error,
  onCancel,
  onSave,
}: {
  selectedDate: Date;
  existingLog?: PeriodDayLog | null;
  saving: boolean;
  error?: string | null;
  onCancel: () => void;
  onSave: (input: UpsertPeriodDayLogInput) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(existingLog));
  const isUpdate = Boolean(existingLog);

  function update(updates: Partial<FormState>) {
    setForm((current) => ({ ...current, ...updates }));
  }

  function handleSave() {
    const painReliefUsed = form.painReliefOption !== "None";
    const painReliefMedication = !painReliefUsed
      ? null
      : form.painReliefOption === "Other"
        ? form.painReliefOtherText.trim() || null
        : form.painReliefOption;

    onSave({
      date: format(selectedDate, "yyyy-MM-dd"),
      bleedingLevel: form.bleedingLevel,
      bleedingColour: form.bleedingColour,
      clots: form.clots,
      cramps: form.cramps,
      lowerBackPain: form.lowerBackPain,
      headache: form.headache,
      bloating: form.bloating,
      fatigue: form.fatigue,
      nausea: form.nausea,
      bowelChanges: form.bowelChanges,
      sleepQuality: form.sleepQuality,
      mood: form.mood,
      painReliefUsed,
      painReliefMedication,
      painReliefTime: painReliefUsed && form.painReliefTime ? form.painReliefTime : null,
      activityImpact: form.activityImpact,
      notes: form.notes.trim() || null,
    });
  }

  return (
    <Modal
      title={`Log ${format(selectedDate, "EEEE, MMMM d, yyyy")}`}
      onClose={onCancel}
      maxWidthClassName="max-w-5xl"
      overlayClassName="bg-[color:var(--bg)]/95"
      contentClassName="border border-border bg-bg-surface shadow-lg"
    >
      <div className="space-y-6">
        {error && (
          <div
            className="rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-sm text-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT: Flow, Pain & Head */}
          <div className="space-y-6">
            <FieldGroup title="Flow" tone="rose" icon={Droplet}>
              <PillField
                label="Bleeding level"
                options={BLEEDING_LEVELS}
                value={form.bleedingLevel}
                onChange={(bleedingLevel) => update({ bleedingLevel })}
                tone="rose"
              />
              <NullablePillField
                label="Bleeding colour"
                options={BLEEDING_COLOURS}
                value={form.bleedingColour}
                onChange={(bleedingColour) => update({ bleedingColour })}
                tone="rose"
              />
              <PillField
                label="Clots"
                options={CLOT_LEVELS}
                value={form.clots}
                onChange={(clots) => update({ clots })}
                tone="rose"
              />
            </FieldGroup>

            <FieldGroup title="Pain & Head" tone="amber" icon={Zap}>
              <SliderField
                label="Cramps"
                value={form.cramps}
                onChange={(cramps) => update({ cramps })}
                tone="amber"
              />
              <SliderField
                label="Lower-back pain"
                value={form.lowerBackPain}
                onChange={(lowerBackPain) => update({ lowerBackPain })}
                tone="amber"
              />
              <PillField
                label="Headache / migraine"
                options={SEVERITY_LEVELS}
                value={form.headache}
                onChange={(headache) => update({ headache })}
                tone="amber"
              />
            </FieldGroup>
          </div>

          {/* CENTRE: Body */}
          <div className="space-y-6">
            <FieldGroup title="Body" tone="sage" icon={Activity}>
              <PillField
                label="Bloating"
                options={SEVERITY_LEVELS}
                value={form.bloating}
                onChange={(bloating) => update({ bloating })}
                tone="sage"
              />
              <SliderField
                label="Fatigue"
                value={form.fatigue}
                onChange={(fatigue) => update({ fatigue })}
                tone="sage"
              />
              <PillField
                label="Nausea"
                options={SEVERITY_LEVELS}
                value={form.nausea}
                onChange={(nausea) => update({ nausea })}
                tone="sage"
              />
              <PillField
                label="Bowel changes"
                options={BOWEL_CHANGES}
                value={form.bowelChanges}
                onChange={(bowelChanges) => update({ bowelChanges })}
                tone="sage"
              />
            </FieldGroup>
          </div>

          {/* RIGHT: Wellness, Management & Notes */}
          <div className="space-y-6">
            <FieldGroup title="Wellness" tone="blue" icon={Star}>
              <NumberCircleField
                label="Sleep quality"
                value={form.sleepQuality}
                min={1}
                max={5}
                onChange={(sleepQuality) => update({ sleepQuality })}
                tone="blue"
                allowNone
              />
              <NumberCircleField
                label="Mood today"
                value={form.mood}
                min={1}
                max={10}
                onChange={(mood) => update({ mood: mood ?? form.mood })}
                tone="blue"
              />
            </FieldGroup>

            <FieldGroup title="Management &amp; Notes" tone="purple" icon={FolderClosed}>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Pain relief used
                </p>
                <div className="flex flex-wrap gap-2">
                  {PAIN_RELIEF_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={form.painReliefOption === option}
                      onClick={() => update({ painReliefOption: option })}
                      className={`min-h-[36px] rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start ${
                        form.painReliefOption === option
                          ? TONE_STYLES.purple.active
                          : "border-border bg-bg-elevated text-foreground"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {form.painReliefOption !== "None" && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label
                        htmlFor="pain-relief-time"
                        className="mb-1 block text-xs font-semibold text-muted-foreground"
                      >
                        Time taken (optional)
                      </label>
                      <input
                        id="pain-relief-time"
                        type="time"
                        value={form.painReliefTime}
                        onChange={(event) => update({ painReliefTime: event.target.value })}
                        className="w-full rounded-lg border border-border bg-bg-surface p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
                      />
                    </div>

                    {form.painReliefOption === "Other" && (
                      <div>
                        <label
                          htmlFor="pain-relief-other"
                          className="mb-1 block text-xs font-semibold text-muted-foreground"
                        >
                          Other medication
                        </label>
                        <input
                          id="pain-relief-other"
                          type="text"
                          value={form.painReliefOtherText}
                          onChange={(event) => update({ painReliefOtherText: event.target.value })}
                          placeholder="Enter medication"
                          className="w-full rounded-lg border border-border bg-bg-surface p-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <PillField
                label="Impact on normal activity"
                options={ACTIVITY_IMPACTS}
                value={form.activityImpact}
                onChange={(activityImpact) => update({ activityImpact })}
                tone="purple"
              />

              <div>
                <label
                  htmlFor="period-notes"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground"
                >
                  Notes
                </label>
                <textarea
                  id="period-notes"
                  value={form.notes}
                  onChange={(event) => update({ notes: event.target.value })}
                  placeholder="Add anything else you noticed about your period today..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-bg-surface p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
                />
              </div>
            </FieldGroup>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Discard changes
          </button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="cta"
              className="shadow-cta-rose"
              onClick={handleSave}
              loading={saving}
            >
              {saving ? "Saving..." : isUpdate ? "Update Entry" : "Save Entry"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function FieldGroup({
  title,
  tone,
  icon: Icon,
  children,
}: {
  title: string;
  tone: FieldTone;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <section className="rounded-[1.5rem] border border-border bg-bg-surface p-4">
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${styles.iconBg}`}
        >
          <Icon className={`h-4 w-4 ${styles.icon}`} aria-hidden="true" />
        </span>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function PillField<T extends string>({
  label,
  options,
  value,
  onChange,
  tone,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  tone: FieldTone;
}) {
  const activeClass = TONE_STYLES[tone].active;
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`min-h-[36px] rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start ${
              value === option.value
                ? activeClass
                : "border-border bg-bg-elevated text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Same visual treatment as PillField, but the selection is optional — used
 * only for bleedingColour, the sole nullable enum field in this form. */
function NullablePillField<T extends string>({
  label,
  options,
  value,
  onChange,
  tone,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T | null) => void;
  tone: FieldTone;
}) {
  const activeClass = TONE_STYLES[tone].active;
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(value === option.value ? null : option.value)}
            className={`min-h-[36px] rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start ${
              value === option.value
                ? activeClass
                : "border-border bg-bg-elevated text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const SLIDER_FILL_CLASS: Record<FieldTone, string> = {
  rose: "bg-[color:var(--accent-rose)]",
  amber: "bg-[color:var(--accent-amber)]",
  sage: "bg-[color:var(--accent-sage)]",
  blue: "bg-[color:var(--accent-blue)]",
  purple: "bg-[color:var(--accent-purple)]",
};

function SliderField({
  label,
  value,
  onChange,
  tone,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  tone: FieldTone;
}) {
  return (
    <div>
      <label className="mb-2 flex items-baseline justify-between text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <span className={TONE_STYLES[tone].icon}>{value}/10</span>
      </label>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-border"
        aria-label={`${label}, ${value} out of 10`}
      />
      {/* Real range input above is the field of record; this segmented bar
          is a purely decorative, aria-hidden restatement of the same live
          value, matching CycleLogDialog's established slider pattern. */}
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < value ? SLIDER_FILL_CLASS[tone] : "bg-bg-elevated"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function NumberCircleField({
  label,
  value,
  min,
  max,
  onChange,
  tone,
  allowNone = false,
}: {
  label: string;
  value: number | null;
  min: number;
  max: number;
  onChange: (value: number | null) => void;
  tone: FieldTone;
  allowNone?: boolean;
}) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const activeClass = TONE_STYLES[tone].active;

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            aria-label={`${label}: ${option}`}
            onClick={() => onChange(allowNone && value === option ? null : option)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start ${
              value === option
                ? activeClass
                : "border-border bg-bg-elevated text-foreground"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
