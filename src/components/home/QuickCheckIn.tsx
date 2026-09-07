import type { LucideIcon } from "lucide-react";
import { Anchor, CloudDrizzle, Moon, Sparkles, TrendingUp, Waves, Wind, Zap } from "lucide-react";

interface CheckInTile {
  label: string;
  icon: LucideIcon;
}

// These describe how someone might tap in to start today's check-in — not a
// separate mood-word tracking model. There is only one real check-in data
// model (mood/energy/sleep/desire/stress, each 1-10 — see CycleLogDialog),
// so every tile opens that same dialog; nothing here is persisted on its
// own or implies a finer-grained mood taxonomy exists.
const TILES: CheckInTile[] = [
  { label: "Energetic", icon: Zap },
  { label: "Tired", icon: Moon },
  { label: "Calm", icon: Wind },
  { label: "Anxious", icon: CloudDrizzle },
  { label: "Motivated", icon: TrendingUp },
  { label: "Reflective", icon: Waves },
  { label: "Sensitive", icon: Sparkles },
  { label: "Grounded", icon: Anchor },
];

/** A rotating-feeling subset keeps the row to 4 tiles, matching the design's density, without hardcoding one fixed set. */
function pickTiles(seed: number): CheckInTile[] {
  const start = seed % TILES.length;
  return [TILES[start], TILES[(start + 1) % TILES.length], TILES[(start + 2) % TILES.length], TILES[(start + 3) % TILES.length]];
}

export function QuickCheckIn({ onCheckIn, seed = 0 }: { onCheckIn: () => void; seed?: number }) {
  const tiles = pickTiles(seed);

  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
        How&apos;s your day been?
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <button
            key={tile.label}
            type="button"
            onClick={onCheckIn}
            className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-bg-surface p-4 text-sm font-semibold text-foreground transition-colors hover:border-cta-start hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent-rose-soft)] text-[color:var(--accent-rose)]">
              <tile.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            {tile.label}
          </button>
        ))}
      </div>
    </div>
  );
}
