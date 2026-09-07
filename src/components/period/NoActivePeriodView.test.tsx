import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NoActivePeriodView } from "./NoActivePeriodView";
import type { PeriodSummary } from "@/types/period";

function summary(overrides: Partial<PeriodSummary> = {}): PeriodSummary {
  return {
    id: "period-1",
    start_date: "2026-08-03",
    end_date: "2026-08-07",
    isActive: false,
    durationDays: 5,
    loggedDayCount: 5,
    ...overrides,
  };
}

const BANNED_PHRASES = [
  /follicular phase/i,
  /estrogen/i,
  /progesterone/i,
  /expected period in/i,
  /highly regular/i,
  /mild bloating likely/i,
  /mood remains reflective/i,
];

describe("NoActivePeriodView product truth", () => {
  it("never renders fabricated phase/hormone/prediction/regularity claims with no history", () => {
    render(
      <NoActivePeriodView history={[]} onStartPeriod={vi.fn()} starting={false} />,
    );

    for (const phrase of BANNED_PHRASES) {
      expect(screen.queryByText(phrase)).not.toBeInTheDocument();
    }
  });

  it("never renders fabricated claims even with some history", () => {
    render(
      <NoActivePeriodView
        history={[summary(), summary({ id: "period-2", start_date: "2026-07-01", end_date: "2026-07-06" })]}
        onStartPeriod={vi.fn()}
        starting={false}
      />,
    );

    for (const phrase of BANNED_PHRASES) {
      expect(screen.queryByText(phrase)).not.toBeInTheDocument();
    }
  });
});

describe("NoActivePeriodView evidence-gated average cycle length", () => {
  it("shows 'Still learning your cycle' with fewer than 3 completed periods", () => {
    render(
      <NoActivePeriodView
        history={[summary(), summary({ id: "period-2", start_date: "2026-07-01" })]}
        onStartPeriod={vi.fn()}
        starting={false}
      />,
    );

    expect(screen.getByText("Still learning your cycle")).toBeInTheDocument();
    expect(screen.queryByText(/days avg/i)).not.toBeInTheDocument();
  });

  it("shows a real computed average once 3+ completed periods exist", () => {
    render(
      <NoActivePeriodView
        history={[
          summary({ id: "p3", start_date: "2026-09-05" }),
          summary({ id: "p2", start_date: "2026-08-03" }),
          summary({ id: "p1", start_date: "2026-07-01" }),
        ]}
        onStartPeriod={vi.fn()}
        starting={false}
      />,
    );

    expect(screen.getByText(/days avg/i)).toBeInTheDocument();
    expect(screen.queryByText("Still learning your cycle")).not.toBeInTheDocument();
  });
});

describe("NoActivePeriodView primary/secondary actions", () => {
  it("uses 'Start Period' as the primary CTA, not a generic logging label", () => {
    render(<NoActivePeriodView history={[]} onStartPeriod={vi.fn()} starting={false} />);

    expect(screen.getByText("Start Period")).toBeInTheDocument();
    expect(screen.queryByText(/log today.?s state/i)).not.toBeInTheDocument();
  });

  it("never renders a 'No period this month' primary action", () => {
    render(
      <NoActivePeriodView history={[summary()]} onStartPeriod={vi.fn()} starting={false} />,
    );

    expect(screen.queryByText(/no period this month/i)).not.toBeInTheDocument();
  });

  it("hides 'Add Past Period' when no handler is supplied", () => {
    render(<NoActivePeriodView history={[]} onStartPeriod={vi.fn()} starting={false} />);

    expect(screen.queryByText("Add Past Period")).not.toBeInTheDocument();
  });

  it("shows 'Add Past Period' as a secondary action and invokes the handler on click", () => {
    const onAddPastPeriod = vi.fn();
    render(
      <NoActivePeriodView
        history={[]}
        onStartPeriod={vi.fn()}
        starting={false}
        onAddPastPeriod={onAddPastPeriod}
      />,
    );

    screen.getByText("Add Past Period").click();
    expect(onAddPastPeriod).toHaveBeenCalledTimes(1);
  });
});

describe("NoActivePeriodView empty state", () => {
  it("shows an honest empty state with zero period history", () => {
    render(
      <NoActivePeriodView history={[]} onStartPeriod={vi.fn()} starting={false} />,
    );

    expect(screen.getByText("No periods logged yet")).toBeInTheDocument();
  });

  it("shows the real last period dates and duration when history exists", () => {
    render(
      <NoActivePeriodView history={[summary()]} onStartPeriod={vi.fn()} starting={false} />,
    );

    expect(screen.getByText("Aug 3 – Aug 7")).toBeInTheDocument();
    expect(screen.getByText(/Duration: 5 days/)).toBeInTheDocument();
  });
});
