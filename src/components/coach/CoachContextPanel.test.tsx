import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CoachContextPanel } from "./CoachContextPanel";
import { DEFAULT_COACH_CONTEXT_SELECTION } from "@/types/coach";

describe("CoachContextPanel — user controls enabled sources (staged, explicit save)", () => {
  it("renders a labelled toggle for each real source with its current state", () => {
    render(
      <CoachContextPanel
        selection={DEFAULT_COACH_CONTEXT_SELECTION}
        recentObservationsAvailable={false}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Daily check-ins")).toBeChecked();
    expect(screen.getByLabelText("Cycle context")).toBeChecked();
    expect(screen.getByLabelText("Period history")).toBeChecked();
  });

  it("toggling a source does not call onSave until Save Changes is clicked", () => {
    const onSave = vi.fn();
    render(
      <CoachContextPanel selection={DEFAULT_COACH_CONTEXT_SELECTION} recentObservationsAvailable={false} onSave={onSave} onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByLabelText("Daily check-ins"));

    expect(onSave).not.toHaveBeenCalled();
  });

  it("Save Changes commits the full draft selection and closes the panel", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <CoachContextPanel selection={DEFAULT_COACH_CONTEXT_SELECTION} recentObservationsAvailable={false} onSave={onSave} onClose={onClose} />,
    );

    fireEvent.click(screen.getByLabelText("Daily check-ins"));
    fireEvent.click(screen.getByText("Save Changes"));

    expect(onSave).toHaveBeenCalledWith({ ...DEFAULT_COACH_CONTEXT_SELECTION, dailyCheckIns: false });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closing without saving discards the draft — onSave is never called", () => {
    const onSave = vi.fn();
    render(
      <CoachContextPanel selection={DEFAULT_COACH_CONTEXT_SELECTION} recentObservationsAvailable={false} onSave={onSave} onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByLabelText("Daily check-ins"));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onSave).not.toHaveBeenCalled();
  });

  it("Recent Observations is disabled and unchecked when the caller has no real observations yet", () => {
    render(
      <CoachContextPanel
        selection={{ ...DEFAULT_COACH_CONTEXT_SELECTION, recentObservations: true }}
        recentObservationsAvailable={false}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const toggle = screen.getByLabelText("Recent observations");
    expect(toggle).toBeDisabled();
    expect(toggle).not.toBeChecked();
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
  });

  it("clicking the disabled Recent Observations toggle never affects the draft", () => {
    const onSave = vi.fn();
    render(
      <CoachContextPanel selection={DEFAULT_COACH_CONTEXT_SELECTION} recentObservationsAvailable={false} onSave={onSave} onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByLabelText("Recent observations"));
    fireEvent.click(screen.getByText("Save Changes"));

    expect(onSave).toHaveBeenCalledWith(DEFAULT_COACH_CONTEXT_SELECTION);
  });

  it("Recent Observations becomes a real, toggleable source once the caller has actual Pattern Engine data", () => {
    const onSave = vi.fn();
    render(
      <CoachContextPanel
        selection={{ ...DEFAULT_COACH_CONTEXT_SELECTION, recentObservations: true }}
        recentObservationsAvailable={true}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );

    const toggle = screen.getByLabelText("Recent observations");
    expect(toggle).not.toBeDisabled();
    expect(toggle).toBeChecked();
    expect(screen.queryByText(/not available yet/i)).not.toBeInTheDocument();

    fireEvent.click(toggle);
    fireEvent.click(screen.getByText("Save Changes"));

    expect(onSave).toHaveBeenCalledWith({ ...DEFAULT_COACH_CONTEXT_SELECTION, recentObservations: false });
  });

  it("lists Vault, partner messages, and private relationship reflections as not accessible", () => {
    render(
      <CoachContextPanel
        selection={DEFAULT_COACH_CONTEXT_SELECTION}
        recentObservationsAvailable={false}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Vault entries")).toBeInTheDocument();
    expect(screen.getByText("Partner messages and replies")).toBeInTheDocument();
    expect(screen.getByText("Private relationship reflections")).toBeInTheDocument();
    expect(screen.getByText("Mutual Reveal private answers")).toBeInTheDocument();
    expect(screen.getByText("Repair private answers")).toBeInTheDocument();
    expect(screen.getByText("Weekly Us private answers")).toBeInTheDocument();
  });

  it("does not claim end-to-end encryption or any unverified security guarantee", () => {
    render(
      <CoachContextPanel
        selection={DEFAULT_COACH_CONTEXT_SELECTION}
        recentObservationsAvailable={false}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/end-to-end encrypted/i);
    expect(text).not.toMatch(/fully encrypted/i);
    expect(text).not.toMatch(/zero knowledge/i);
  });

  it("closes via Escape (Modal's built-in focus/keyboard handling)", () => {
    const onClose = vi.fn();
    render(
      <CoachContextPanel
        selection={DEFAULT_COACH_CONTEXT_SELECTION}
        recentObservationsAvailable={false}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
