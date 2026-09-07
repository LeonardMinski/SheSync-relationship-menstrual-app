import { MessageCircleHeart } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { COACH_PARTNER_TRANSLATION_CTA } from "./coach.constants";
import type { CoachMessage } from "@/types/coach";

/**
 * Renders one turn. A structured assistant reply (fromLogs/generalContext/
 * questionToConsider/optionalNextStep) gets the analytical card layout;
 * everything else — including a message with none of those fields set —
 * is a plain conversational bubble. Never both: a message either has real
 * structure or it doesn't, decided entirely by what the model actually
 * returned (see features/coach/openaiClient.ts), never fabricated here.
 */
export function CoachMessageBubble({
  message,
  onTurnIntoPartnerContext,
}: {
  message: CoachMessage;
  onTurnIntoPartnerContext: (message: CoachMessage) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-[color:var(--accent-rose)]/30 bg-[color:var(--accent-rose)]/15 px-4 py-3 text-sm leading-6 text-foreground sm:max-w-[70%]">
          {message.content}
        </div>
      </div>
    );
  }

  const hasStructure = Boolean(
    message.fromLogs || message.generalContext || message.questionToConsider || message.optionalNextStep,
  );

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-3 rounded-2xl rounded-bl-sm border border-[color:var(--accent-purple)]/25 bg-[color:var(--accent-purple-soft)]/30 px-4 py-4 text-sm leading-6 text-foreground sm:max-w-[70%]">
        {!hasStructure && <p>{message.content}</p>}

        {message.fromLogs && (
          <div>
            <span className="inline-flex items-center rounded-full bg-[color:var(--accent-sage-soft)]/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--accent-sage)]">
              From your logs
            </span>
            <p className="mt-2">{message.fromLogs}</p>
          </div>
        )}

        {message.generalContext && (
          <div>
            <span className="inline-flex items-center rounded-full bg-bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              General context
            </span>
            <p className="mt-2">{message.generalContext}</p>
          </div>
        )}

        {message.questionToConsider && (
          <div>
            <span className="inline-flex items-center rounded-full bg-[color:var(--accent-amber-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--accent-amber)]">
              Question to consider
            </span>
            <p className="mt-2">{message.questionToConsider}</p>
          </div>
        )}

        {message.optionalNextStep && (
          <div>
            <span className="inline-flex items-center rounded-full bg-[color:var(--accent-rose)]/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--accent-rose)]">
              Optional next step
            </span>
            <p className="mt-2">{message.optionalNextStep}</p>
          </div>
        )}

        {hasStructure && message.content && (
          <p className="text-muted-foreground">{message.content}</p>
        )}

        {message.partnerTranslationAvailable && (
          <div className="pt-1">
            <Button type="button" variant="cta" size="sm" onClick={() => onTurnIntoPartnerContext(message)}>
              <MessageCircleHeart className="h-4 w-4" aria-hidden="true" />
              {COACH_PARTNER_TRANSLATION_CTA}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
