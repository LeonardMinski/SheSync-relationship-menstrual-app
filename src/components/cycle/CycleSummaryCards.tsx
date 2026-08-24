import type { CycleEntry } from "@/types";

import { CycleDetailsCards } from "./CycleDetailsCards";
import { CycleStatsGrid } from "./CycleStatsGrid";
import { RecentEntries } from "./RecentEntries";
import { SelectedDateCard } from "./SelectedDateCard";

interface CycleSummaryCardsProps {
  cycles: CycleEntry[];
  selectedData?: CycleEntry;
  selectedDate: Date;
  onLog: () => void;
  onSelectCycle: (cycle: CycleEntry) => void;
}

export function CycleSummaryCards({
  cycles,
  selectedData,
  selectedDate,
  onLog,
  onSelectCycle,
}: CycleSummaryCardsProps) {
  return (
    <>
      <SelectedDateCard
        selectedData={selectedData}
        selectedDate={selectedDate}
        onLog={onLog}
      />
      <CycleStatsGrid selectedData={selectedData} />
      <CycleDetailsCards selectedData={selectedData} />
      <RecentEntries cycles={cycles} onSelectCycle={onSelectCycle} />
    </>
  );
}
