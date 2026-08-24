import { format } from "date-fns";
import { Calendar } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { CycleEntry } from "@/types";
import { getPhaseMarker } from "@/features/cycle/cycle.utils";

interface SelectedDateCardProps {
  selectedData?: CycleEntry;
  selectedDate: Date;
  onLog: () => void;
}

export function SelectedDateCard({
  selectedData,
  selectedDate,
  onLog,
}: SelectedDateCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-center sm:justify-start sm:text-left">
          <Calendar className="h-5 w-5 text-cta-start" aria-hidden="true" />
          {format(selectedDate, "MMMM d, yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 text-center sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:text-left">
          <div className="min-w-0">
            <div className="text-2xl font-bold capitalize text-foreground">
              {selectedData ? getPhaseMarker(selectedData.phase) : "-"}{" "}
              {selectedData?.phase || "No data"}
            </div>
            <CardDescription>
              {selectedData
                ? "Entry logged for this date"
                : "No data logged for this date"}
            </CardDescription>
          </div>
          <div className="rounded-2xl bg-bg-elevated px-5 py-3 text-center">
            <div className="text-sm text-muted-foreground">Mood</div>
            <div className="text-lg font-semibold text-foreground">
              {selectedData?.mood || "—"}/10
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={onLog}
            className="mx-auto w-full max-w-xs sm:w-auto"
          >
            {selectedData ? "Edit Entry" : "Add Entry"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
