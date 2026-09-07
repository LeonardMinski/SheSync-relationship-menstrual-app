import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AddPastPeriodDialog } from "./AddPastPeriodDialog";

describe("AddPastPeriodDialog", () => {
  it("disables Add period until both dates are filled in", () => {
    render(<AddPastPeriodDialog saving={false} onCancel={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByText("Add period")).toBeDisabled();
  });

  it("rejects an end date before the start date without calling onSave", () => {
    const onSave = vi.fn();
    render(<AddPastPeriodDialog saving={false} onCancel={vi.fn()} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-08-05" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-08-01" } });

    expect(screen.getByText("Add period")).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(/end date cannot be before/i);
    fireEvent.click(screen.getByText("Add period"));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onSave with the completed start/end date range, creating history rather than an active period", () => {
    const onSave = vi.fn();
    render(<AddPastPeriodDialog saving={false} onCancel={vi.fn()} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-08-01" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-08-05" } });
    fireEvent.click(screen.getByText("Add period"));

    expect(onSave).toHaveBeenCalledWith({ startDate: "2026-08-01", endDate: "2026-08-05" });
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<AddPastPeriodDialog saving={false} onCancel={onCancel} onSave={vi.fn()} />);

    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
