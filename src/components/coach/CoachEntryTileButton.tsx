import { PromptCard } from "@/components/ui/PromptCard";
import type { CoachEntryTile } from "@/components/coach/coach.constants";

/**
 * "Jobs to be done" tile for the Coach home grid — thin wrapper that makes
 * the shared PromptCard keyboard-operable as a whole tile and wires it to
 * either a starter question (submits into the conversation) or a link
 * (navigates to the Partner Translation surface).
 */
interface CoachEntryTileButtonProps {
  tile: CoachEntryTile;
  onSelect: (tile: CoachEntryTile) => void;
}

export function CoachEntryTileButton({ tile, onSelect }: CoachEntryTileButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tile)}
      className="min-h-[44px] w-full rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
    >
      <PromptCard
        eyebrow={tile.eyebrow}
        eyebrowTone={tile.eyebrowTone}
        title={tile.title}
        description={tile.description}
        highlighted={tile.highlighted}
        className="transition hover:shadow-md"
      />
    </button>
  );
}
