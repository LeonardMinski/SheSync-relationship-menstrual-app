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
      className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md"
      data-testid="recent-activity"
    >
      <div className="mb-5 flex items-center gap-3">
        <Heart className="h-6 w-6 text-[color:var(--accent-peach)]" />
        <h2 className="text-2xl font-bold text-foreground">Recent Activity</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {partnerData.recentActivity.map((activity, index) => (
          <div
            key={`${activity.date}-${index}`}
            className="rounded-2xl bg-bg p-4"
            data-testid="activity-item"
          >
            <p className="text-sm font-semibold text-foreground">
              {activity.description}
            </p>
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              {formatDateShort(activity.date)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
