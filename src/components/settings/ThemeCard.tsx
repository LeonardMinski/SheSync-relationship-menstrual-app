import { Moon, Sun } from "lucide-react";

export function ThemeCard({
  isDarkMode,
  onToggle,
}: {
  isDarkMode: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isDarkMode ? (
            <Moon className="h-7 w-7 text-info" aria-hidden="true" />
          ) : (
            <Sun className="h-7 w-7 text-warning" aria-hidden="true" />
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground">Theme</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isDarkMode ? "Dark sanctuary mode" : "Soft light mode"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="relative h-8 w-14 rounded-full bg-bg-tertiary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
          aria-label="Toggle theme"
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-cta-start transition ${
              isDarkMode ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>
    </article>
  );
}
