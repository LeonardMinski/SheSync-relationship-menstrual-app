import { Check, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  COACH_CONTEXT_INCLUDED,
  COACH_CONTEXT_NEVER_SHARED,
  COACH_DISCLOSURE_TEXT,
} from "@/components/coach/coach.constants";

/**
 * Right-column card on the Coach home screen. This is a plain restatement
 * of what COACH_DISCLOSURE_TEXT already promises — it must not claim
 * anything the disclosure copy doesn't (no new data sources, no "always
 * private" guarantees).
 */
export function CoachContextPanel() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle as="h2" className="font-display text-xl">
          Coach Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">
          {COACH_DISCLOSURE_TEXT}
        </p>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-sage">
            Included
          </p>
          <ul className="mt-2 space-y-2">
            {COACH_CONTEXT_INCLUDED.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <Check
                  className="h-4 w-4 shrink-0 text-accent-sage"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cta-start">
            Never shared
          </p>
          <ul className="mt-2 space-y-2">
            {COACH_CONTEXT_NEVER_SHARED.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-cta-start"
              >
                <X className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
