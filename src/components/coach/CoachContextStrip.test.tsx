import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CoachContextStrip } from "./CoachContextStrip";
import { DEFAULT_COACH_CONTEXT_SELECTION } from "@/types/coach";

describe("CoachContextStrip", () => {
  it("lists the currently enabled real sources", () => {
    render(
      <CoachContextStrip selection={DEFAULT_COACH_CONTEXT_SELECTION} recentObservationsAvailable={false} onManageContext={vi.fn()} />,
    );

    expect(screen.getByText(/daily check-ins/i)).toBeInTheDocument();
    expect(screen.getByText(/cycle context/i)).toBeInTheDocument();
    expect(screen.getByText(/period history/i)).toBeInTheDocument();
  });

  it("does not list Recent Observations as in use when enabled but the caller has no real observations yet", () => {
    render(
      <CoachContextStrip
        selection={{ ...DEFAULT_COACH_CONTEXT_SELECTION, recentObservations: true }}
        recentObservationsAvailable={false}
        onManageContext={vi.fn()}
      />,
    );

    expect(screen.queryByText(/recent observations/i)).not.toBeInTheDocument();
  });

  it("lists Recent Observations as in use once real Pattern Engine data exists and the source is enabled", () => {
    render(
      <CoachContextStrip
        selection={{ ...DEFAULT_COACH_CONTEXT_SELECTION, recentObservations: true }}
        recentObservationsAvailable={true}
        onManageContext={vi.fn()}
      />,
    );

    expect(screen.getByText(/recent observations/i)).toBeInTheDocument();
  });

  it("does not list Recent Observations when it's available but the user turned it off", () => {
    render(
      <CoachContextStrip
        selection={{ ...DEFAULT_COACH_CONTEXT_SELECTION, recentObservations: false }}
        recentObservationsAvailable={true}
        onManageContext={vi.fn()}
      />,
    );

    expect(screen.queryByText(/recent observations/i)).not.toBeInTheDocument();
  });

  it("shows an honest empty message when nothing is enabled", () => {
    render(
      <CoachContextStrip
        selection={{ dailyCheckIns: false, cycleContext: false, periodHistory: false, recentObservations: false }}
        recentObservationsAvailable={false}
        onManageContext={vi.fn()}
      />,
    );

    expect(screen.getByText("No context sources enabled")).toBeInTheDocument();
  });

  it("calls onManageContext when the Manage context link is clicked", () => {
    const onManageContext = vi.fn();
    render(
      <CoachContextStrip selection={DEFAULT_COACH_CONTEXT_SELECTION} recentObservationsAvailable={false} onManageContext={onManageContext} />,
    );

    fireEvent.click(screen.getByText("Manage context"));

    expect(onManageContext).toHaveBeenCalledTimes(1);
  });
});
