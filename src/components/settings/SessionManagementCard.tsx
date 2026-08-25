import { LogOut } from "lucide-react";

import { LogoutButton } from "@/components/layout/LogoutButton";

export function SessionManagementCard() {
  return (
    <section className="ss-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <LogOut
          className="h-7 w-7 text-[color:var(--design-sage)]"
          aria-hidden="true"
        />
        <h2 className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
          Session Management
        </h2>
      </div>

      <div className="mt-6 max-w-sm">
        <LogoutButton />
      </div>
    </section>
  );
}
