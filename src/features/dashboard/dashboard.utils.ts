import type { DashboardCycleLog } from "@/types/dashboard";

export interface DashboardSummary {
  todaysLog?: DashboardCycleLog;
  latestLog?: DashboardCycleLog;
  phaseLabel: string | null;
  cycleDay: number | null;
}

export function buildDashboardSummary(
  cycles: DashboardCycleLog[],
  todayDateKey: string,
): DashboardSummary {
  const todaysLog = cycles.find((cycle) => cycle.date === todayDateKey);
  const latestLog = todaysLog ?? getLatestCycle(cycles);

  return {
    todaysLog,
    latestLog,
    phaseLabel: toPhaseLabel(latestLog?.phase),
    cycleDay: null,
  };
}

export function getLatestCycle(cycles: DashboardCycleLog[]) {
  return [...cycles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )[0];
}

export function toPhaseLabel(phase?: string | null) {
  if (!phase) {
    return null;
  }

  return `${phase.charAt(0).toUpperCase()}${phase.slice(1)} Phase`;
}

export function scoreToMood(score?: number | null) {
  if (typeof score !== "number") {
    return null;
  }
  if (score >= 8) return "Energetic";
  if (score >= 5) return "Calm";
  return "Tender";
}

export function scoreToEnergy(score?: number | null) {
  if (typeof score !== "number") {
    return null;
  }
  if (score >= 8) return "High";
  if (score >= 5) return "Good";
  return "Low";
}

export function scoreToStress(score?: number | null) {
  if (typeof score !== "number") {
    return null;
  }
  if (score >= 8) return "Peak";
  if (score >= 5) return "Mild";
  return "Calm";
}
