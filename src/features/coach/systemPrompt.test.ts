import { describe, expect, it } from "vitest";

import { COACH_SYSTEM_PROMPT } from "./systemPrompt";

describe("COACH_SYSTEM_PROMPT — safety boundaries", () => {
  it("explicitly forbids medical/hormone diagnosis and causation claims", () => {
    expect(COACH_SYSTEM_PROMPT).toMatch(/must never/i);
    expect(COACH_SYSTEM_PROMPT).toMatch(/diagnose medical conditions or hormone disorders/i);
    expect(COACH_SYSTEM_PROMPT).toMatch(/claim to know or measure hormone levels/i);
    expect(COACH_SYSTEM_PROMPT).toMatch(/caused a mood, behaviour, or relationship event/i);
  });

  it("explicitly forbids relationship/attachment diagnosis and dosage advice", () => {
    expect(COACH_SYSTEM_PROMPT).toMatch(/diagnose relationship problems or attachment styles/i);
    expect(COACH_SYSTEM_PROMPT).toMatch(/medication dosage advice/i);
    expect(COACH_SYSTEM_PROMPT).toMatch(/cycle caused a specific relationship conflict/i);
  });

  it("forbids inventing patterns not present in the given context", () => {
    expect(COACH_SYSTEM_PROMPT).toMatch(/invent a pattern, trend, or observation/i);
  });

  it("explicitly denies access to Vault, partner messages, and private relationship reflections", () => {
    expect(COACH_SYSTEM_PROMPT).toMatch(/vault entries/i);
    expect(COACH_SYSTEM_PROMPT).toMatch(/partner messages\/replies/i);
    expect(COACH_SYSTEM_PROMPT).toMatch(/mutual reveal\/repair\/weekly us/i);
  });

  it("requires a structured JSON response with the four analytical fields plus partnerTranslationAvailable", () => {
    for (const field of ["fromLogs", "generalContext", "questionToConsider", "optionalNextStep", "partnerTranslationAvailable"]) {
      expect(COACH_SYSTEM_PROMPT).toContain(field);
    }
  });

  it("does not itself contain forbidden biological-causation example phrasing as an instruction to say", () => {
    expect(COACH_SYSTEM_PROMPT).not.toMatch(/your progesterone caused/i);
    expect(COACH_SYSTEM_PROMPT).not.toMatch(/estrogen (is|are) at their lowest/i);
  });
});
