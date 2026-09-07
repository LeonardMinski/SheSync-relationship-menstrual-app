"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { StatusPill } from "@/components/ui/StatusPill";
import { getPartnerContext } from "@/services/relationship/partnerContext";
import type { PartnerContext } from "@/types/relationship";

/**
 * Dual-role secondary card: a tracking-enabled account who is ALSO a
 * viewer of someone else's shared context sees it here, alongside their
 * own primary tracked Home — never as a full mode switch. Real data only;
 * renders nothing if the other person hasn't shared anything.
 */
export function IncomingSharedContextCard({
  partnerId,
  partnerName,
}: {
  partnerId: string;
  partnerName: string;
}) {
  const [context, setContext] = useState<PartnerContext | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void getPartnerContext(partnerId).then((result) => {
      if (!active) return;
      if (result.success) setContext(result.data.partner);
    });
    return () => {
      active = false;
    };
  }, [partnerId]);

  if (!context || context.status !== "shared") {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] border border-[color:var(--accent-sage)]/30 bg-[color:var(--accent-sage-soft)]/25 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg italic text-foreground">
          {partnerName} shared context with you
        </h2>
        <StatusPill tone="sage" className="shrink-0 uppercase tracking-wide">
          Shared context
        </StatusPill>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">&quot;{context.whatTheyShouldKnow}&quot;</p>
      <Link
        href="/connect/show-up-today"
        className="mt-3 inline-block text-sm font-semibold text-[color:var(--accent-sage)] hover:underline"
      >
        How to Show Up Today →
      </Link>
    </div>
  );
}
