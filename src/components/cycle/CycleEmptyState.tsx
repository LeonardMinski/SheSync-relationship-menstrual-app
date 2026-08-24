import { Calendar, Droplet, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface CycleEmptyStateProps {
  onLog: () => void;
}

export function CycleEmptyState({ onLog }: CycleEmptyStateProps) {
  return (
    <Card className="py-8 text-center">
      <CardContent>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cta-start">
          <Calendar
            className="h-8 w-8 text-[color:var(--cta-foreground)]"
            aria-hidden="true"
          />
        </div>
        <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
          Start Tracking Your Cycle
        </h2>
        <p className="mx-auto mb-6 max-w-md text-center leading-relaxed text-muted-foreground">
          Log your first cycle entry to begin your wellness journey.
        </p>
        <div className="mx-auto flex max-w-md flex-col justify-center gap-3 sm:flex-row">
          <Button variant="cta" size="lg" onClick={onLog} className="flex-1">
            <Plus className="h-5 w-5" />
            Log Period
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onLog}
            className="flex-1"
          >
            <Droplet className="h-5 w-5" />
            Log Symptoms
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
