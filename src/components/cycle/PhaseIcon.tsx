import type { ComponentType } from "react";
import { Droplet, Moon, Sprout, Sun } from "lucide-react";

import type { CyclePhase } from "@/types/cycle";

const PHASE_CONFIG: Record<
  CyclePhase,
  { icon: ComponentType<{ className?: string }>; tone: string; toneBg: string }
> = {
  menstrual: {
    icon: Droplet,
    tone: "text-[color:var(--accent-rose)]",
    toneBg: "bg-[color:var(--accent-rose)]/15",
  },
  follicular: {
    icon: Sprout,
    tone: "text-[color:var(--accent-sage)]",
    toneBg: "bg-[color:var(--accent-sage-soft)]",
  },
  ovulation: {
    icon: Sun,
    tone: "text-[color:var(--accent-amber)]",
    toneBg: "bg-[color:var(--accent-amber-soft)]",
  },
  luteal: {
    icon: Moon,
    tone: "text-[color:var(--accent-purple)]",
    toneBg: "bg-[color:var(--accent-purple)]/15",
  },
};

/** A properly-sized icon circle representing a cycle phase — replaces the
 * old bare single-letter marker (e.g. "L" for luteal), which was redundant
 * with the phase name already shown as text next to it. */
export function PhaseIcon({
  phase,
  size = "md",
}: {
  phase?: CyclePhase | null;
  size?: "sm" | "md";
}) {
  if (!phase) return null;

  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;
  const boxSize = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <span
      className={`flex ${boxSize} shrink-0 items-center justify-center rounded-full ${config.toneBg}`}
    >
      <Icon className={`${iconSize} ${config.tone}`} aria-hidden="true" />
    </span>
  );
}
