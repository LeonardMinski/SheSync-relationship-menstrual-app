import { format } from "date-fns";

import type { CycleEntry } from "@/types/cycle";

export function toCycleDateKey(date: string | number | Date) {
  return format(new Date(date), "yyyy-MM-dd");
}

export function findCycleForDate(cycles: CycleEntry[], selectedDate: Date) {
  const selectedDateKey = toCycleDateKey(selectedDate);
  return cycles.find((cycle) => toCycleDateKey(cycle.date) === selectedDateKey);
}
