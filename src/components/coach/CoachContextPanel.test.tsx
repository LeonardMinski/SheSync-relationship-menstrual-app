import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CoachContextPanel } from "./CoachContextPanel";
import { DEFAULT_COACH_CONTEXT_SELECTION } from "@/types/coach";

describe("CoachContextPanel — user controls enabled sources", () => {
  it("renders a labelled toggle for each real source with its current state", () => {
    render(<CoachContextPanel selection={DEFAULT_COACH_CONTEXT_SELECTION} onChange={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByLabelText("Daily check-ins")).toBeChecked();
    expect(screen.getByLabelText("Cycle context")).toBeChecked();
    expect(screen.getByLabelText("Period history")).toBeChecked();
  });

  it("calls onChange with the toggled source flipped when a toggle is clicked", () => {
    const onChange = vi.fn();
    render(<CoachContextPanel selection={DEFAULT_COACH_CONTEXT_SELECTION} onChange={onChange} onClose={vi.fn()} />);

    fireEvent.click(screen.getByLabelText("Daily check-ins"));

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_COACH_CONTEXT_SELECTION, dailyCheckIns: false });
  });

  it("Recent Observations is always disabled and unchecked — no Pattern Engine exists yet", () => {
    render(
      <CoachContextPanel
        selection={{ ...DEFAULT_COACH_CONTEXT_SELECTION, recentObservations: true }}
        onChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const toggle = screen.getByLabelText("Recent observations");
    expect(toggle).toBeDisabled();
    expect(toggle).not.toBeChecked();
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
  });

  it("clicking the disabled Recent Observations toggle never calls onChange", () => {
    const onChange = vi.fn();
    render(<CoachContextPanel selection={DEFAULT_COACH_CONTEXT_SELECTION} onChange={onChange} onClose={vi.fn()} />);

    fireEvent.click(screen.getByLabelText("Recent observations"));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("lists Vault, partner messages, and private relationship reflections as not accessible", () => {
    render(<CoachContextPanel selection={DEFAULT_COACH_CONTEXT_SELECTION} onChange={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText("Vault entries")).toBeInTheDocument();
    expect(screen.getByText("Partner messages and replies")).toBeInTheDocument();
    expect(screen.getByText("Private relationship reflections")).toBeInTheDocument();
    expect(screen.getByText("Mutual Reveal private answers")).toBeInTheDocument();
    expect(screen.getByText("Repair private answers")).toBeInTheDocument();
    expect(screen.getByText("Weekly Us private answers")).toBeInTheDocument();
  });

  it("does not claim end-to-end encryption or any unverified security guarantee", () => {
    render(<CoachContextPanel selection={DEFAULT_COACH_CONTEXT_SELECTION} onChange={vi.fn()} onClose={vi.fn()} />);

    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/end-to-end encrypted/i);
    expect(text).not.toMatch(/fully encrypted/i);
    expect(text).not.toMatch(/zero knowledge/i);
  });

  it("closes via Escape (Modal's built-in focus/keyboard handling)", () => {
    const onClose = vi.fn();
    render(<CoachContextPanel selection={DEFAULT_COACH_CONTEXT_SELECTION} onChange={vi.fn()} onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
