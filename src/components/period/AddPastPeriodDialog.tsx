"use client";

import { useState } from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { AddPastPeriodInput } from "@/types/period";

function today(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * For users who install after their period, forgot to press Start Period,
 * or want to fill in history. Creates a completed period directly — it is
 * never briefly "active" (see /api/periods POST). Start/end date only for
 * V1; day-level detail can be added to a past period later if needed.
 */
export function AddPastPeriodDialog({
  saving,
  error,
  onCancel,
  onSave,
}: {
  saving: boolean;
  error?: string | null;
  onCancel: () => void;
  onSave: (input: AddPastPeriodInput) => void;
}) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const validationError =
    startDate && endDate && endDate < startDate ? "End date cannot be before the start date" : null;
  const canSave = Boolean(startDate) && Boolean(endDate) && !validationError;

  return (
    <Modal title="Add a past period" onClose={onCancel}>
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Add a period that already happened. This won&apos;t start a new active period.
        </p>

        {(error || validationError) && (
          <div className="rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-sm text-error" role="alert">
            {error || validationError}
          </div>
        )}

        <div>
          <label htmlFor="past-period-start" className="mb-1 block text-sm font-medium text-foreground">
            Start date
          </label>
          <input
            id="past-period-start"
            type="date"
            value={startDate}
            max={today()}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-lg border border-border bg-bg-surface p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
          />
        </div>

        <div>
          <label htmlFor="past-period-end" className="mb-1 block text-sm font-medium text-foreground">
            End date
          </label>
          <input
            id="past-period-end"
            type="date"
            value={endDate}
            max={today()}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-lg border border-border bg-bg-surface p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="cta"
            className="flex-1"
            disabled={!canSave}
            loading={saving}
            onClick={() => onSave({ startDate, endDate })}
          >
            Add period
          </Button>
        </div>
      </div>
    </Modal>
  );
}
