"use client";

import { Clock } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function PendingOutgoingState({
  invitedEmail,
  onCancel,
  cancelling,
  compact = false,
}: {
  invitedEmail: string;
  onCancel: () => void;
  cancelling: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <section
        className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md"
        data-testid="pending-outgoing"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-warning/10">
            <Clock className="h-5 w-5 text-warning" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Invitation pending
            </h2>
            <p className="text-sm text-muted-foreground">
              Waiting for <span className="font-semibold text-foreground">{invitedEmail}</span>{" "}
              to accept.
            </p>
          </div>
        </div>
        <div className="mt-5">
          <Button variant="secondary" loading={cancelling} onClick={onCancel}>
            Cancel invitation
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div
        className="w-full rounded-[2rem] border border-border bg-bg-surface p-8 text-center shadow-lg"
        data-testid="pending-outgoing"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
          <Clock className="h-8 w-8 text-warning" aria-hidden="true" />
        </div>
        <h2 className="mb-2 text-3xl font-bold text-foreground">
          Invitation pending
        </h2>
        <p className="mx-auto mb-8 max-w-sm text-muted-foreground">
          Waiting for <span className="font-semibold text-foreground">{invitedEmail}</span> to
          accept. Nothing is shared until they do.
        </p>
        <Button
          variant="secondary"
          loading={cancelling}
          onClick={onCancel}
          className="w-full"
        >
          Cancel invitation
        </Button>
      </div>
    </div>
  );
}
