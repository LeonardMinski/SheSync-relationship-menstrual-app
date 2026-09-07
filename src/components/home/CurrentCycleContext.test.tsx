import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CurrentCycleContext } from "./CurrentCycleContext";
import type { HomeState } from "@/features/home/homeState";
import type { PeriodDayLog } from "@/types/period";

function dayLog(overrides: Partial<PeriodDayLog> = {}): PeriodDayLog {
  return {
    id: "log-1",
    period_id: "period-1",
    user_id: "user-1",
    date: "2026-09-05",
    bleeding_level: "heavy",
    bleeding_colour: null,
    clots: "none",
    cramps: 6,
    lower_back_pain: 2,
    headache: "mild",
    bloating: "mild",
    fatigue: 7,
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

describe("CurrentCycleContext — read-only period summary", () => {
  it("renders active-period facts with no input controls", () => {
    const homeState = {
      variant: "active_period",
      periodDay: 2,
      loggedPeriodCount: 0,
      hasEnoughHistoryForObservation: false,
    } as HomeState;

    render(<CurrentCycleContext homeState={homeState} todayLog={dayLog({ bleeding_level: "heavy", cramps: 6, fatigue: 7 })} />);

    expect(screen.getByText("Period Day 2")).toBeInTheDocument();
    expect(screen.getByText("Heavy")).toBeInTheDocument();
    expect(screen.getByText("6/10")).toBeInTheDocument();
    expect(screen.getByText("7/10")).toBeInTheDocument();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(document.querySelector("input")).toBeNull();
  });

  it("links to Cycle to update the period log, rather than embedding the form here", () => {
    const homeState = {
      variant: "active_period",
      periodDay: 2,
      loggedPeriodCount: 0,
      hasEnoughHistoryForObservation: false,
    } as HomeState;

    render(<CurrentCycleContext homeState={homeState} todayLog={dayLog()} />);

    const link = screen.getByText(/update period log/i).closest("a");
    expect(link).toHaveAttribute("href", "/cycle");
  });

  it("shows an honest not-logged state before today's period log exists", () => {
    const homeState = {
      variant: "active_period",
      periodDay: 1,
      loggedPeriodCount: 0,
      hasEnoughHistoryForObservation: false,
    } as HomeState;

    render(<CurrentCycleContext homeState={homeState} todayLog={null} />);

    expect(screen.getByText("Not logged yet today.")).toBeInTheDocument();
    expect(screen.getByText(/log today's period/i)).toBeInTheDocument();
  });

  it("shows the real cycle day and last period between periods, with no input controls", () => {
    const homeState = {
      variant: "between_periods",
      loggedPeriodCount: 1,
      hasEnoughHistoryForObservation: false,
      cycleDayEstimate: 18,
      lastCompletedPeriod: {
        id: "p1",
        start_date: "2026-08-04",
        end_date: "2026-08-08",
        isActive: false,
        durationDays: 5,
        loggedDayCount: 5,
      },
    } as HomeState;

    render(<CurrentCycleContext homeState={homeState} todayLog={null} />);

    expect(screen.getByText("Cycle Day 18")).toBeInTheDocument();
    expect(screen.getByText(/Aug 4/)).toBeInTheDocument();
    expect(document.querySelector("input")).toBeNull();
  });

  it("shows an honest first-time prompt with no period history at all", () => {
    const homeState = {
      variant: "new",
      loggedPeriodCount: 0,
      hasEnoughHistoryForObservation: false,
    } as HomeState;

    render(<CurrentCycleContext homeState={homeState} todayLog={null} />);

    expect(screen.getByText(/track your period whenever it starts/i)).toBeInTheDocument();
  });
});
