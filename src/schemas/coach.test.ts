import { describe, expect, it } from "vitest";

import { SendCoachMessageInputSchema } from "./coach";

describe("SendCoachMessageInputSchema", () => {
  it("accepts a plain message with no context selection", () => {
    expect(SendCoachMessageInputSchema.safeParse({ content: "hello" }).success).toBe(true);
  });

  it("rejects an empty message", () => {
    expect(SendCoachMessageInputSchema.safeParse({ content: "" }).success).toBe(false);
  });

  it("rejects a message over the length limit", () => {
    expect(SendCoachMessageInputSchema.safeParse({ content: "a".repeat(4001) }).success).toBe(false);
  });

  it("accepts a full, valid context selection", () => {
    const result = SendCoachMessageInputSchema.safeParse({
      content: "hello",
      context: { dailyCheckIns: true, cycleContext: false, periodHistory: true, recentObservations: false },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a context selection missing a required key", () => {
    const result = SendCoachMessageInputSchema.safeParse({
      content: "hello",
      context: { dailyCheckIns: true },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an arbitrary ownerUserId smuggled into the body", () => {
    expect(SendCoachMessageInputSchema.safeParse({ content: "hello", ownerUserId: "someone-else" }).success).toBe(false);
  });
});
