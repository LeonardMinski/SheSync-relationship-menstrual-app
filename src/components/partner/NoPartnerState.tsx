import { Users } from "lucide-react";

import { TopNavbar } from "@/components/layout/TopNavbar";

export function NoPartnerState() {
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
          <h1 className="mb-4 text-3xl font-bold text-foreground">
            Invite your Partner
          </h1>
          <p className="mx-auto mb-8 max-w-sm text-muted-foreground">
            Sharing your cycle phases fosters deeper understanding and better
            support. You choose what to share.
          </p>
          <button
            className="btn-cta w-full"
            data-testid="connect-partner-button"
          >
            <Users className="h-5 w-5" aria-hidden="true" />
            Connect Partner
          </button>
        </div>
      </main>
    </div>
  );
}
