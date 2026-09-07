"use client";

import Link from "next/link";
import { useState } from "react";
import { HeartHandshake } from "lucide-react";

import { InvitePartnerDialog } from "@/components/partner/InvitePartnerDialog";
import { StatusPill } from "@/components/ui/StatusPill";
import type { PartnerLinkWithPerson } from "@/types/partner";

/**
 * Real data only. Never claims a partner "knows" or "has been notified" of
 * anything — connection alone is not disclosure. This links into Partner
 * Translation, where an explicit share decision actually happens; nothing
 * here sends anything on its own.
 */
export function HomeRelationshipCard({
  ownerLink,
  onInvite,
}: {
  ownerLink: PartnerLinkWithPerson | null;
  onInvite: (email: string) => Promise<boolean>;
}) {
  const [showInvite, setShowInvite] = useState(false);

  if (!ownerLink) {
    return (
      <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5 sm:p-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent-rose-soft)] text-[color:var(--accent-rose)]">
          <HeartHandshake className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-display text-xl italic text-foreground">Connect with a partner</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Share only what you choose, whenever you choose. Nothing is shared automatically.
        </p>
        <button type="button" onClick={() => setShowInvite(true)} className="btn-cta mt-4 w-full">
          Invite a partner
        </button>
        {showInvite && (
          <InvitePartnerDialog
            onCancel={() => setShowInvite(false)}
            onSend={async (email) => {
              const success = await onInvite(email);
              if (success) setShowInvite(false);
              return success;
            }}
          />
        )}
      </div>
    );
  }

  if (ownerLink.status === "pending") {
    return (
      <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5 sm:p-6">
        <StatusPill tone="warning">Invitation pending</StatusPill>
        <h2 className="mt-4 font-display text-xl italic text-foreground">
          Waiting on {ownerLink.personEmail}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          They&apos;ll need to accept before you can share context with them.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5 sm:p-6">
      <StatusPill tone="sage">Connected</StatusPill>
      <h2 className="mt-4 font-display text-xl italic text-foreground">
        Give {ownerLink.personName} context?
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        They won&apos;t see anything until you choose to share it.
      </p>
      <Link href="/connect/translate" className="btn-cta mt-4 flex w-full items-center justify-center">
        Share context
      </Link>
    </div>
  );
}
