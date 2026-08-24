import { format } from "date-fns";

import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { symptomOptions } from "@/features/cycle/cycle.utils";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
      <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto">
        <CardHeader>
          <CardTitle>Log Entry for {format(selectedDate, "MMM d")}</CardTitle>
          <CardDescription>Track your mood, energy, and symptoms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
            onChange={(mood) => onUpdate({ mood })}
          />
          <RangeField
            label="Energy"
            value={formState.energy}
            onChange={(energy) => onUpdate({ energy })}
          />
          <RangeField
            label="Libido"
            value={formState.libido}
            onChange={(libido) => onUpdate({ libido })}
          />
          <RangeField
            label="Stress"
            value={formState.stress}
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
                  onClick={() => onToggleSymptom(symptom)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
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
            <label className="mb-2 block text-sm font-medium text-foreground">
              Notes (optional)
            </label>
            <textarea
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
              {logging ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RangeField({
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
      <label className="mb-2 block text-sm font-medium text-foreground">
        {label}: {value}/10
      </label>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-border"
      />
    </div>
  );
}
