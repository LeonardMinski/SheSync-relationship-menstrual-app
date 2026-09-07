import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LogPeriodDayDialog } from "./LogPeriodDayDialog";
import type { PeriodDayLog } from "@/types/period";

function dayLog(overrides: Partial<PeriodDayLog> = {}): PeriodDayLog {
  return {
    id: "log-1",
    period_id: "period-1",
    user_id: "user-1",
    date: "2026-09-05",
    bleeding_level: "medium",
    bleeding_colour: null,
    clots: "none",
    cramps: 4,
    lower_back_pain: 2,
    headache: "mild",
    bloating: "mild",
    fatigue: 6,
    nausea: "none",
    bowel_changes: "normal",
    sleep_quality: 4,
    mood: 3,
    pain_relief_used: false,
    pain_relief_medication: null,
    pain_relief_time: null,
    activity_impact: "none",
    notes: null,
    created_at: "2026-09-05T00:00:00.000Z",
    updated_at: "2026-09-05T00:00:00.000Z",
    ...overrides,
  };
}

describe("LogPeriodDayDialog — canonical mood prefill", () => {
  it("prefills mood from the canonical daily value when it already exists, over the period log's own stored value", () => {
    render(
      <LogPeriodDayDialog
        selectedDate={new Date("2026-09-05T12:00:00")}
        existingLog={dayLog({ mood: 3 })}
        canonicalMood={8}
        saving={false}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/mood today: 8/i)).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByLabelText(/mood today: 3/i)).toHaveAttribute("aria-pressed", "false");
  });

  it("falls back to the period log's own historical mood when there is no canonical value yet — never destructively rewritten", () => {
    render(
      <LogPeriodDayDialog
        selectedDate={new Date("2026-09-05T12:00:00")}
        existingLog={dayLog({ mood: 3 })}
        canonicalMood={null}
        saving={false}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/mood today: 3/i)).toHaveAttribute("aria-pressed", "true");
  });

  it("falls back to the default mood of 5 for a brand-new log with no canonical value and no history", () => {
    render(
      <LogPeriodDayDialog
        selectedDate={new Date("2026-09-05T12:00:00")}
        existingLog={null}
        canonicalMood={null}
        saving={false}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/mood today: 5/i)).toHaveAttribute("aria-pressed", "true");
  });
});
