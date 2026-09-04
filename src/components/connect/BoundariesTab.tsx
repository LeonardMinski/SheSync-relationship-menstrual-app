"use client";

import { useState } from "react";
import { HelpCircle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";
import { InlineBanner } from "@/components/ui/InlineBanner";

type BoundaryTone = "yes" | "maybe" | "no";

interface BoundaryItem {
  id: string;
  label: string;
  tone: BoundaryTone;
}

const INITIAL_ITEMS: BoundaryItem[] = [
  { id: "massage", label: "Massage", tone: "yes" },
  { id: "kissing", label: "Kissing", tone: "yes" },
  { id: "hands", label: "Holding hands", tone: "yes" },
  { id: "eye-contact", label: "Eye contact", tone: "yes" },
  { id: "roleplay", label: "Role play", tone: "maybe" },
  { id: "fantasies", label: "Sharing fantasies", tone: "maybe" },
  { id: "blindfolds", label: "Sensory blindfolds", tone: "maybe" },
  { id: "public-teasing", label: "Public teasing", tone: "no" },
  { id: "visitors", label: "Spontaneous visitors", tone: "no" },
];

const COLUMNS: { tone: BoundaryTone; title: string; helper: string }[] = [
  { tone: "yes", title: "YES", helper: "Generally comfortable" },
  { tone: "maybe", title: "MAYBE", helper: "Let's talk first" },
  { tone: "no", title: "NO", helper: "Not comfortable" },
];

const TONE_CYCLE: Record<BoundaryTone, BoundaryTone> = {
  yes: "maybe",
  maybe: "no",
  no: "yes",
};

export function BoundariesTab() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [changed, setChanged] = useState(false);

  function cycleTone(id: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, tone: TONE_CYCLE[item.tone] } : item)),
    );
    setChanged(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Your Boundaries</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your boundaries are private by default. Communicate comfort maps with total agency.
        </p>
      </div>

      <InlineBanner tone="success">
        Preferences are not consent. Consent should always be checked in the moment.
      </InlineBanner>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((column) => (
          <Card key={column.tone}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {column.tone === "yes" && <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent-sage)]" />}
                {column.tone === "maybe" && <HelpCircle className="h-4 w-4 text-[color:var(--warning)]" aria-hidden="true" />}
                {column.tone === "no" && <XCircle className="h-4 w-4 text-[color:var(--error)]" aria-hidden="true" />}
                {column.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{column.helper}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {items
                .filter((item) => item.tone === column.tone)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => cycleTone(item.id)}
                    className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-border bg-bg-elevated px-4 py-2 text-left text-sm font-medium text-foreground transition-colors hover:border-cta-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                    aria-label={`${item.label}: ${column.title.toLowerCase()}. Tap to change.`}
                  >
                    {item.label}
                  </button>
                ))}
              {items.filter((item) => item.tone === column.tone).length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing here yet.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <FeaturePlaceholder
        title={changed ? "Not saved yet" : "Boundaries aren't saved yet"}
        description="This is a design preview. Tapping an item cycles it between Yes/Maybe/No so you can see the interaction, but changes aren't persisted to your account or shared with a partner yet."
      >
        <Button variant="secondary" disabled title="Not available yet — this is a design preview">
          Share boundaries with partner
        </Button>
      </FeaturePlaceholder>
    </div>
  );
}
