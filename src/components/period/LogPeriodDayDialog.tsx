"use client";

import { useState } from "react";
import { format } from "date-fns";

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
            <FieldGroup title="Flow">
              <PillField
                label="Bleeding level"
                options={BLEEDING_LEVELS}
                value={form.bleedingLevel}
                onChange={(bleedingLevel) => update({ bleedingLevel })}
              />
              <NullablePillField
                label="Bleeding colour"
                options={BLEEDING_COLOURS}
                value={form.bleedingColour}
                onChange={(bleedingColour) => update({ bleedingColour })}
              />
              <PillField
                label="Clots"
                options={CLOT_LEVELS}
                value={form.clots}
                onChange={(clots) => update({ clots })}
              />
            </FieldGroup>

            <FieldGroup title="Pain & Head">
              <SliderField
                label="Cramps"
                value={form.cramps}
                onChange={(cramps) => update({ cramps })}
              />
              <SliderField
                label="Lower-back pain"
                value={form.lowerBackPain}
                onChange={(lowerBackPain) => update({ lowerBackPain })}
              />
              <PillField
                label="Headache / migraine"
                options={SEVERITY_LEVELS}
                value={form.headache}
                onChange={(headache) => update({ headache })}
              />
            </FieldGroup>
          </div>

          {/* CENTRE: Body */}
          <div className="space-y-6">
            <FieldGroup title="Body">
              <PillField
                label="Bloating"
                options={SEVERITY_LEVELS}
                value={form.bloating}
                onChange={(bloating) => update({ bloating })}
              />
              <SliderField
                label="Fatigue"
                value={form.fatigue}
                onChange={(fatigue) => update({ fatigue })}
              />
              <PillField
                label="Nausea"
                options={SEVERITY_LEVELS}
                value={form.nausea}
                onChange={(nausea) => update({ nausea })}
              />
              <PillField
                label="Bowel changes"
                options={BOWEL_CHANGES}
                value={form.bowelChanges}
                onChange={(bowelChanges) => update({ bowelChanges })}
              />
            </FieldGroup>
          </div>

          {/* RIGHT: Wellness, Management & Notes */}
          <div className="space-y-6">
            <FieldGroup title="Wellness">
              <NumberCircleField
                label="Sleep quality"
                value={form.sleepQuality}
                min={1}
                max={5}
                onChange={(sleepQuality) => update({ sleepQuality })}
                allowNone
              />
              <NumberCircleField
                label="Mood today"
                value={form.mood}
                min={1}
                max={10}
                onChange={(mood) => update({ mood: mood ?? form.mood })}
              />
            </FieldGroup>

            <FieldGroup title="Management &amp; Notes">
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
                      className={`min-h-[36px] rounded-full px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start ${
                        form.painReliefOption === option
                          ? "bg-cta-start text-[color:var(--cta-foreground)]"
                          : "border border-border bg-bg-elevated text-foreground"
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
            <Button variant="cta" onClick={handleSave} loading={saving}>
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-border bg-bg-surface p-4">
      <h3 className="mb-4 text-sm font-bold text-foreground">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function PillField<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
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
            className={`min-h-[36px] rounded-full px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start ${
              value === option.value
                ? "bg-cta-start text-[color:var(--cta-foreground)]"
                : "border border-border bg-bg-elevated text-foreground"
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
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T | null) => void;
}) {
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
            className={`min-h-[36px] rounded-full px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start ${
              value === option.value
                ? "bg-cta-start text-[color:var(--cta-foreground)]"
                : "border border-border bg-bg-elevated text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderField({
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
        <span className="text-foreground">{value}/10</span>
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
    </div>
  );
}

function NumberCircleField({
  label,
  value,
  min,
  max,
  onChange,
  allowNone = false,
}: {
  label: string;
  value: number | null;
  min: number;
  max: number;
  onChange: (value: number | null) => void;
  allowNone?: boolean;
}) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

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
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start ${
              value === option
                ? "bg-cta-start text-[color:var(--cta-foreground)]"
                : "border border-border bg-bg-elevated text-foreground"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
