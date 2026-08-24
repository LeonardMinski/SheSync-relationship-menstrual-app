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
    <section className="rounded-[2rem] border border-border border-l-[6px] border-l-[color:var(--accent-peach)] bg-bg-surface p-6 shadow-md">
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-cta-start" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-foreground">Manage Partner</h2>
      </div>

      <div className="mt-7 rounded-2xl bg-bg p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--accent-peach)] bg-bg-elevated text-xl font-black text-foreground">
            A
          </span>
          <div>
            <p className="text-xl font-bold text-foreground">Alex M.</p>
            <p className="text-sm font-semibold text-[color:var(--accent-peach)]">
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
            className="w-full justify-between border-error/30 text-error hover:border-error"
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
