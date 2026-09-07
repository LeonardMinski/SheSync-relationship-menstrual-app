import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { COACH_ERROR_BODY, COACH_ERROR_TITLE } from "./coach.constants";

/** Safe, generic copy only — never the raw provider/API error (see the route's error mapping). The failed question is preserved by the caller for Retry, not retyped here. */
export function CoachErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-error/30 bg-error/10 px-4 py-4 text-sm text-error sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">{COACH_ERROR_TITLE}</p>
          <p className="mt-1 text-error/90">{COACH_ERROR_BODY}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0 self-start sm:self-auto">
        Retry
      </Button>
    </div>
  );
}
