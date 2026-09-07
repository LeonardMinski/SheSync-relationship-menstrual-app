import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DailyCheckIn } from "./DailyCheckIn";
import { saveDailyCheckIn, upsertDailyMood } from "@/services/cycle/dailyMood";

vi.mock("@/services/cycle/dailyMood", () => ({
  upsertDailyMood: vi.fn(),
  saveDailyCheckIn: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("DailyCheckIn — lightweight default", () => {
  it("renders exactly the five one-tap mood options and no symptom/phase form fields", () => {
    render(<DailyCheckIn date="2026-09-01" hasActivePeriodToday={false} todaysEntry={null} onSaved={vi.fn()} />);

    for (const label of ["Very low", "Low", "Okay", "Good", "Great"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByText(/cycle phase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/symptoms/i)).not.toBeInTheDocument();
  });

  it("keeps the optional context panel collapsed by default", () => {
    render(<DailyCheckIn date="2026-09-01" hasActivePeriodToday={false} todaysEntry={null} onSaved={vi.fn()} />);

    expect(screen.queryByLabelText(/energy/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/note/i)).not.toBeInTheDocument();
  });

  it("reveals energy/stress/sleep/note only after 'Add more context' is tapped, and they stay optional", () => {
    render(<DailyCheckIn date="2026-09-01" hasActivePeriodToday={false} todaysEntry={null} onSaved={vi.fn()} />);

    fireEvent.click(screen.getByText("Add more context"));

    expect(screen.getByLabelText(/energy/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stress/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sleep/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/note/i)).toBeInTheDocument();
    // "Save context" must be clickable with no note/text entered — nothing here is required.
    expect(screen.getByText("Save context")).not.toBeDisabled();
  });
});

describe("DailyCheckIn — saves one canonical daily mood", () => {
  it("tapping a mood saves immediately via upsertDailyMood with that exact value", async () => {
    vi.mocked(upsertDailyMood).mockResolvedValue({
      success: true,
      data: { id: "cycle-1", user_id: "u1", date: "2026-09-01", phase: "follicular", mood: 8, energy: 5, sleep: 5, libido: 5, stress: 5, symptoms: [] },
    });
    const onSaved = vi.fn();
    render(<DailyCheckIn date="2026-09-01" hasActivePeriodToday={false} todaysEntry={null} onSaved={onSaved} />);

    fireEvent.click(screen.getByRole("button", { name: "Good" }));

    expect(upsertDailyMood).toHaveBeenCalledWith({ date: "2026-09-01", mood: 8, hasActivePeriodToday: false });
    await vi.waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });

  it("passes hasActivePeriodToday through so the write path knows whether a period is active", () => {
    vi.mocked(upsertDailyMood).mockResolvedValue({ success: true, data: {} as never });
    render(<DailyCheckIn date="2026-09-01" hasActivePeriodToday={true} todaysEntry={null} onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Very low" }));

    expect(upsertDailyMood).toHaveBeenCalledWith({ date: "2026-09-01", mood: 2, hasActivePeriodToday: true });
  });

  it("shows a visible error and does not call onSaved when the save fails", async () => {
    vi.mocked(upsertDailyMood).mockResolvedValue({ success: false, error: "Network error" });
    const onSaved = vi.fn();
    render(<DailyCheckIn date="2026-09-01" hasActivePeriodToday={false} todaysEntry={null} onSaved={onSaved} />);

    fireEvent.click(screen.getByRole("button", { name: "Okay" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Network error");
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("marks today's already-saved mood as pressed/selected", () => {
    render(
      <DailyCheckIn
        date="2026-09-01"
        hasActivePeriodToday={false}
        todaysEntry={{ id: "c1", user_id: "u1", date: "2026-09-01", phase: "follicular", mood: 6, energy: 5, sleep: 5, libido: 5, stress: 5, symptoms: [] }}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Okay" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Good" })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("DailyCheckIn — Add more context save path", () => {
  it("saves via saveDailyCheckIn with the entered optional fields when 'Save context' is clicked", async () => {
    vi.mocked(saveDailyCheckIn).mockResolvedValue({
      success: true,
      data: { id: "cycle-1", user_id: "u1", date: "2026-09-01", phase: "follicular", mood: 6, energy: 7, sleep: 5, libido: 5, stress: 5, symptoms: [] },
    });
    const onSaved = vi.fn();
    render(
      <DailyCheckIn
        date="2026-09-01"
        hasActivePeriodToday={false}
        todaysEntry={{ id: "c1", user_id: "u1", date: "2026-09-01", phase: "follicular", mood: 6, energy: 5, sleep: 5, libido: 5, stress: 5, symptoms: [] }}
        onSaved={onSaved}
      />,
    );

    fireEvent.click(screen.getByText("Add more context"));
    fireEvent.change(screen.getByLabelText(/energy/i), { target: { value: "7" } });
    fireEvent.click(screen.getByText("Save context"));

    expect(saveDailyCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2026-09-01", mood: 6, energy: 7, hasActivePeriodToday: false }),
    );
    await vi.waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });
});
