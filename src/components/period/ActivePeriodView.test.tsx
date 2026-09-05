import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ActivePeriodView } from "./ActivePeriodView";
import type { Period, PeriodDayLog } from "@/types/period";

function period(overrides: Partial<Period> = {}): Period {
  return {
    id: "period-1",
    user_id: "user-1",
    start_date: "2026-09-03",
    end_date: null,
    created_at: "2026-09-03T00:00:00.000Z",
    updated_at: "2026-09-03T00:00:00.000Z",
    ...overrides,
  };
}

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
    mood: 5,
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

// Real system clock context for these tests: "today" is 2026-09-05 (per the
// currentDate context this session runs under), matching the period.utils
// day-derivation logic against a start_date of 2026-09-03 -> Period Day 3.

const BANNED_PHRASES = [
  /estrogen/i,
  /progesterone/i,
  /are at their lowest/i,
  /ginger or peppermint/i,
  /significantly reduce cramping/i,
  /predicted/i,
];

describe("ActivePeriodView product truth", () => {
  it("never renders hormone-causation or treatment-advice claims", () => {
    render(
      <ActivePeriodView
        period={period()}
        todayLog={null}
        onLogToday={vi.fn()}
        onEndPeriod={vi.fn()}
        ending={false}
      />,
    );

    for (const phrase of BANNED_PHRASES) {
      expect(screen.queryByText(phrase)).not.toBeInTheDocument();
    }
  });

  it("never labels timeline days as predicted", () => {
    render(
      <ActivePeriodView
        period={period()}
        todayLog={dayLog()}
        onLogToday={vi.fn()}
        onEndPeriod={vi.fn()}
        ending={false}
      />,
    );

    expect(screen.queryByText(/predicted/i)).not.toBeInTheDocument();
  });
});

describe("ActivePeriodView real data rendering", () => {
  it("shows honest 'not logged' state before today's log exists", () => {
    render(
      <ActivePeriodView
        period={period()}
        todayLog={null}
        onLogToday={vi.fn()}
        onEndPeriod={vi.fn()}
        ending={false}
      />,
    );

    expect(screen.getByText(/haven't logged today yet/i)).toBeInTheDocument();
    expect(screen.getByText("Log Today's State")).toBeInTheDocument();
  });

  it("shows real snapshot values once today's log exists", () => {
    render(
      <ActivePeriodView
        period={period()}
        todayLog={dayLog({ cramps: 7, mood: 8 })}
        onLogToday={vi.fn()}
        onEndPeriod={vi.fn()}
        ending={false}
      />,
    );

    expect(screen.getByText("7/10")).toBeInTheDocument();
    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(screen.getByText("Update Today's State")).toBeInTheDocument();
    expect(screen.getByText("Logged")).toBeInTheDocument();
  });
});
