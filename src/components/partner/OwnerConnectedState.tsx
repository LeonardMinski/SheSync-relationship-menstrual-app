"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function OwnerConnectedState({
  viewerName,
  sharingSummary,
  onRevoke,
}: {
  viewerName: string;
  sharingSummary: string[];
  onRevoke: () => Promise<boolean>;
}) {
  const [revoking, setRevoking] = useState(false);

  return (
    <section
      className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md"
      data-testid="owner-connected"
    >
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-[color:var(--accent-sage)]" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Sharing with {viewerName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {sharingSummary.length > 0
              ? `Currently sharing: ${sharingSummary.join(", ")}`
              : "Sharing is on, but no categories are enabled yet."}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/settings/privacy" className="btn-secondary">
          Manage sharing
        </Link>
        <Button
          variant="secondary"
          className="border-error/30 text-error hover:border-error"
          loading={revoking}
          onClick={async () => {
            setRevoking(true);
            await onRevoke();
            setRevoking(false);
          }}
        >
          Disconnect
        </Button>
      </div>
    </section>
  );
}
