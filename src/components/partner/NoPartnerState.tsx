"use client";

import { useState } from "react";
import { Users } from "lucide-react";

import { TopNavbar } from "@/components/layout/TopNavbar";

import { InvitePartnerDialog } from "./InvitePartnerDialog";

export function NoPartnerState({
  onInvite,
}: {
  onInvite: (email: string) => Promise<boolean>;
}) {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="min-h-screen bg-bg pb-10">
      <TopNavbar title="Partner" subtitle="Invite a trusted partner" />
      <main className="mx-auto flex max-w-xl px-4 py-16">
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
      </main>

      {showInvite && (
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
      )}
    </div>
  );
}
