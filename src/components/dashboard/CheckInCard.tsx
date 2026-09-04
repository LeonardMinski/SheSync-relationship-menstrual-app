import { format } from "date-fns";
import { HeartHandshake, PenLine } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import type { DashboardCycleLog } from "@/types/dashboard";

interface CheckInCardProps {
  todaysLog?: DashboardCycleLog;
  onCheckIn: () => void;
}

export function CheckInCard({ todaysLog, onCheckIn }: CheckInCardProps) {
  const loggedTime =
    todaysLog?.created_at && !Number.isNaN(new Date(todaysLog.created_at).getTime())
      ? format(new Date(todaysLog.created_at), "h:mm a")
      : null;

  return (
    <Card className="flex min-w-0 flex-col">
      <CardHeader>
        <CardTitle as="h2" className="font-display text-xl">
          How are you feeling?
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-start gap-4">
        {todaysLog ? (
          <>
            <StatusPill tone="sage">
              <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" />
              {loggedTime ? `Logged at ${loggedTime}` : "Logged today"}
            </StatusPill>
            <p className="text-sm text-muted-foreground">
              Want to update today&apos;s check-in? You can edit it any time.
            </p>
            <Button variant="secondary" onClick={onCheckIn} className="mt-auto w-full">
              <PenLine className="h-4 w-4" aria-hidden="true" />
              Update check-in
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              A quick check-in helps you notice how you&apos;re really doing —
              and gives you the option to share it with your partner later.
            </p>
            <Button variant="cta" onClick={onCheckIn} className="mt-auto w-full">
              Check in now
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
