import { describe, expect, it } from "vitest";

import {
  COACH_COMPOSER_PLACEHOLDER,
  COACH_CONTEXT_NOT_ACCESSIBLE,
  COACH_CONTEXT_SOURCES,
  COACH_EMPTY_STATE_PROMPT,
  COACH_ERROR_BODY,
  COACH_ERROR_TITLE,
  COACH_HEADER_SUBTITLE,
  COACH_PARTNER_TRANSLATION_CTA,
  COACH_PRIVACY_EXPLANATION,
  COACH_RECENT_OBSERVATIONS_UNAVAILABLE_TEXT,
  COACH_STARTER_CARDS,
  COACH_THINKING_TEXT,
} from "./coach.constants";

const FORBIDDEN_PHRASES = [
  /biological rhythm/i,
  /biological context/i,
  /biological understanding/i,
  /automated logs analysis/i,
  /hormone peak/i,
  /hormone level/i,
  /progesterone/i,
  /estrogen/i,
  /social energy naturally contract/i,
  /natural hormonal peak/i,
  /biological trigger/i,
  /bio-context/i,
  /relationship satisfaction increases/i,
  /end-to-end encrypted/i,
  /fully encrypted/i,
  /zero knowledge/i,
  /nothing is shared/i,
];

function allCoachCopyStrings(): string[] {
  return [
    COACH_HEADER_SUBTITLE,
    COACH_EMPTY_STATE_PROMPT,
    COACH_COMPOSER_PLACEHOLDER,
    COACH_PRIVACY_EXPLANATION,
    COACH_THINKING_TEXT,
    COACH_ERROR_TITLE,
    COACH_ERROR_BODY,
    COACH_PARTNER_TRANSLATION_CTA,
    COACH_RECENT_OBSERVATIONS_UNAVAILABLE_TEXT,
    ...COACH_STARTER_CARDS.flatMap((card) => [card.title, card.description, card.ctaLabel]),
    ...COACH_CONTEXT_SOURCES.flatMap((source) => [source.label, source.description]),
    ...COACH_CONTEXT_NOT_ACCESSIBLE,
  ];
}

describe("Coach copy audit", () => {
  it("contains no forbidden biological/hormonal or unverified-encryption language anywhere", () => {
    const allText = allCoachCopyStrings().join(" \n ");
    for (const phrase of FORBIDDEN_PHRASES) {
      expect(allText).not.toMatch(phrase);
    }
  });

  it("every starter card has an explicit, non-vague CTA", () => {
    const vague = [/^learn more$/i, /^view$/i, /^continue$/i];
    for (const card of COACH_STARTER_CARDS) {
      expect(card.ctaLabel.length).toBeGreaterThan(0);
      for (const phrase of vague) {
        expect(card.ctaLabel).not.toMatch(phrase);
      }
    }
  });

  it("has exactly four starter cards", () => {
    expect(COACH_STARTER_CARDS).toHaveLength(4);
  });

  it("lists Recent Observations among the context sources, described honestly as unavailable rather than omitted or faked", () => {
    const recentObservations = COACH_CONTEXT_SOURCES.find((s) => s.key === "recentObservations");
    expect(recentObservations).toBeDefined();
    expect(COACH_RECENT_OBSERVATIONS_UNAVAILABLE_TEXT).toMatch(/not available/i);
  });

  it("lists every required 'not accessible' source", () => {
    for (const required of [
      "Vault entries",
      "Partner messages and replies",
      "Private relationship reflections",
      "Mutual Reveal private answers",
      "Repair private answers",
      "Weekly Us private answers",
    ]) {
      expect(COACH_CONTEXT_NOT_ACCESSIBLE).toContain(required);
    }
  });
});
