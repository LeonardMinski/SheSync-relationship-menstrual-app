"use client";

import { Clock } from "lucide-react";

import { TopNavbar } from "@/components/layout/TopNavbar";
import { Button } from "@/components/ui/Button";

export function PendingOutgoingState({
  invitedEmail,
  onCancel,
  cancelling,
}: {
  invitedEmail: string;
  onCancel: () => void;
  cancelling: boolean;
}) {
  return (
    <div className="min-h-screen bg-bg pb-10">
      <TopNavbar title="Partner" subtitle="Invitation pending" />
      <main className="mx-auto flex max-w-xl px-4 py-16">
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
      </main>
    </div>
  );
}
