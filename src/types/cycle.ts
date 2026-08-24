export type CyclePhase = "menstrual" | "follicular" | "ovulation" | "luteal";

export interface CycleEntry {
  id?: string;
  user_id: string;
  date: string;
  phase: CyclePhase;
  mood: number;
  energy: number;
  libido: number;
  stress: number;
  symptoms: string[];
  notes?: string;
  created_at?: string;
}

export interface LogCycleData {
  date?: string;
  phase: CyclePhase;
  mood: number;
  energy?: number;
  libido?: number;
  stress?: number;
  symptoms: string[];
  notes?: string;
}

export interface CycleLogFormState {
  phase: CyclePhase | "";
  mood: number;
  energy: number;
  libido: number;
  stress: number;
  symptoms: string[];
  notes: string;
}
