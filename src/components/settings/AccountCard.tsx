import { User } from "lucide-react";

import type { User as AuthUser } from "@/types";

interface AccountCardProps {
  user: AuthUser | null;
}

export function AccountCard({ user }: AccountCardProps) {
  return (
    <article className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md">
      <div className="flex items-center gap-3">
        <User className="h-7 w-7 text-cta-start" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-foreground">Account</h2>
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
      <label className="mb-2 block text-sm font-bold text-muted-foreground">
        {label}
      </label>
      <input className="input" value={value} readOnly />
    </div>
  );
}
