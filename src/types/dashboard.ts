export interface DashboardCycleLog {
  date: string;
  phase?: string | null;
  mood?: number | null;
  energy?: number | null;
  sleep?: number | null;
  stress?: number | null;
  /** Displayed as "Desire" on screen — DB/domain field name stays `libido`. */
  libido?: number | null;
  symptoms?: string[] | null;
  created_at?: string | null;
}
