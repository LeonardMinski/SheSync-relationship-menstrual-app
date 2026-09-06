import { format } from "date-fns";
import { Gauge, HeartHandshake, PenLine } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricScale } from "@/components/ui/MetricScale";
import { StatusPill } from "@/components/ui/StatusPill";
import type { DashboardCycleLog } from "@/types/dashboard";

interface YourStateCardProps {
  todaysLog?: DashboardCycleLog;
  onCheckIn: () => void;
}

/**
 * "Your State Today" — only ever shows real logged mood/energy/stress/desire
 * for TODAY specifically. Never falls back to the latest historical entry:
 * an honest "not logged yet" beats a stale number presented as current.
 *
 * The check-in action lives here rather than in a separate card next to
 * it — a "not logged yet today" message with no way to act on it, sitting
 * beside a whole other card whose only job was that action, was the same
 * kind of split duplication trimmed elsewhere on Cycle.
 */
export function YourStateCard({ todaysLog, onCheckIn }: YourStateCardProps) {
  const loggedTime =
    todaysLog?.created_at && !Number.isNaN(new Date(todaysLog.created_at).getTime())
      ? format(new Date(todaysLog.created_at), "h:mm a")
      : null;

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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusPill tone="sage">
                <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" />
                {loggedTime ? `Logged at ${loggedTime}` : "Logged today"}
              </StatusPill>
              <Button variant="secondary" size="sm" onClick={onCheckIn}>
                <PenLine className="h-4 w-4" aria-hidden="true" />
                Update check-in
              </Button>
            </div>
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
              label="Sleep"
              value={todaysLog.sleep ?? 0}
              max={10}
              tone="sage"
              caption={typeof todaysLog.sleep === "number" ? `${todaysLog.sleep}/10` : "Not logged"}
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
            action={
              <Button variant="cta" onClick={onCheckIn}>
                Check in now
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
