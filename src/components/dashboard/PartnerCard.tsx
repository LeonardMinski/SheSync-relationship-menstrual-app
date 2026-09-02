"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

import { InvitePartnerDialog } from "@/components/partner/InvitePartnerDialog";
import type { PartnerLinkWithPerson } from "@/types/partner";

interface PartnerCardProps {
  ownerLink: PartnerLinkWithPerson | null;
  sharingSummary: string[];
  onManage: () => void;
  onInvite: (email: string) => Promise<boolean>;
}

export function PartnerCard({
  ownerLink,
  sharingSummary,
  onManage,
  onInvite,
}: PartnerCardProps) {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <article className="flex min-w-0 flex-col rounded-[2rem] border border-border border-l-[6px] border-l-[color:var(--accent-peach)] bg-bg-surface p-5 shadow-md">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-elevated">
          <Heart
            className="h-5 w-5 text-[color:var(--accent-peach)]"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold text-foreground">
            Partner Sync
          </h2>
        </div>
      </div>

      {!ownerLink && (
        <div className="mt-5">
          <p className="text-sm text-muted-foreground">No partner connected</p>
          <button
            type="button"
            className="btn-cta mt-4 w-full"
            onClick={() => setShowInvite(true)}
          >
            Connect partner
          </button>
        </div>
      )}

      {ownerLink?.status === "pending" && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-warning">
            Invitation pending
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {ownerLink.personEmail}
          </p>
        </div>
      )}

      {ownerLink?.status === "active" && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-[color:var(--accent-sage)]">
            Connected
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {sharingSummary.length > 0
              ? `${sharingSummary.length} ${sharingSummary.length === 1 ? "category" : "categories"} shared`
              : "No categories shared yet"}
          </p>
          <button
            type="button"
            onClick={onManage}
            className="mt-4 min-h-11 w-full rounded-full border border-border bg-bg-surface px-4 text-sm font-bold text-foreground transition hover:border-cta-start hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
          >
            Manage Sharing
          </button>
        </div>
      )}

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
    </article>
  );
}
