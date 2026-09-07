import { describe, expect, it } from "vitest";

import { parseCoachReply } from "./openaiClient";

describe("parseCoachReply", () => {
  it("parses a fully structured reply", () => {
    const raw = JSON.stringify({
      message: "Here's what I'm noticing.",
      fromLogs: "Your recent check-ins show lower energy on Tuesday and Wednesday.",
      generalContext: "Energy can vary for many reasons, including sleep and stress.",
      questionToConsider: "Has anything else changed this week?",
      optionalNextStep: "Keep logging for a few more days.",
      partnerTranslationAvailable: true,
    });

    const result = parseCoachReply(raw);

    expect(result.message).toBe("Here's what I'm noticing.");
    expect(result.fromLogs).toContain("Tuesday");
    expect(result.partnerTranslationAvailable).toBe(true);
  });

  it("leaves unset structured fields as null rather than empty strings", () => {
    const raw = JSON.stringify({ message: "Just a simple reply.", partnerTranslationAvailable: false });

    const result = parseCoachReply(raw);

    expect(result.fromLogs).toBeNull();
    expect(result.generalContext).toBeNull();
    expect(result.questionToConsider).toBeNull();
    expect(result.optionalNextStep).toBeNull();
  });

  it("treats an empty-string structured field the same as absent (null), not a blank section", () => {
    const raw = JSON.stringify({ message: "Reply.", fromLogs: "   ", partnerTranslationAvailable: false });

    const result = parseCoachReply(raw);

    expect(result.fromLogs).toBeNull();
  });

  it("falls back to the raw text as a plain message when the model returns invalid JSON, rather than failing", () => {
    const result = parseCoachReply("Sorry, I'm not sure — could you say more about that?");

    expect(result.message).toBe("Sorry, I'm not sure — could you say more about that?");
    expect(result.fromLogs).toBeNull();
    expect(result.partnerTranslationAvailable).toBe(false);
  });

  it("falls back safely when JSON is valid but missing the required message field", () => {
    const raw = JSON.stringify({ fromLogs: "some data" });

    const result = parseCoachReply(raw);

    expect(result.message).toBe(raw);
    expect(result.fromLogs).toBeNull();
  });

  it("never throws on malformed input", () => {
    expect(() => parseCoachReply("{not: valid json")).not.toThrow();
    expect(() => parseCoachReply("")).not.toThrow();
    expect(() => parseCoachReply("null")).not.toThrow();
  });

  it("defaults partnerTranslationAvailable to false unless explicitly true", () => {
    expect(parseCoachReply(JSON.stringify({ message: "x" })).partnerTranslationAvailable).toBe(false);
    expect(parseCoachReply(JSON.stringify({ message: "x", partnerTranslationAvailable: "true" })).partnerTranslationAvailable).toBe(
      false,
    );
  });
});
