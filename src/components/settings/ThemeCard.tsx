import { Moon, Sun } from "lucide-react";

export function ThemeCard({
  isDarkMode,
  onToggle,
}: {
  isDarkMode: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="ss-card p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isDarkMode ? (
            <Moon
              className="h-7 w-7 text-[color:var(--design-sage)]"
              aria-hidden="true"
            />
          ) : (
            <Sun
              className="h-7 w-7 text-[color:var(--design-peach)]"
              aria-hidden="true"
            />
          )}
          <div>
            <h2 className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
              Theme
            </h2>
            <p className="mt-1 text-sm text-[color:var(--design-muted)]">
              {isDarkMode ? "Dark sanctuary mode" : "Soft light mode"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="relative h-8 w-14 rounded-full bg-[color:var(--design-border)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)]"
          aria-label="Toggle theme"
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-[color:var(--design-sage)] transition ${
              isDarkMode ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>
    </article>
  );
}
