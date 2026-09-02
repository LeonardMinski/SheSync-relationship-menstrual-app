import { getSharingSummaryLabels } from "@/features/partner/sharing-summary";
import type { PartnerSharedData } from "@/types/partner";

export interface RawPartnerSharedDataRow {
  owner_name: string;
  share_with_partner: boolean;
  share_cycle_phase: boolean;
  share_mood: boolean;
  today_phase: "menstrual" | "follicular" | "ovulation" | "luteal" | null;
  today_mood: number | null;
  today_energy: number | null;
  recent_activity: Array<{ date: string; phase?: string | null; mood?: number | null }> | null;
}

/**
 * Builds the partner-facing DTO from the row already returned by the
 * privileged, server-side get_partner_shared_data() function. This function
 * assumes the caller has already verified an active connection and that the
 * row's fields were already filtered by that function according to the
 * owner's real privacy settings — it never re-derives permission itself, it
 * only shapes already-permitted data and never invents a value that wasn't
 * actually present on the row.
 */
export function buildPartnerSharedDataDto(
  row: RawPartnerSharedDataRow,
): PartnerSharedData {
  const settings = {
    shareWithPartner: row.share_with_partner === true,
    shareCyclePhase: row.share_cycle_phase === true,
    shareMood: row.share_mood === true,
  };

  const sharingSummary = getSharingSummaryLabels({
    share_with_partner: settings.shareWithPartner,
    share_cycle_phase: settings.shareCyclePhase,
    share_mood: settings.shareMood,
  });

  if (!settings.shareWithPartner) {
    return {
      partnerName: row.owner_name,
      privacySettings: settings,
      sharingSummary: [],
      recentActivity: [],
    };
  }

  const todayCycle: PartnerSharedData["todayCycle"] = {};
  if (settings.shareCyclePhase && row.today_phase) {
    todayCycle.phase = row.today_phase;
  }
  if (settings.shareMood && row.today_mood != null) {
    todayCycle.mood = row.today_mood;
    if (row.today_energy != null) {
      todayCycle.energy = row.today_energy;
    }
  }

  // Defense in depth: the database function omits prohibited keys entirely
  // (see get_partner_shared_data() in the migration), but this never
  // trusts that alone — a phase or mood value is only ever read from an
  // entry when the corresponding setting is also independently true.
  const recentActivity = (row.recent_activity ?? []).map((entry) => {
    const phase = settings.shareCyclePhase ? entry.phase ?? null : null;
    const mood = settings.shareMood ? entry.mood ?? null : null;

    let description: string;
    if (phase && mood != null) {
      description = `Logged ${phase} phase with mood ${mood}/10`;
    } else if (phase) {
      description = `Logged ${phase} phase`;
    } else if (mood != null) {
      description = `Logged mood ${mood}/10`;
    } else {
      description = "Logged an entry";
    }

    return {
      date: entry.date,
      type: "cycle" as const,
      description,
    };
  });

  return {
    partnerName: row.owner_name,
    privacySettings: settings,
    sharingSummary,
    todayCycle: Object.keys(todayCycle).length > 0 ? todayCycle : undefined,
    recentActivity,
  };
}
