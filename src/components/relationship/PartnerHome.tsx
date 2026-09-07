"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { useRelationshipSession } from "@/hooks/useRelationshipSession";
import { getAppreciations, sendAppreciation } from "@/services/relationship/appreciations";
import { getPartnerContext } from "@/services/relationship/partnerContext";
import type { Appreciation, PartnerContext } from "@/types/relationship";

/**
 * Partner-only Home. Never shows raw cycle logs, period-day details, or any
 * self-tracking content — this account has none, and even a dual-role
 * account's OWN tracked data belongs on their tracked Home, not here. Every
 * card below only ever reflects content the owner explicitly shared.
 */
export function PartnerHome({
  ownerId,
  ownerName,
  viewerFirstName,
}: {
  ownerId: string;
  ownerName: string;
  viewerFirstName: string;
}) {
  const [context, setContext] = useState<PartnerContext | null>(null);
  const [appreciations, setAppreciations] = useState<Appreciation[]>([]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const { session: weeklyUs } = useRelationshipSession("weekly_us");

  useEffect(() => {
    void getPartnerContext(ownerId).then((result) => {
      if (result.success) setContext(result.data.partner);
    });
    void getAppreciations().then((result) => {
      if (result.success) setAppreciations(result.data.appreciations);
    });
  }, [ownerId]);

  const bothWeeklyUsReady = Boolean(weeklyUs?.ownReadyAt && weeklyUs?.partnerReadyAt && !weeklyUs.revealedAt);
  const sentAppreciations = appreciations.filter((a) => a.direction === "sent");
  const lastAppreciation = appreciations[0];

  async function handleSendNote() {
    if (!note.trim()) return;
    setSending(true);
    const result = await sendAppreciation(note.trim());
    setSending(false);
    if (result.success) {
      setAppreciations((current) => [result.data.appreciation, ...current]);
      setNote("");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl italic text-foreground sm:text-4xl">Hey {viewerFirstName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Connected with {ownerName}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg italic text-foreground">
              {context?.status === "shared" ? `${ownerName} shared context with you` : "No context shared yet"}
            </h2>
            {context?.status === "shared" && (
              <StatusPill tone="rose" className="shrink-0 uppercase tracking-wide">
                Shared context
              </StatusPill>
            )}
          </div>
          {context?.status === "shared" ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">&quot;{context.whatTheyShouldKnow}&quot;</p>
              <Link href="/connect/show-up-today" className="mt-4 inline-block text-sm font-semibold text-[color:var(--accent-rose)] hover:underline">
                How to Show Up Today →
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              When {ownerName} shares context with you, it&apos;ll show up here.
            </p>
          )}
        </div>

        <div className="rounded-[1.5rem] border border-[color:var(--accent-purple)]/30 bg-[color:var(--accent-purple-soft)] p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg italic text-foreground">Weekly Us</h2>
            {bothWeeklyUsReady && (
              <StatusPill tone="sage" className="shrink-0 uppercase tracking-wide">
                Both ready
              </StatusPill>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {bothWeeklyUsReady
              ? `Both you and ${ownerName} have logged your weekly reflections.`
              : "Reflect on the week together, whenever you're ready."}
          </p>
          <Link href="/connect/weekly-us">
            <Button
              variant="cta"
              className="![background:var(--accent-purple)] mt-4 w-full text-white"
            >
              {bothWeeklyUsReady ? "Reveal Weekly Us" : "Open Weekly Us"}
            </Button>
          </Link>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
          <h2 className="font-display text-lg italic text-foreground">Something you appreciated today?</h2>
          <p className="mt-2 text-sm text-muted-foreground">Send a quick, private note to say thanks or make them smile.</p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Write a warm note..."
              className="min-w-0 flex-1 rounded-lg border border-border bg-bg-elevated p-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
            />
            <Button variant="cta" size="sm" onClick={handleSendNote} loading={sending} disabled={!note.trim()}>
              Send
            </Button>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
          <h2 className="font-display text-lg italic text-foreground">Your Relationship</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>
              {lastAppreciation
                ? `Last appreciation ${lastAppreciation.direction === "sent" ? "sent" : "received"} recently`
                : "No appreciations yet"}
            </li>
            <li>{sentAppreciations.length} appreciation{sentAppreciations.length === 1 ? "" : "s"} sent by you</li>
          </ul>
          <Link href="/connect" className="mt-3 inline-block text-sm font-semibold text-[color:var(--accent-rose)] hover:underline">
            View relationship hub →
          </Link>
        </div>
      </div>
    </div>
  );
}
