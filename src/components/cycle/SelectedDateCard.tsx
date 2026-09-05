import { format } from "date-fns";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { CycleEntry } from "@/types";
import { PhaseIcon } from "./PhaseIcon";

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
      <CardContent className="flex flex-col items-center gap-4 pt-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <PhaseIcon phase={selectedData?.phase} />
          <div>
            <p className="text-lg font-bold capitalize text-foreground">
              {format(selectedDate, "MMMM d, yyyy")}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedData
                ? `${selectedData.phase} phase — entry logged`
                : "No data logged for this date"}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={onLog}
          className="w-full sm:w-auto"
        >
          {selectedData ? "Edit Entry" : "Add Entry"}
        </Button>
      </CardContent>
    </Card>
  );
}
