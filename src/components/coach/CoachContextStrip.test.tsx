import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CoachContextStrip } from "./CoachContextStrip";
import { DEFAULT_COACH_CONTEXT_SELECTION } from "@/types/coach";

describe("CoachContextStrip", () => {
  it("lists the currently enabled real sources", () => {
    render(<CoachContextStrip selection={DEFAULT_COACH_CONTEXT_SELECTION} onManageContext={vi.fn()} />);

    expect(screen.getByText(/daily check-ins/i)).toBeInTheDocument();
    expect(screen.getByText(/cycle context/i)).toBeInTheDocument();
    expect(screen.getByText(/period history/i)).toBeInTheDocument();
  });

  it("never lists Recent Observations as in use, even if the selection somehow has it true", () => {
    render(
      <CoachContextStrip
        selection={{ ...DEFAULT_COACH_CONTEXT_SELECTION, recentObservations: true }}
        onManageContext={vi.fn()}
      />,
    );

    expect(screen.queryByText(/recent observations/i)).not.toBeInTheDocument();
  });

  it("shows an honest empty message when nothing is enabled", () => {
    render(
      <CoachContextStrip
        selection={{ dailyCheckIns: false, cycleContext: false, periodHistory: false, recentObservations: false }}
        onManageContext={vi.fn()}
      />,
    );

    expect(screen.getByText("No context sources enabled")).toBeInTheDocument();
  });

  it("calls onManageContext when the Manage context link is clicked", () => {
    const onManageContext = vi.fn();
    render(<CoachContextStrip selection={DEFAULT_COACH_CONTEXT_SELECTION} onManageContext={onManageContext} />);

    fireEvent.click(screen.getByText("Manage context"));

    expect(onManageContext).toHaveBeenCalledTimes(1);
  });
});
