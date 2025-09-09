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
    phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
    mood: number
    energy: number
    libido: number
    stress: number
    symptoms: string[]
    notes?: string
  }
  todayIntimacy?: {
    id: string
    date: string
    shared_with_partner: boolean
    reflection?: string
    selected_card?: {
      id: string
      category: string
      difficulty: number
      text: string
      phase_tags: string[]
    }
  }
  todayFantasy?: {
    id: string
    title: string
    content: string
    type: 'text' | 'moodboard' | 'audio'
    tags: string[]
    createdAt: string
  }
  recentActivity: Array<{
    description: string
    date: string
    type: 'cycle' | 'intimacy' | 'fantasy'
  }>
}

export interface PartnerDataResponse {
  sharedData: PartnerSharedData | null
  partnerLink: PartnerLink | null
}
