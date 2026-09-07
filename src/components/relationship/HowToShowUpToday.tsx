"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPartnerContext } from "@/services/relationship/partnerContext";
import { getSupportPreferences } from "@/services/relationship/supportPreferences";
import { addReply } from "@/services/relationship/replies";
import type { PartnerContext, SupportPreference } from "@/types/relationship";
import { HeartHandshake } from "lucide-react";

const HELP_LABELS: Record<string, string> = {
  space: "Space",
  quiet_company: "Quiet company",
  practical_help: "Practical help",
  reassurance: "Reassurance",
  physical_affection: "Physical affection",
};

const EXCLUSION_LABELS: Record<string, string> = {
  advice: "Advice",
  questions_about_it: "Questions about it",
  trying_to_fix_it: "Trying to fix it",
};

/**
 * Uses ONLY currently shared Partner Translation + Support Preferences —
 * never reads private cycle data to independently infer what the partner
 * should do. If nothing is shared, there is nothing to show here.
 */
export function HowToShowUpToday({ ownerId, ownerName }: { ownerId: string; ownerName: string }) {
  const [context, setContext] = useState<PartnerContext | null>(null);
  const [preferences, setPreferences] = useState<SupportPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void Promise.all([getPartnerContext(ownerId), getSupportPreferences(ownerId)]).then(
      ([contextResult, prefsResult]) => {
        setLoading(false);
        if (contextResult.success) setContext(contextResult.data.partner);
        if (prefsResult.success) setPreferences(prefsResult.data.partner);
      },
    );
  }, [ownerId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const hasSharedContext = Boolean(context && context.status === "shared");
  const sharedPreferences = preferences.filter((p) => p.isShared);

  if (!hasSharedContext && sharedPreferences.length === 0) {
    return (
      <div>
        <h1 className="font-display text-2xl italic text-foreground sm:text-3xl">How to Show Up Today</h1>
        <div className="mt-6">
          <EmptyState
            icon={HeartHandshake}
            title={`${ownerName} hasn't shared anything yet`}
            description="When they share context or a support preference, it'll show up here."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl italic text-foreground sm:text-3xl">How to Show Up Today</h1>
      <p className="mt-2 text-sm text-muted-foreground">Derived directly from context shared by {ownerName}.</p>

      {hasSharedContext && context && (
        <div className="mt-6 rounded-[1.5rem] border border-border bg-bg-surface p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--accent-rose)]">
            {ownerName}&apos;s need
          </p>
          <p className="mt-2 font-display text-xl italic text-foreground">
            &quot;{context.whatTheyShouldKnow}&quot;
          </p>

          {context.mightHelp.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">She&apos;d appreciate:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {context.mightHelp.map((v) => (
                  <span key={v} className="rounded-full border border-[color:var(--accent-sage)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-sage)]">
                    {HELP_LABELS[v]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {context.dontNeed.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">She isn&apos;t asking for:</p>
              <p className="mt-1 text-sm text-foreground">
                {context.dontNeed.map((v) => EXCLUSION_LABELS[v]).join(", ")}
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            {!sent ? (
              <>
                <input
                  type="text"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Want to let them know you're on it?"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-bg-elevated p-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
                />
                <Button
                  variant="cta"
                  size="sm"
                  disabled={!reply.trim()}
                  onClick={async () => {
                    const result = await addReply("partner_context", context.id, reply.trim());
                    if (result.success) setSent(true);
                  }}
                >
                  Send a Supportive Note
                </Button>
              </>
            ) : (
              <p className="text-sm text-[color:var(--accent-sage)]">Sent.</p>
            )}
          </div>
        </div>
      )}

      {sharedPreferences.length > 0 && (
        <div className="mt-4 space-y-3">
          {sharedPreferences.map((pref) => (
            <div key={pref.id} className="rounded-2xl border border-border bg-bg-elevated p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Support preference
              </p>
              <p className="mt-1 text-sm text-foreground">
                {pref.preferredSupports.length > 0
                  ? pref.preferredSupports.join(", ").replace(/_/g, " ")
                  : "No specific preferences selected."}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
