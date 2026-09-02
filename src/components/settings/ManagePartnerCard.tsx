"use client";

import { useState } from "react";
import { Lock, Users } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { InvitePartnerDialog } from "@/components/partner/InvitePartnerDialog";
import type { PartnerLinkWithPerson } from "@/types/partner";

export function ManagePartnerCard({
  ownerLink,
  loading,
  sharingSummary,
  onInvite,
  onRevoke,
}: {
  ownerLink: PartnerLinkWithPerson | null;
  loading: boolean;
  sharingSummary: string[];
  onInvite: (email: string) => Promise<boolean>;
  onRevoke: () => Promise<boolean>;
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [revoking, setRevoking] = useState(false);

  return (
    <section className="rounded-[2rem] border border-border border-l-[6px] border-l-[color:var(--accent-peach)] bg-bg-surface p-6 shadow-md">
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-cta-start" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-foreground">Manage Partner</h2>
      </div>

      <div className="mt-7 rounded-2xl bg-bg p-5">
        {loading && (
          <p className="text-sm text-muted-foreground">Loading connection status…</p>
        )}

        {!loading && !ownerLink && (
          <>
            <p className="text-sm text-muted-foreground">No partner connected</p>
            <Button variant="cta" className="mt-4 w-full" onClick={() => setShowInvite(true)}>
              Connect Partner
            </Button>
          </>
        )}

        {!loading && ownerLink?.status === "pending" && (
          <>
            <p className="text-sm font-semibold text-warning">Invitation pending</p>
            <p className="mt-1 text-sm text-muted-foreground">{ownerLink.personEmail}</p>
          </>
        )}

        {!loading && ownerLink?.status === "active" && (
          <>
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--accent-peach)] bg-bg-elevated text-xl font-black text-foreground">
                {ownerLink.personName.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-xl font-bold text-foreground">{ownerLink.personName}</p>
                <p className="text-sm font-semibold text-[color:var(--accent-sage)]">
                  Connected
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {sharingSummary.length > 0
                ? `Sharing: ${sharingSummary.join(", ")}`
                : "Sharing is on, but no categories are enabled yet."}
            </p>
            <Button
              variant="secondary"
              className="mt-6 w-full justify-between border-error/30 text-error hover:border-error"
              loading={revoking}
              onClick={async () => {
                setRevoking(true);
                await onRevoke();
                setRevoking(false);
              }}
            >
              Disconnect
              <Lock className="h-5 w-5" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>

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
    </section>
  );
}
