"use client";

import { useState } from "react";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/Button";

import { InvitePartnerDialog } from "./InvitePartnerDialog";

export function NoPartnerState({
  onInvite,
  compact = false,
}: {
  onInvite: (email: string) => Promise<boolean>;
  compact?: boolean;
}) {
  const [showInvite, setShowInvite] = useState(false);

  const dialog = showInvite && (
    <InvitePartnerDialog
      onCancel={() => setShowInvite(false)}
      onSend={async (email) => {
        const success = await onInvite(email);
        if (success) {
          setShowInvite(false);
        }
        return success;
      }}
    />
  );

  if (compact) {
    return (
      <section
        className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md"
        data-testid="no-partner"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg-elevated">
            <Users className="h-5 w-5 text-cta-start" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              No partner connected
            </h2>
            <p className="text-sm text-muted-foreground">
              You choose what to share, if you invite someone.
            </p>
          </div>
        </div>
        <div className="mt-5">
          <Button
            variant="secondary"
            data-testid="connect-partner-button"
            onClick={() => setShowInvite(true)}
          >
            Connect Partner
          </Button>
        </div>
        {dialog}
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div
        className="w-full rounded-[2rem] border border-border bg-bg-surface p-8 text-center shadow-lg"
        data-testid="no-partner"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated">
          <Users className="h-8 w-8 text-cta-start" aria-hidden="true" />
        </div>
        <h2 className="mb-4 text-3xl font-bold text-foreground">
          No partner connected
        </h2>
        <p className="mx-auto mb-8 max-w-sm text-muted-foreground">
          You choose what to share. Invite a partner to see selected cycle
          and mood context once you turn sharing on.
        </p>
        <button
          type="button"
          className="btn-cta w-full"
          data-testid="connect-partner-button"
          onClick={() => setShowInvite(true)}
        >
          <Users className="h-5 w-5" aria-hidden="true" />
          Connect Partner
        </button>
      </div>
      {dialog}
    </div>
  );
}
