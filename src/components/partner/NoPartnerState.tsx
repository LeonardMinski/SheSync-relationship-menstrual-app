import { Users } from "lucide-react";

import { PublicFooter, PublicHeader } from "@/components/layout/PublicChrome";

export function NoPartnerState() {
  return (
    <div className="ss-page min-h-screen text-[color:var(--design-ink)]">
      <PublicHeader />
      <main className="mx-auto flex max-w-xl px-5 py-16 sm:px-8">
        <div
          className="ss-card w-full p-8 text-center sm:p-12"
          data-testid="no-partner"
        >
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--design-footer)]">
            <Users
              className="h-10 w-10 text-[color:var(--design-sage)]"
              aria-hidden="true"
            />
          </div>
          <h1 className="ss-display mb-5 text-5xl font-bold text-[color:var(--design-ink)]">
            Invite your Partner
          </h1>
          <p className="mx-auto mb-10 max-w-sm text-lg leading-8 text-[color:var(--design-muted)]">
            Sharing your cycle phases fosters deeper understanding and better
            support. You choose what to share.
          </p>
          <button
            className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[color:var(--design-peach)] px-8 text-lg font-bold text-[color:var(--design-ink)] shadow-[var(--design-shadow-soft)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)]"
            data-testid="connect-partner-button"
          >
            <Users className="h-5 w-5" aria-hidden="true" />
            Connect Partner
          </button>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
