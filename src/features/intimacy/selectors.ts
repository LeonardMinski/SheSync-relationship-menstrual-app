import type { IntimacyCard, BoundaryItemRecord } from './schemas'

// =====================================================
// DISPLAY HELPERS
// =====================================================

export function getCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    talk: 'Conversation',
    affection: 'Affection',
    quality_time: 'Quality Time',
    desire_exploration: 'Desire Exploration',
    acts: 'Acts of Service'
  }
  return categoryMap[category] || category
}

export function getDifficultyDisplayName(difficulty: number): string {
  const difficultyMap: Record<number, string> = {
    1: 'Gentle',
    2: 'Moderate',
    3: 'Intense'
  }
  return difficultyMap[difficulty] || 'Unknown'
}

export function getBoundaryStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    yes: 'Yes',
    maybe: 'Maybe',
    no: 'No'
  }
  return statusMap[status] || status
}

export function getPhaseDisplayName(phase: string): string {
  const phaseMap: Record<string, string> = {
    menstrual: 'Menstrual',
    follicular: 'Follicular',
    ovulation: 'Ovulation',
    luteal: 'Luteal'
  }
  return phaseMap[phase] || phase
}

// =====================================================
// DATE HELPERS
// =====================================================

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric'
  })
}

// =====================================================
// CONSENT HELPERS
// =====================================================

export function hasConsentRequirement(card: IntimacyCard): boolean {
  // Cards that involve physical touch or intimate acts require consent
  const consentCategories = ['affection', 'acts', 'desire_exploration']
  return consentCategories.includes(card.category)
}

export function getConsentMessage(card: IntimacyCard): string {
  if (!hasConsentRequirement(card)) {
    return ''
  }
  
  return 'Ask first; stop on no/neutral.'
}

// =====================================================
// CARD FILTERING
// =====================================================

export function filterCardsByPhase(cards: IntimacyCard[], phase: string): IntimacyCard[] {
  return cards.filter(card => 
    card.phase_tags.includes(phase) || card.phase_tags.length === 0
  )
}

export function filterCardsByDifficulty(cards: IntimacyCard[], difficulty: number): IntimacyCard[] {
  return cards.filter(card => card.difficulty === difficulty)
}

export function filterCardsByCategory(cards: IntimacyCard[], category: string): IntimacyCard[] {
  return cards.filter(card => card.category === category)
}

// =====================================================
// BOUNDARY HELPERS
// =====================================================

export function getBoundariesByStatus(boundaries: BoundaryItemRecord[], status: 'yes' | 'maybe' | 'no'): BoundaryItemRecord[] {
  return boundaries.filter(boundary => boundary.status === status)
}

export function getBoundaryCounts(boundaries: BoundaryItemRecord[]): Record<string, number> {
  return boundaries.reduce((counts, boundary) => {
    counts[boundary.status] = (counts[boundary.status] || 0) + 1
    return counts
  }, {} as Record<string, number>)
}

// =====================================================
// SESSION HELPERS
// =====================================================

export function getSessionSummary(session: any): string {
  if (!session?.selected_card) {
    return 'No card selected today'
  }
  
  const card = session.selected_card
  const category = getCategoryDisplayName(card.category)
  const difficulty = getDifficultyDisplayName(card.difficulty)
  
  return `${category} - ${difficulty}`
}

export function hasReflection(session: any): boolean {
  return !!(session?.reflection && session.reflection.trim().length > 0)
}

// =====================================================
// VALIDATION HELPERS
// =====================================================

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

export function isToday(dateString: string): boolean {
  const today = getTodayDate()
  return dateString === today
}

export function isFutureDate(dateString: string): boolean {
  const today = new Date(getTodayDate())
  const date = new Date(dateString)
  return date > today
}