import { Brain } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { API_FALLBACKS } from "@/services/cycle/insights";
import type {
  HealthInsight,
  NutritionSuggestion,
} from "@/services/cycle/insights";

interface CycleInsightsPanelProps {
  apiLoading: boolean;
  healthInsights: HealthInsight[];
  nutritionSuggestion: NutritionSuggestion | null;
}

export function CycleInsightsPanel({
  apiLoading,
  healthInsights,
  nutritionSuggestion,
}: CycleInsightsPanelProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cta-start" aria-hidden="true" />
            Mood & Symptoms Tips
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your cycle data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiLoading ? (
            <InsightsSkeleton />
          ) : (
            <>
              <HealthInsightsList healthInsights={healthInsights} />
              <NutritionCard nutritionSuggestion={nutritionSuggestion} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 rounded bg-bg-muted" />
      <div className="h-4 w-3/4 rounded bg-bg-muted" />
      <div className="h-4 w-1/2 rounded bg-bg-muted" />
    </div>
  );
}

function HealthInsightsList({
  healthInsights,
}: {
  healthInsights: HealthInsight[];
}) {
  if (healthInsights.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        {API_FALLBACKS.healthInsights}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {healthInsights.map((insight) => (
        <div key={`${insight.type}-${insight.tip}`} className="rounded-lg bg-bg-elevated p-3">
          <div className="mb-1 text-sm font-medium capitalize text-foreground">
            {insight.type} Tip
          </div>
          <div className="text-sm text-muted-foreground">{insight.tip}</div>
        </div>
      ))}
    </div>
  );
}

function NutritionCard({
  nutritionSuggestion,
}: {
  nutritionSuggestion: NutritionSuggestion | null;
}) {
  if (!nutritionSuggestion) {
    return (
      <div className="text-sm text-muted-foreground">
        {API_FALLBACKS.nutrition}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-bg-elevated p-3">
      <div className="mb-1 text-sm font-medium text-foreground">
        Wellness Suggestion
      </div>
      <div className="mb-1 text-sm font-medium text-foreground">
        {nutritionSuggestion.food}
      </div>
      <div className="mb-2 text-sm text-muted-foreground">
        {nutritionSuggestion.reason}
      </div>
      <div className="flex flex-wrap gap-1">
        {nutritionSuggestion.benefits.map((benefit) => (
          <span
            key={benefit}
            className="rounded-full bg-bg-elevated px-2 py-1 text-xs text-[color:var(--accent-peach)]"
          >
            {benefit}
          </span>
        ))}
      </div>
    </div>
  );
}
