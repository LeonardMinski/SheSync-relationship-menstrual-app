import { format } from "date-fns";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { symptomOptions } from "@/features/cycle/cycle.utils";
import { cn } from "@/utils/cn";
import type { CycleLogFormState } from "@/types";
import type { CyclePhase } from "@/types/cycle";

interface CycleLogDialogProps {
  error?: string | null;
  formState: CycleLogFormState;
  logging: boolean;
  selectedDate: Date;
  onCancel: () => void;
  onSave: () => void;
  onToggleSymptom: (symptom: string) => void;
  onUpdate: (updates: Partial<CycleLogFormState>) => void;
}

export function CycleLogDialog({
  error,
  formState,
  logging,
  selectedDate,
  onCancel,
  onSave,
  onToggleSymptom,
  onUpdate,
}: CycleLogDialogProps) {
  return (
    <Modal
      title={`Log Entry for ${format(selectedDate, "MMM d")}`}
      onClose={onCancel}
    >
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Track your mood, energy, and symptoms
        </p>

        {error && (
          <div
            className="rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-sm text-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="cycle-phase"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Cycle phase
          </label>
          <select
            id="cycle-phase"
            required
            value={formState.phase}
            onChange={(event) =>
              onUpdate({ phase: event.target.value as CyclePhase | "" })
            }
            className="w-full rounded-lg border border-border bg-bg-surface p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
          >
            <option value="">Choose phase</option>
            <option value="menstrual">Menstrual</option>
            <option value="follicular">Follicular</option>
            <option value="ovulation">Ovulation</option>
            <option value="luteal">Luteal</option>
          </select>
        </div>

        <RangeField
          label="Mood"
          value={formState.mood}
          tone="rose"
          onChange={(mood) => onUpdate({ mood })}
        />
        <RangeField
          label="Energy"
          value={formState.energy}
          tone="amber"
          onChange={(energy) => onUpdate({ energy })}
        />
        <RangeField
          label="Desire"
          value={formState.libido}
          tone="rose"
          onChange={(libido) => onUpdate({ libido })}
        />
        <RangeField
          label="Stress"
          value={formState.stress}
          tone="sage"
          onChange={(stress) => onUpdate({ stress })}
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Symptoms
          </label>
          <div className="flex flex-wrap gap-2">
            {symptomOptions.map((symptom) => (
              <button
                key={symptom}
                type="button"
                aria-pressed={formState.symptoms.includes(symptom)}
                onClick={() => onToggleSymptom(symptom)}
                className={`inline-flex min-h-[44px] items-center rounded-full px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start ${
                  formState.symptoms.includes(symptom)
                    ? "bg-cta-start text-[color:var(--cta-foreground)]"
                    : "border border-border bg-bg-elevated text-foreground"
                }`}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="cycle-notes"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Notes (optional)
          </label>
          <textarea
            id="cycle-notes"
            value={formState.notes}
            onChange={(event) => onUpdate({ notes: event.target.value })}
            placeholder="How are you feeling today?"
            className="w-full rounded-lg border border-border bg-bg-surface p-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="cta"
            onClick={onSave}
            loading={logging}
            className="flex-1"
          >
            {logging ? "Saving..." : "Save check-in"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const RANGE_TONE_CLASSES: Record<"rose" | "sage" | "amber", string> = {
  rose: "bg-[color:var(--accent-rose)]",
  sage: "bg-[color:var(--accent-sage)]",
  amber: "bg-[color:var(--accent-amber)]",
};

function RangeField({
  label,
  value,
  tone = "rose",
  onChange,
}: {
  label: string;
  value: number;
  tone?: "rose" | "sage" | "amber";
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-2 flex items-baseline justify-between text-sm font-medium text-foreground">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}/10</span>
      </label>
      {/* Real, fully keyboard/screen-reader operable range input — this is
          the field of record. The segmented bar beneath it is a purely
          decorative, aria-hidden restatement of the same live value. */}
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-border"
        aria-label={`${label}, ${value} out of 10`}
      />
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < value ? RANGE_TONE_CLASSES[tone] : "bg-bg-elevated",
            )}
          />
        ))}
      </div>
    </div>
  );
}
