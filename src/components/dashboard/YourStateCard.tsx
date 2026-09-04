import { Gauge } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricScale } from "@/components/ui/MetricScale";
import type { DashboardCycleLog } from "@/types/dashboard";

interface YourStateCardProps {
  todaysLog?: DashboardCycleLog;
}

/**
 * "Your State Today" — only ever shows real logged mood/energy/stress/desire
 * for TODAY specifically. Never falls back to the latest historical entry:
 * an honest "not logged yet" beats a stale number presented as current.
 */
export function YourStateCard({ todaysLog }: YourStateCardProps) {
  return (
    <Card className="flex min-w-0 flex-col">
      <CardHeader>
        <CardTitle as="h2" className="font-display text-xl">
          Your State Today
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {todaysLog ? (
          <div className="space-y-5">
            <MetricScale
              label="Mood"
              value={todaysLog.mood ?? 0}
              max={10}
              tone="rose"
              caption={typeof todaysLog.mood === "number" ? `${todaysLog.mood}/10` : "Not logged"}
            />
            <MetricScale
              label="Energy"
              value={todaysLog.energy ?? 0}
              max={10}
              tone="amber"
              caption={typeof todaysLog.energy === "number" ? `${todaysLog.energy}/10` : "Not logged"}
            />
            <MetricScale
              label="Stress"
              value={todaysLog.stress ?? 0}
              max={10}
              tone="sage"
              caption={typeof todaysLog.stress === "number" ? `${todaysLog.stress}/10` : "Not logged"}
            />
            <MetricScale
              label="Desire"
              value={todaysLog.libido ?? 0}
              max={10}
              tone="rose"
              caption={typeof todaysLog.libido === "number" ? `${todaysLog.libido}/10` : "Not logged"}
            />
          </div>
        ) : (
          <EmptyState
            icon={Gauge}
            title="Not logged yet today"
            description="Check in once and your mood, energy, stress, and desire will show up here."
          />
        )}
      </CardContent>
    </Card>
  );
}
