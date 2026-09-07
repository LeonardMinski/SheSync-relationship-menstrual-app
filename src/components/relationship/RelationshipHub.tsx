"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { useRelationshipSession } from "@/hooks/useRelationshipSession";
import { getAppreciations } from "@/services/relationship/appreciations";
import { getPartnerContext } from "@/services/relationship/partnerContext";
import { getSupportPreferences } from "@/services/relationship/supportPreferences";
import type { Appreciation, PartnerContext, SupportPreference } from "@/types/relationship";

/**
 * Primary relationship hub for an active connection. Prioritises the
 * current interaction (active/waiting) over an even spread of ten equally
 * weighted cards — see Phase 11.
 */
export function RelationshipHub({
  partnerName,
  partnerId,
  connectedSince,
}: {
  partnerName: string;
  partnerId: string;
  connectedSince: string | null;
}) {
  const { session: weeklyUs } = useRelationshipSession("weekly_us");
  const [ownContext, setOwnContext] = useState<PartnerContext | null>(null);
  const [sharedFromPartner, setSharedFromPartner] = useState<PartnerContext | null>(null);
  const [appreciations, setAppreciations] = useState<Appreciation[]>([]);
  const [ownPreferences, setOwnPreferences] = useState<SupportPreference[]>([]);

  useEffect(() => {
    void getPartnerContext(partnerId).then((result) => {
      if (result.success) {
        setOwnContext(result.data.own);
        setSharedFromPartner(result.data.partner);
      }
    });
    void getAppreciations().then((result) => {
      if (result.success) setAppreciations(result.data.appreciations);
    });
    void getSupportPreferences().then((result) => {
      if (result.success) setOwnPreferences(result.data.own);
    });
  }, [partnerId]);

  const bothWeeklyUsReady = Boolean(weeklyUs?.ownReadyAt && weeklyUs?.partnerReadyAt);
  const weeklyUsRevealed = Boolean(weeklyUs?.revealedAt);
  const sharedPreferenceCount = ownPreferences.filter((p) => p.isShared).length;
  const recentAppreciation = appreciations[0];

  return (
    <div>
      <h1 className="font-display text-3xl italic text-foreground sm:text-4xl">You &amp; {partnerName}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {connectedSince ? `Connected since ${format(new Date(connectedSince), "MMMM yyyy")}` : "Connected"}
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[color:var(--accent-purple)]/30 bg-[color:var(--accent-purple-soft)] p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg italic text-foreground">Weekly Us</h2>
            <StatusPill tone={weeklyUsRevealed ? "sage" : bothWeeklyUsReady ? "rose" : "muted"} className="shrink-0 uppercase tracking-wide">
              {weeklyUsRevealed ? "Revealed" : bothWeeklyUsReady ? "Ready to reveal" : "In progress"}
            </StatusPill>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {bothWeeklyUsReady && !weeklyUsRevealed
              ? "Both of you have completed this week's reflection."
              : "Reflect on the week together, at your own pace."}
          </p>
          <Link href="/connect/weekly-us">
            <Button variant="cta" className="![background:var(--accent-purple)] mt-4 w-full text-white">
              {weeklyUsRevealed ? "View this week" : bothWeeklyUsReady ? "Reveal Together" : "Open Weekly Us"}
            </Button>
          </Link>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
          <h2 className="font-display text-lg italic text-foreground">Shared Context History</h2>
          <div className="mt-3 space-y-2">
            {ownContext?.status === "shared" && (
              <p className="text-sm text-muted-foreground">&quot;{ownContext.whatTheyShouldKnow}&quot;</p>
            )}
            {sharedFromPartner?.status === "shared" && (
              <p className="text-sm text-muted-foreground">
                {partnerName} shared: &quot;{sharedFromPartner.whatTheyShouldKnow}&quot;
              </p>
            )}
            {!ownContext && !sharedFromPartner && (
              <p className="text-sm text-muted-foreground">No context shared yet.</p>
            )}
          </div>
          <Link href="/connect/translate" className="mt-3 inline-block text-sm font-semibold text-[color:var(--accent-rose)] hover:underline">
            Open Partner Translation →
          </Link>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg italic text-foreground">Recent Appreciations</h2>
            <StatusPill tone="muted">{appreciations.length} total</StatusPill>
          </div>
          {recentAppreciation ? (
            <p className="mt-2 text-sm italic text-muted-foreground">&quot;{recentAppreciation.content}&quot;</p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No appreciations yet.</p>
          )}
          <Link href="/connect/appreciate" className="mt-3 inline-block text-sm font-semibold text-[color:var(--accent-rose)] hover:underline">
            Send an appreciation →
          </Link>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
          <h2 className="font-display text-lg italic text-foreground">Support Preferences</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {sharedPreferenceCount > 0
              ? `${sharedPreferenceCount} preference${sharedPreferenceCount === 1 ? "" : "s"} shared with ${partnerName}.`
              : "Nothing shared yet."}
          </p>
          <Link href="/connect/support-preferences" className="mt-3 inline-block text-sm font-semibold text-[color:var(--accent-rose)] hover:underline">
            Manage preferences →
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Link
          href="/connect/mutual-reveal"
          className="rounded-[1.5rem] border border-border bg-bg-surface p-5 transition-colors hover:border-[color:var(--accent-amber)]"
        >
          <h2 className="font-display text-lg italic text-foreground">Mutual Reveal</h2>
          <p className="mt-2 text-sm text-muted-foreground">Explore a prompt together, at your own pace.</p>
        </Link>
        <Link
          href="/connect/repair"
          className="rounded-[1.5rem] border border-border bg-bg-surface p-5 transition-colors hover:border-[color:var(--accent-rose)]"
        >
          <h2 className="font-display text-lg italic text-foreground">Repair Space</h2>
          <p className="mt-2 text-sm text-muted-foreground">A structured way to reconnect after conflict.</p>
        </Link>
      </div>

      <Link href="/connect/memory" className="mt-5 block text-sm font-semibold text-[color:var(--accent-rose)] hover:underline">
        View relationship memory →
      </Link>
    </div>
  );
}
