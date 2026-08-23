export interface PartnerLink {
  id: string
  user_id: string
  partner_user_id: string
  status: 'active' | 'pending' | 'inactive'
  created_at: string
  updated_at: string
}

export interface PartnerSharedData {
  partnerName: string
  privacySettings: {
    shareWithPartner: boolean
    shareCyclePhase: boolean
    shareMood: boolean
    shareFantasyVault: boolean
    shareIntimacyDeck: boolean
  }
  todayCycle?: {
    phase?: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
    mood?: number
    energy?: number
  }
  recentActivity: Array<{
    description: string
    date: string
    type: 'cycle'
  }>
}

export interface PartnerDataResponse {
  sharedData: PartnerSharedData | null
  partnerLink: PartnerLink | null
}
