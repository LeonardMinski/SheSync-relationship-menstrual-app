"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function IncomingInvitationState({
  inviterName,
  onRespond,
}: {
  inviterName: string;
  onRespond: (action: "accept" | "decline") => Promise<boolean>;
}) {
  const [pendingAction, setPendingAction] = useState<
    "accept" | "decline" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (action: "accept" | "decline") => {
    setPendingAction(action);
    setError(null);
    const success = await onRespond(action);
    setPendingAction(null);
    if (!success) {
      setError("We couldn't record your response. Please try again.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div
        className="w-full rounded-[2rem] border border-border bg-bg-surface p-8 text-center shadow-lg"
        data-testid="incoming-invitation"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated">
          <Heart className="h-8 w-8 text-cta-start" aria-hidden="true" />
        </div>
        <h2 className="mb-2 text-3xl font-bold text-foreground">
          {inviterName} invited you to connect
        </h2>
        <p className="mx-auto mb-8 max-w-sm text-muted-foreground">
          If you accept, you&apos;ll see a read-only, privacy-filtered view
          of what they choose to share. They control what&apos;s visible,
          and either of you can end the connection at any time.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-sm text-error"
          >
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            loading={pendingAction === "decline"}
            disabled={pendingAction !== null}
            onClick={() => handle("decline")}
            className="flex-1"
          >
            Decline
          </Button>
          <Button
            variant="cta"
            loading={pendingAction === "accept"}
            disabled={pendingAction !== null}
            onClick={() => handle("accept")}
            className="flex-1"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
