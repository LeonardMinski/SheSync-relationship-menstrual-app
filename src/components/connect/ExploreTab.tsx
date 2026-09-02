"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";
import { InlineBanner } from "@/components/ui/InlineBanner";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Textarea } from "@/components/ui/Input";

type CardCategory = "Talk" | "Connect" | "Affection" | "Play" | "Reflect";

interface IntimacyCard {
  id: string;
  category: CardCategory;
  prompt: string;
}

// Static conversation-prompt catalog — app-provided content, not user data.
const CARDS: IntimacyCard[] = [
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

const CATEGORIES: (CardCategory | "All")[] = ["All", "Talk", "Connect", "Affection", "Play", "Reflect"];

export function ExploreTab() {
  const [activeCategory, setActiveCategory] = useState<CardCategory | "All">("All");
  const [activeCard, setActiveCard] = useState<IntimacyCard | null>(null);
  const [response, setResponse] = useState("");
  const [saved, setSaved] = useState(false);

  const visibleCards =
    activeCategory === "All" ? CARDS : CARDS.filter((card) => card.category === activeCategory);

  function closeCard() {
    setActiveCard(null);
    setResponse("");
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter cards by category">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={activeCategory === category}
            onClick={() => setActiveCategory(category)}
            className={`min-h-[44px] rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start ${
              activeCategory === category
                ? "border-cta-start bg-cta-start text-[color:var(--cta-foreground)]"
                : "border-border bg-bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCards.map((card) => (
          <Card key={card.id} className="flex flex-col justify-between">
            <CardContent className="space-y-3 pt-4">
              <StatusPill tone="muted">{card.category.toUpperCase()}</StatusPill>
              <p className="font-display text-lg font-semibold leading-snug text-foreground">
                &ldquo;{card.prompt}&rdquo;
              </p>
              <Button variant="ghost" className="px-0 text-[color:var(--accent-rose)]" onClick={() => setActiveCard(card)}>
                Begin card →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeCard && (
        <Modal title={activeCard.prompt} onClose={closeCard}>
          <div className="space-y-4">
            {saved ? (
              <InlineBanner tone="success">
                Saved privately. Nothing is shared with your partner unless you choose to.
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
                  <Button variant="outline" disabled={!response.trim()} onClick={() => setSaved(true)}>
                    <Heart className="h-4 w-4" aria-hidden="true" />
                    Share with partner
                  </Button>
                </div>
              </>
            )}
            <FeaturePlaceholder
              title="Reflections aren't saved yet"
              description="This is a design preview of the Explore flow. Reflection responses and partner-sharing for this section aren't wired to a real backend yet — nothing you write here persists after you close this window."
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
