"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
    <Card className="flex min-w-0 flex-col">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-elevated">
          <Heart
            className="h-5 w-5 text-[color:var(--accent-peach)]"
            aria-hidden="true"
          />
        </span>
        <CardTitle as="h2" className="truncate font-display text-xl">
          Partner Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {!ownerLink && (
          <div>
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
          <div>
            <p className="text-sm font-semibold text-warning">
              Invitation pending
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {ownerLink.personEmail}
            </p>
          </div>
        )}

        {ownerLink?.status === "active" && (
          <div>
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
      </CardContent>

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
    </Card>
  );
}
