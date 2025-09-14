import { supabase } from '@/lib/supabaseClient'
import type { 
  PartnerLink, 
  BoundaryItemRecord, 
  IntimacyCard, 
  IntimacySession,
  GetTodayCardParams,
  CreateSession,
  BoundaryItem
} from './schemas'

// =====================================================
// PARTNER SERVICES
// =====================================================

export async function getPartnerId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('partner_links')
    .select('partner_user_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error || !data) {
    return null
  }

  return data.partner_user_id
}

// =====================================================
// BOUNDARY SERVICES
// =====================================================

export async function listBoundaries(userId: string): Promise<BoundaryItemRecord[]> {
  try {
    const { data, error } = await supabase
      .from('boundary_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching boundaries:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching boundaries (table may not exist):', error)
    return []
  }
}

export async function upsertBoundary(userId: string, input: BoundaryItem & { id?: string }): Promise<BoundaryItemRecord | null> {
  const boundaryData = {
    user_id: userId,
    label: input.label,
    status: input.status,
    ...(input.id && { id: input.id })
  }

  const { data, error } = await supabase
    .from('boundary_items')
    .upsert(boundaryData, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting boundary:', error)
    return null
  }

  return data
}

export async function deleteBoundary(userId: string, boundaryId: string): Promise<boolean> {
  const { error } = await supabase
    .from('boundary_items')
    .delete()
    .eq('id', boundaryId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting boundary:', error)
    return false
  }

  return true
}

// =====================================================
// CARD SERVICES
// =====================================================

export async function listCards(filters: {
  category?: string
  difficulty?: number
  phase?: string
  active?: boolean
} = {}): Promise<IntimacyCard[]> {
  try {
    let query = supabase
      .from('intimacy_cards')
      .select('*')

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty)
    }

    if (filters.phase) {
      query = query.contains('phase_tags', [filters.phase])
    }

    if (filters.active !== undefined) {
      query = query.eq('active', filters.active)
    }

    const { data, error } = await query.order('difficulty', { ascending: true })

    if (error) {
      console.error('Error fetching cards:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching cards (table may not exist):', error)
    return []
  }
}

export async function getTodayCard(userId: string, params: GetTodayCardParams = {}): Promise<IntimacyCard | null> {
  // Get cards that match the criteria
  const cards = await listCards({
    category: params.category,
    difficulty: params.difficulty,
    active: true
  })

  if (cards.length === 0) {
    // Return fallback card if no cards exist in database
    return getFallbackCard(params.category, params.difficulty, params.phase)
  }

  // If phase is specified, prioritize cards that match the phase
  if (params.phase) {
    const phaseMatchedCards = cards.filter(card => 
      card.phase_tags.includes(params.phase!) || card.phase_tags.length === 0
    )
    
    if (phaseMatchedCards.length > 0) {
      // Return random card from phase-matched cards
      const randomIndex = Math.floor(Math.random() * phaseMatchedCards.length)
      return phaseMatchedCards[randomIndex]
    }
  }

  // Fallback: return random card from all matching cards
  const randomIndex = Math.floor(Math.random() * cards.length)
  return cards[randomIndex]
}

// Fallback cards when database is empty
function getFallbackCard(category?: string, difficulty?: number, phase?: string): IntimacyCard {
  const fallbackCards = [
    {
      id: 'fallback-1',
      category: 'talk' as const,
      difficulty: 1,
      text: 'Share one highlight and one worry from your day.',
      phase_tags: ['any'],
      active: true
    },
    {
      id: 'fallback-2',
      category: 'affection' as const,
      difficulty: 1,
      text: 'Give each other a 3-minute shoulder massage.',
      phase_tags: ['any'],
      active: true
    },
    {
      id: 'fallback-3',
      category: 'quality_time' as const,
      difficulty: 1,
      text: 'Cook a simple meal together without distractions.',
      phase_tags: ['any'],
      active: true
    },
    {
      id: 'fallback-4',
      category: 'desire_exploration' as const,
      difficulty: 1,
      text: 'Tell each other what makes you feel most attractive.',
      phase_tags: ['any'],
      active: true
    },
    {
      id: 'fallback-5',
      category: 'acts' as const,
      difficulty: 1,
      text: 'Make their favourite drink and bring it to them.',
      phase_tags: ['any'],
      active: true
    }
  ]

  // Filter by category if specified
  let filteredCards = fallbackCards
  if (category) {
    filteredCards = fallbackCards.filter(card => card.category === category)
  }

  // Filter by difficulty if specified
  if (difficulty) {
    filteredCards = filteredCards.filter(card => card.difficulty === difficulty)
  }

  // Return random card from filtered results
  const randomIndex = Math.floor(Math.random() * filteredCards.length)
  return filteredCards[randomIndex] || fallbackCards[0]
}

// =====================================================
// SESSION SERVICES
// =====================================================

export async function getTodaySession(userId: string, date: string): Promise<IntimacySession | null> {
  try {
    const { data, error } = await supabase
      .from('intimacy_sessions')
      .select(`
        *,
        selected_card:selected_card_id (
          id,
          category,
          difficulty,
          text,
          phase_tags,
          active
        )
      `)
      .eq('user_id', userId)
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching today session:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Error fetching today session (table may not exist):', error)
    return null
  }
}

export async function upsertSession(userId: string, input: CreateSession): Promise<IntimacySession | null> {
  const sessionData = {
    user_id: userId,
    date: input.date,
    selected_card_id: input.selectedCardId,
    shared_with_partner: input.share || false,
    reflection: input.reflection || null
  }

  const { data, error } = await supabase
    .from('intimacy_sessions')
    .upsert(sessionData, { 
      onConflict: 'user_id,date',
      ignoreDuplicates: false 
    })
    .select(`
      *,
      selected_card:selected_card_id (
        id,
        category,
        difficulty,
        text,
        phase_tags,
        active
      )
    `)
    .single()

  if (error) {
    console.error('Error upserting session:', error)
    return null
  }

  return data
}

export async function shareSession(userId: string, date: string, shared: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('intimacy_sessions')
    .update({ shared_with_partner: shared })
    .eq('user_id', userId)
    .eq('date', date)

  if (error) {
    console.error('Error updating session share status:', error)
    return false
  }

  return true
}

// =====================================================
// PARTNER SESSION SERVICES
// =====================================================

export async function getPartnerSharedSessions(userId: string): Promise<IntimacySession[]> {
  // Get partner's shared sessions
  const { data, error } = await supabase
    .from('intimacy_sessions')
    .select(`
      *,
      selected_card:selected_card_id (
        id,
        category,
        difficulty,
        text,
        phase_tags,
        active
      )
    `)
    .eq('user_id', userId)
    .eq('shared_with_partner', true)
    .order('date', { ascending: false })
    .limit(7) // Last 7 days

  if (error) {
    console.error('Error fetching partner shared sessions:', error)
    return []
  }

  return data || []
}