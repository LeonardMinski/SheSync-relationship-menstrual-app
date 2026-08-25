import { User } from "lucide-react";

import type { User as AuthUser } from "@/types";

interface AccountCardProps {
  user: AuthUser | null;
}

export function AccountCard({ user }: AccountCardProps) {
  return (
    <article className="ss-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <User
          className="h-7 w-7 text-[color:var(--design-sage)]"
          aria-hidden="true"
        />
        <h2 className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
          Account
        </h2>
      </div>

      <div className="mt-6 space-y-4">
        <ReadOnlyField label="Name" value={user?.name || "Sarah J."} />
        <ReadOnlyField
          label="Email"
          value={user?.email || "hello@example.com"}
        />
      </div>
    </article>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--design-muted)]">
        {label}
      </label>
      <input
        className="min-h-12 w-full rounded-none border border-[color:var(--design-border)] bg-white px-4 text-[color:var(--design-ink)]"
        value={value}
        readOnly
      />
    </div>
  );
}
