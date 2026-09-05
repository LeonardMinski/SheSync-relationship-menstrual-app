import { ArrowRight } from "lucide-react";

export function TodaysIntimacySuggestion({
  prompt,
  onExplore,
}: {
  prompt: string;
  onExplore: () => void;
}) {
  return (
    <section
      className="flex h-full flex-col justify-between rounded-[2rem] bg-gradient-to-br from-[color:var(--accent-rose-deep)] to-[color:var(--accent-premium)] p-6 text-[color:var(--accent-premium-foreground)] shadow-lg"
      data-testid="todays-intimacy-suggestion"
    >
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
          Today&apos;s Intimacy Suggestion
        </span>

        <p className="mt-6 text-2xl font-bold leading-snug">
          &ldquo;{prompt}&rdquo;
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide opacity-80">
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
          Vulnerability prompt
        </span>
        <button
          type="button"
          onClick={onExplore}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 font-medium text-[color:var(--cta-end)] transition-colors hover:bg-white/90 focus:outline-none focus:ring-3 focus:ring-white/50 focus:ring-offset-2"
        >
          Explore Prompt
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
