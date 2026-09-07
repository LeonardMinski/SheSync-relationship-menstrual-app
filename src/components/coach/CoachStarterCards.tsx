import { PromptCard } from "@/components/ui/PromptCard";
import { COACH_STARTER_CARDS, type CoachStarterCard } from "./coach.constants";

/**
 * Secondary starting points into the conversation — never the primary
 * surface (see CoachView's layout: the composer renders above these).
 * Each card's CTA is always visible, not hover-only, per the accessibility
 * requirement — no vague "Learn more"/"View"/"Continue" labels.
 */
export function CoachStarterCards({ onSelect }: { onSelect: (card: CoachStarterCard) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {COACH_STARTER_CARDS.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => onSelect(card)}
          className="min-h-[44px] w-full rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
        >
          <PromptCard
            eyebrow={card.eyebrow}
            eyebrowTone={card.eyebrowTone}
            title={card.title}
            description={card.description}
            highlighted={card.highlighted}
            className="transition hover:shadow-md"
            actions={
              <span className="inline-block text-sm font-semibold text-[color:var(--accent-rose)]">{card.ctaLabel}</span>
            }
          />
        </button>
      ))}
    </div>
  );
}
