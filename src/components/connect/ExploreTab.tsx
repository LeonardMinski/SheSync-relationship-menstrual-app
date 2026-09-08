"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";
import { InlineBanner } from "@/components/ui/InlineBanner";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Textarea } from "@/components/ui/Input";
import { AnswerTogetherPreview } from "@/components/connect/AnswerTogetherPreview";

export type CardCategory = "Talk" | "Connect" | "Affection" | "Play" | "Reflect";

export interface IntimacyCard {
  id: string;
  category: CardCategory;
  prompt: string;
}

// Static conversation-prompt catalog — app-provided content, not user data.
export const EXPLORE_CARDS: IntimacyCard[] = [
  {
    id: "memory",
    category: "Talk",
    prompt: "What is a memory of us that always makes you smile, no matter how long it has been?",
  },
  {
    id: "hands",
    category: "Connect",
    prompt: "How do you feel when we hold hands in public spaces? Does it change by setting?",
  },
  {
    id: "touch",
    category: "Affection",
    prompt: "What is your favorite way to receive soft physical touch when you are low energy?",
  },
  {
    id: "cared-for",
    category: "Talk",
    prompt: "What's something your partner did recently that made you feel deeply cared for?",
  },
  {
    id: "play",
    category: "Play",
    prompt: "What's a playful, low-pressure activity you'd like to try together this month?",
  },
  {
    id: "reflect",
    category: "Reflect",
    prompt: "What makes you feel most emotionally close to your partner right now?",
  },
];

export const EXPLORE_CATEGORIES: (CardCategory | "All")[] = [
  "All",
  "Talk",
  "Connect",
  "Affection",
  "Play",
  "Reflect",
];

// A fixed, curated highlight from the catalog above — app-provided content,
// not user data, so it's safe to feature deterministically.
export const TODAYS_SUGGESTION = EXPLORE_CARDS[3];

export function ExploreTab({
  activeCategory,
  activeCard,
  onSelectCard,
  onCloseCard,
}: {
  activeCategory: CardCategory | "All";
  activeCard: IntimacyCard | null;
  onSelectCard: (card: IntimacyCard) => void;
  onCloseCard: () => void;
}) {
  const [response, setResponse] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedForLater, setSavedForLater] = useState(false);
  const [showMutualReveal, setShowMutualReveal] = useState(false);

  const visibleCards =
    activeCategory === "All"
      ? EXPLORE_CARDS
      : EXPLORE_CARDS.filter((card) => card.category === activeCategory);

  function closeCard() {
    onCloseCard();
    setResponse("");
    setSaved(false);
    setSavedForLater(false);
    setShowMutualReveal(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCards.map((card) => (
          <Card key={card.id} className="flex flex-col justify-between">
            <CardContent className="space-y-3 pt-4">
              <StatusPill tone="muted">{card.category.toUpperCase()}</StatusPill>
              <p className="font-display text-lg font-semibold leading-snug text-foreground">
                &ldquo;{card.prompt}&rdquo;
              </p>
              <Button variant="ghost" className="px-0 text-[color:var(--accent-rose)]" onClick={() => onSelectCard(card)}>
                Begin card →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeCard && (
        <Modal title={activeCard.prompt} onClose={closeCard}>
          <div className="space-y-4">
            <FeaturePlaceholder
              title="Reflections aren't saved yet"
              description="This is a design preview of the Explore flow. Nothing you write here persists once you close this window, and it is never sent to your partner."
            />

            {savedForLater && (
              <InlineBanner tone="info">
                Noted for this preview — not saved. Closing this window discards it.
              </InlineBanner>
            )}

            {saved ? (
              <InlineBanner tone="info">
                Written for this preview — not saved. Closing this window discards it.
              </InlineBanner>
            ) : (
              <>
                <Textarea
                  label="Your reflection"
                  value={response}
                  onChange={(event) => setResponse(event.target.value)}
                  placeholder="Take a moment to sit with this..."
                  rows={5}
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="cta"
                    disabled={!response.trim()}
                    onClick={() => setSaved(true)}
                  >
                    Reflect privately
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={!response.trim() || savedForLater}
                    onClick={() => setSavedForLater(true)}
                  >
                    Save for later
                  </Button>
                </div>
              </>
            )}

            {saved && !showMutualReveal && (
              <Button variant="outline" onClick={() => setShowMutualReveal(true)}>
                Answer together
              </Button>
            )}

            {showMutualReveal && (
              <AnswerTogetherPreview yourAnswer={response} onClose={() => setShowMutualReveal(false)} />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
