import { Heart } from "lucide-react";

import type { PartnerSharedData } from "@/types";
import { formatDateShort } from "@/features/partner/partner.selectors";

export function RecentActivitySection({
  partnerData,
}: {
  partnerData: PartnerSharedData | null;
}) {
  if (!partnerData || partnerData.recentActivity.length === 0) {
    return null;
  }

  return (
    <section
      className="ss-card p-6 sm:p-8"
      data-testid="recent-activity"
    >
      <div className="mb-5 flex items-center gap-3">
        <Heart
          className="h-6 w-6 text-[color:var(--design-peach)]"
          aria-hidden="true"
        />
        <h2 className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
          Recent Activity
        </h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {partnerData.recentActivity.map((activity, index) => (
          <div
            key={`${activity.date}-${index}`}
            className="rounded-2xl bg-[color:var(--design-footer)] p-4"
            data-testid="activity-item"
          >
            <p className="text-sm font-semibold text-[color:var(--design-ink)]">
              {activity.description}
            </p>
            <p className="mt-2 text-xs font-semibold text-[color:var(--design-muted)]">
              {formatDateShort(activity.date)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
