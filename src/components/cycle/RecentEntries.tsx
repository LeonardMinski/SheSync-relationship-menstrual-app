import { format } from "date-fns";
import { TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { CycleEntry } from "@/types";
import {
  getPhaseMarker,
  getRecentCycleEntries,
} from "@/features/cycle/cycle.utils";

interface RecentEntriesProps {
  cycles: CycleEntry[];
  onSelectCycle: (cycle: CycleEntry) => void;
}

export function RecentEntries({ cycles, onSelectCycle }: RecentEntriesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Entries</CardTitle>
        <CardDescription>Your last 5 cycle entries</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {getRecentCycleEntries(cycles).map((cycle) => (
            <button
              key={cycle.id ?? cycle.date}
              type="button"
              className="flex w-full items-center justify-between rounded-lg bg-bg-elevated p-3 text-left transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
              onClick={() => onSelectCycle(cycle)}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg" aria-hidden="true">
                  {getPhaseMarker(cycle.phase)}
                </span>
                <div>
                  <div className="font-medium text-foreground">
                    {format(new Date(cycle.date), "MMM d")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {cycle.phase} · Mood: {cycle.mood}/10
                  </div>
                </div>
              </div>
              <TrendingUp
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
