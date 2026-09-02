export type PartnerLinkStatus = "pending" | "active" | "inactive" | "declined";

// owner_user_id: the person whose wellness/cycle data may be shared.
// viewer_user_id: the invited person who may read explicitly shared fields.
export interface PartnerLink {
  id: string;
  owner_user_id: string;
  viewer_user_id: string;
  status: PartnerLinkStatus;
  created_at: string;
}

export interface PartnerLinkWithPerson extends PartnerLink {
  personName: string;
  personEmail: string;
}

export interface PartnerStatusResponse {
  // The caller's own outgoing connection, as the owner sharing their data.
  ownerLink: PartnerLinkWithPerson | null;
  // The caller's connection as the invited viewer of someone else's data.
  viewerLink: PartnerLinkWithPerson | null;
}

export interface PartnerSharedData {
  partnerName: string;
  privacySettings: {
    shareWithPartner: boolean;
    shareCyclePhase: boolean;
    shareMood: boolean;
  };
  sharingSummary: string[];
  todayCycle?: {
    phase?: "menstrual" | "follicular" | "ovulation" | "luteal";
    mood?: number;
    energy?: number;
  };
  recentActivity: Array<{
    description: string;
    date: string;
    type: "cycle";
  }>;
}

export interface PartnerDataResponse {
  sharedData: PartnerSharedData | null;
  partnerLink: PartnerLink | null;
}
