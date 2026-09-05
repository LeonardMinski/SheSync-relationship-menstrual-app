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
  if (!selectedData) {
    return <RecentEntries cycles={cycles} onSelectCycle={onSelectCycle} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <SelectedDateCard
          selectedData={selectedData}
          selectedDate={selectedDate}
          onLog={onLog}
        />
        <CycleStatsGrid selectedData={selectedData} />
        <CycleDetailsCards selectedData={selectedData} />
      </div>

      <RecentEntries cycles={cycles} onSelectCycle={onSelectCycle} />
    </div>
  );
}
