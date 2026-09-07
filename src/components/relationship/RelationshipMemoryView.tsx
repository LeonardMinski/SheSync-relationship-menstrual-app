"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

import { StatusPill } from "@/components/ui/StatusPill";
import { getRelationshipMemory } from "@/services/relationship/memory";
import type { RelationshipMemory, RelationshipMemorySourceType } from "@/types/relationship";

const SOURCE_LABELS: Record<RelationshipMemorySourceType, string> = {
  support_preference: "Support Preferences",
  weekly_us: "Weekly Us",
  mutual_reveal: "Mutual Reveal",
  repair: "Repair Realization",
  appreciation: "Appreciation",
  partner_context: "Shared Context",
};

export function RelationshipMemoryView() {
  const [memories, setMemories] = useState<RelationshipMemory[] | null>(null);

  useEffect(() => {
    void getRelationshipMemory().then((result) => {
      if (result.success) setMemories(result.data.memories);
    });
  }, []);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl italic text-foreground sm:text-3xl">Relationship Context</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Your shared archive of moments you both deliberately chose to save.
          </p>
        </div>
        <StatusPill tone="muted" className="shrink-0 uppercase tracking-wide">
          Memory space
        </StatusPill>
      </div>

      <h2 className="mt-6 text-lg font-bold text-foreground">What We&apos;ve Learned</h2>

      {memories === null ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
      ) : memories.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing saved yet. When you reveal a Weekly Us, Mutual Reveal, or Repair reflection, you
          can choose to save what you learned here.
        </p>
      ) : (
        <div className="mt-3 space-y-4">
          {memories.map((memory) => (
            <div key={memory.id} className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
              <StatusPill tone="rose" className="uppercase tracking-wide">
                {SOURCE_LABELS[memory.sourceType]}
              </StatusPill>
              <p className="mt-3 text-base font-semibold text-foreground">{memory.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{memory.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Saved {format(new Date(memory.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
