import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PartnerSharedSummary } from "./PartnerSharedSummary";
import type { PartnerSharedData } from "@/types";

function makeData(overrides: Partial<PartnerSharedData> = {}): PartnerSharedData {
  return {
    partnerName: "Alex",
    privacySettings: { shareWithPartner: true, shareCyclePhase: true, shareMood: true },
    sharingSummary: [],
    todayCycle: { phase: "menstrual", mood: 7 },
    recentActivity: [],
    ...overrides,
  };
}

describe("PartnerSharedSummary — honest period status, no fabricated phase", () => {
  it("never claims a specific cycle phase (menstrual/follicular/ovulation/luteal) — no real phase model exists", () => {
    render(<PartnerSharedSummary partnerData={makeData()} />);

    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/follicular|ovulation|luteal/i);
  });

  it("states a period is active today only when the real signal says so", () => {
    render(<PartnerSharedSummary partnerData={makeData({ todayCycle: { phase: "menstrual", mood: 7 } })} />);

    expect(screen.getByText("Period active today")).toBeInTheDocument();
  });

  it("honestly says no active period rather than naming a fake phase", () => {
    render(<PartnerSharedSummary partnerData={makeData({ todayCycle: { phase: "follicular", mood: 7 } })} />);

    expect(screen.getByText("No active period today")).toBeInTheDocument();
  });

  it("never shows the old fabricated, unconditional energy/mood-advice caption", () => {
    render(<PartnerSharedSummary partnerData={makeData()} />);

    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/energy might be lower/i);
  });

  it("hides period status entirely when the owner has not opted to share it", () => {
    render(<PartnerSharedSummary partnerData={makeData({ privacySettings: { shareWithPartner: true, shareCyclePhase: false, shareMood: true } })} />);

    expect(screen.getByText("Period status hidden")).toBeInTheDocument();
    expect(screen.queryByText(/period active|no active period/i)).not.toBeInTheDocument();
  });

  it("shows the real shared mood value, unaffected by this fix", () => {
    render(<PartnerSharedSummary partnerData={makeData({ todayCycle: { phase: "menstrual", mood: 6 } })} />);

    expect(screen.getByText("6/10")).toBeInTheDocument();
  });

  it("shows the paused/no-data state when sharing is off", () => {
    render(<PartnerSharedSummary partnerData={makeData({ privacySettings: { shareWithPartner: false, shareCyclePhase: true, shareMood: true } })} />);

    expect(screen.getByText("Data Paused")).toBeInTheDocument();
  });

  it("shows the paused state when there is no partner data at all", () => {
    render(<PartnerSharedSummary partnerData={null} />);

    expect(screen.getByText("Data Paused")).toBeInTheDocument();
  });
});
