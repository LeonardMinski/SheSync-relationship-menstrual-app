export interface DashboardCycleLog {
  date: string;
  phase?: string | null;
  mood?: number | null;
  energy?: number | null;
  stress?: number | null;
  symptoms?: string[] | null;
}
