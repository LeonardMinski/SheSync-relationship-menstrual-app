/**
 * Selector functions for partner data display
 */

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

export function getPhaseDisplayName(phase: string): string {
  const phaseMap: Record<string, string> = {
    'menstrual': 'Menstrual',
    'follicular': 'Follicular',
    'ovulation': 'Ovulation',
    'luteal': 'Luteal'
  }
  return phaseMap[phase] || phase
}

export function getMoodEmoji(value: number | string): string {
  if (typeof value === 'string') {
    const phaseEmojiMap: Record<string, string> = {
      'menstrual': '🩸',
      'follicular': '🌱',
      'ovulation': '🌸',
      'luteal': '🍂'
    }
    return phaseEmojiMap[value] || '❓'
  }

  // For mood values (1-10)
  if (value >= 9) return '😍'
  if (value >= 7) return '😊'
  if (value >= 5) return '😐'
  if (value >= 3) return '😔'
  return '😢'
}

export function getCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    'talk': 'Conversation',
    'affection': 'Affection',
    'quality_time': 'Quality Time',
    'desire_exploration': 'Desire Exploration',
    'acts': 'Acts of Love'
  }
  return categoryMap[category] || category
}

export function getDifficultyDisplayName(difficulty: number): string {
  const difficultyMap: Record<number, string> = {
    1: 'Easy',
    2: 'Medium',
    3: 'Advanced'
  }
  return difficultyMap[difficulty] || 'Unknown'
}

export function getSessionSummary(session: any): string {
  if (!session.selected_card) return 'No card selected'
  
  const category = getCategoryDisplayName(session.selected_card.category)
  const difficulty = getDifficultyDisplayName(session.selected_card.difficulty)
  
  return `${category} - ${difficulty}`
}
