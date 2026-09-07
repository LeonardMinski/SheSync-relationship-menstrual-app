import { COACH_THINKING_TEXT } from "./coach.constants";

/** Rendered in place of the next assistant bubble while a reply is generating. No fake streaming — a clear static state is enough for V1. */
export function CoachThinkingState() {
  return (
    <div className="flex justify-start">
      <div
        role="status"
        className="flex max-w-[85%] items-center gap-3 rounded-2xl rounded-bl-sm border border-[color:var(--accent-purple)]/25 bg-[color:var(--accent-purple-soft)]/20 px-4 py-3 text-sm text-muted-foreground sm:max-w-[70%]"
      >
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 motion-reduce:animate-none animate-bounce rounded-full bg-[color:var(--accent-purple)] [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 motion-reduce:animate-none animate-bounce rounded-full bg-[color:var(--accent-purple)] [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 motion-reduce:animate-none animate-bounce rounded-full bg-[color:var(--accent-purple)]" />
        </span>
        <span>{COACH_THINKING_TEXT}</span>
      </div>
    </div>
  );
}
