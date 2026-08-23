import { describe, expect, it } from "vitest";
import {
  getHealthInsights,
  getNutritionSuggestion,
} from "@/services/cycle/insights";

describe("cycle insights", () => {
  it("adds fatigue-specific energy guidance", async () => {
    const insights = await getHealthInsights("menstrual", ["fatigue"]);

    expect(insights.some((insight) => insight.tip.includes("Fatigue"))).toBe(
      true,
    );
  });

  it("falls back to luteal nutrition for unknown phases", async () => {
    const suggestion = await getNutritionSuggestion("unknown", 6);

    expect(suggestion?.food).toBe("Magnesium-rich foods");
  });

  it("includes low-mood context in nutrition guidance", async () => {
    const suggestion = await getNutritionSuggestion("follicular", 2);

    expect(suggestion?.reason).toContain("mood-supportive nutrients");
  });
});
