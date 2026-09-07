import type { PartnerLinkWithPerson } from "@/types/partner";

export interface ActivePartner {
  id: string;
  name: string;
}

/**
 * Weekly Us / Mutual Reveal / Repair / Appreciations are symmetric,
 * collaborative features — either role in an active relationship can use
 * them. Resolves whichever of the caller's links (as owner or as viewer)
 * is currently active, preferring the owner link if, unusually, both are
 * somehow active at once.
 */
export function resolveActivePartner(
  ownerLink: PartnerLinkWithPerson | null,
  viewerLink: PartnerLinkWithPerson | null,
): ActivePartner | null {
  if (ownerLink?.status === "active") {
    return { id: ownerLink.viewer_user_id, name: ownerLink.personName };
  }
  if (viewerLink?.status === "active") {
    return { id: viewerLink.owner_user_id, name: viewerLink.personName };
  }
  return null;
}
