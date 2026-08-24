import { format } from "date-fns";

import type {
  CycleEntry,
  CycleLogFormState,
  CyclePhase,
  LogCycleData,
} from "@/types/cycle";

export const symptomOptions = [
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

const phaseMarkers: Record<CyclePhase, string> = {
  menstrual: "M",
  follicular: "F",
  ovulation: "O",
  luteal: "L",
};

export const defaultCycleLogFormState: CycleLogFormState = {
  phase: "",
  mood: 5,
  energy: 5,
  libido: 5,
  stress: 5,
  symptoms: [],
  notes: "",
};

export function toCycleDateKey(date: string | number | Date) {
  return format(new Date(date), "yyyy-MM-dd");
}

export function findCycleForDate(cycles: CycleEntry[], selectedDate: Date) {
  const selectedDateKey = toCycleDateKey(selectedDate);
  return cycles.find((cycle) => toCycleDateKey(cycle.date) === selectedDateKey);
}

export function toCycleLogFormState(entry?: CycleEntry): CycleLogFormState {
  return {
    phase: entry?.phase ?? defaultCycleLogFormState.phase,
    mood: entry?.mood ?? defaultCycleLogFormState.mood,
    energy: entry?.energy ?? defaultCycleLogFormState.energy,
    libido: entry?.libido ?? defaultCycleLogFormState.libido,
    stress: entry?.stress ?? defaultCycleLogFormState.stress,
    symptoms: entry?.symptoms ?? defaultCycleLogFormState.symptoms,
    notes: entry?.notes ?? defaultCycleLogFormState.notes,
  };
}

export function toCycleLogPayload({
  selectedDate,
  selectedData,
  formState,
}: {
  selectedDate: Date;
  selectedData?: CycleEntry;
  formState: CycleLogFormState;
}): LogCycleData | null {
  const phase = formState.phase || selectedData?.phase;

  if (!phase) {
    return null;
  }

  return {
    date: toCycleDateKey(selectedDate),
    phase,
    mood: formState.mood,
    energy: formState.energy,
    libido: formState.libido,
    stress: formState.stress,
    symptoms: formState.symptoms,
    notes: formState.notes,
  };
}

export function getRecentCycleEntries(cycles: CycleEntry[], limit = 5) {
  return cycles.slice(0, limit);
}

export function getPhaseMarker(phase?: CyclePhase | null) {
  if (!phase) {
    return null;
  }

  return phaseMarkers[phase];
}
