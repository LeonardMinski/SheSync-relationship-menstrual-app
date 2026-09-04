import { BarChart3 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * No pattern-detection logic exists yet in this codebase (checked
 * dashboard.utils / cycle utils — nothing computes a real weekly pattern),
 * so this stays an honest placeholder rather than inventing a fake stat.
 */
export function InsightCard() {
  return (
    <Card>
      <CardContent className="pt-4">
        <EmptyState
          icon={BarChart3}
          title="Insights are still learning"
          description="Once you've logged enough entries, patterns based on your real data will show up here."
        />
      </CardContent>
    </Card>
  );
}
