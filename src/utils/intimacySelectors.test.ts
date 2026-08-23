import { describe, expect, it } from "vitest";
import {
  getBoundaryCounts,
  getBoundariesByStatus,
  getSessionSummary,
  hasReflection,
} from "@/utils/intimacySelectors";
import type { BoundaryItemRecord, IntimacySession } from "@/schemas/intimacy";

const boundaries: BoundaryItemRecord[] = [
  {
    id: "yes-1",
    user_id: "user-1",
    label: "Hugs are welcome",
    status: "yes",
    created_at: "2026-08-22T00:00:00.000Z",
    updated_at: "2026-08-22T00:00:00.000Z",
  },
  {
    id: "maybe-1",
    user_id: "user-1",
    label: "Ask first",
    status: "maybe",
    created_at: "2026-08-22T00:00:00.000Z",
    updated_at: "2026-08-22T00:00:00.000Z",
  },
  {
    id: "no-1",
    user_id: "user-1",
    label: "No surprises",
    status: "no",
    created_at: "2026-08-22T00:00:00.000Z",
    updated_at: "2026-08-22T00:00:00.000Z",
  },
];

describe("intimacy selectors", () => {
  it("filters boundaries by status", () => {
    expect(getBoundariesByStatus(boundaries, "maybe")).toEqual([
      boundaries[1],
    ]);
  });

  it("counts boundaries by status", () => {
    expect(getBoundaryCounts(boundaries)).toEqual({
      maybe: 1,
      no: 1,
      yes: 1,
    });
  });

  it("summarizes selected sessions", () => {
    const session: IntimacySession = {
      id: "session-1",
      user_id: "user-1",
      date: "2026-08-22",
      selected_card_id: "card-1",
      shared_with_partner: true,
      reflection: "A good conversation.",
      created_at: "2026-08-22T00:00:00.000Z",
      selected_card: {
        id: "card-1",
        category: "talk",
        difficulty: 2,
        text: "Share one thing you need.",
        phase_tags: ["any"],
        active: true,
      },
    };

    expect(getSessionSummary(session)).toBe("Conversation - Moderate");
    expect(hasReflection(session)).toBe(true);
  });

  it("handles sessions without selected cards or reflection", () => {
    const session: IntimacySession = {
      id: "session-1",
      user_id: "user-1",
      date: "2026-08-22",
      selected_card_id: "card-1",
      shared_with_partner: false,
      reflection: "  ",
      created_at: "2026-08-22T00:00:00.000Z",
    };

    expect(getSessionSummary(session)).toBe("No card selected today");
    expect(hasReflection(session)).toBe(false);
  });
});
