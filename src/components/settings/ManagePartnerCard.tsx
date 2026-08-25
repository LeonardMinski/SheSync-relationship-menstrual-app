import { Heart, Lock, Users } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function ManagePartnerCard({
  saving,
  onReset,
}: {
  saving: boolean;
  onReset: () => void;
}) {
  return (
    <section className="ss-card border-l-[6px] border-l-[color:var(--design-sage-soft)] p-6 sm:p-8">
      <div className="flex items-center gap-4 border-b border-[color:var(--design-border)] pb-6">
        <Users
          className="h-7 w-7 text-[color:var(--design-sage)]"
          aria-hidden="true"
        />
        <h2 className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
          Manage Partner
        </h2>
      </div>

      <div className="mt-7 rounded-2xl bg-[color:var(--design-footer)] p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-[color:var(--design-peach)] bg-white text-2xl font-black text-[color:var(--design-brown)]">
            A
          </span>
          <div>
            <p className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
              Alex M.
            </p>
            <p className="mt-1 text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--design-muted)]">
              Connected
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Button variant="secondary" className="w-full justify-between">
            View Partner&apos;s Perspective
            <Heart className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-between border-error/30 bg-white text-error hover:border-error"
            onClick={onReset}
            disabled={saving}
          >
            Revoke Access
            <Lock className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
