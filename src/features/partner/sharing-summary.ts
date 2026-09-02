import type { PrivacySettings } from "@/schemas/privacy";

/**
 * Single source of truth for "what is currently being shared," derived
 * directly from the real privacy settings. share_mood already gates both
 * mood and energy in the shared-data API, so it is labeled accordingly
 * everywhere it is shown.
 */
export function getSharingSummaryLabels(
  settings: Pick<PrivacySettings, "share_with_partner" | "share_cycle_phase" | "share_mood">,
): string[] {
  if (!settings.share_with_partner) {
    return [];
  }

  const labels: string[] = [];

  if (settings.share_cycle_phase) {
    labels.push("Cycle Phase");
  }

  if (settings.share_mood) {
    labels.push("Mood & Energy");
  }

  return labels;
}
