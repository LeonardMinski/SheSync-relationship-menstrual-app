import { supabase } from '@/lib/supabaseClient'
import { seedIntimacyCards } from './seed'

/**
 * Seed the intimacy_cards table with initial data
 * This should be run once after the database migration
 */
export async function seedIntimacyCardsDatabase() {
  try {
    console.log('🌱 Starting intimacy cards seeding...')
    
    // Check if cards already exist
    const { count, error: countError } = await supabase
      .from('intimacy_cards')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      throw new Error(`Failed to check existing cards: ${countError.message}`)
    }

    if (count && count > 0) {
      console.log(`✅ Found ${count} existing cards, skipping seed`)
      return { success: true, message: `${count} cards already exist` }
    }

    // Use the seed function from seed.ts
    const result = await seedIntimacyCards()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to seed cards')
    }
    
    // Get final count after seeding
    const { count: finalCount, error: finalCountError } = await supabase
      .from('intimacy_cards')
      .select('*', { count: 'exact', head: true })

    if (finalCountError) {
      throw new Error(`Failed to get final count: ${finalCountError.message}`)
    }

    console.log(`✅ Successfully seeded ${finalCount || 0} intimacy cards`)
    
    return { 
      success: true, 
      message: `Successfully seeded ${finalCount || 0} intimacy cards` 
    }

  } catch (error) {
    console.error('❌ Error seeding intimacy cards:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Development helper to clear and re-seed cards
 * WARNING: This will delete all existing cards and sessions!
 */
export async function resetIntimacyCards() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset cards in production environment')
  }

  try {
    console.log('🔄 Resetting intimacy cards...')
    
    // Delete all existing cards (this will cascade to sessions due to foreign key)
    const { error: deleteError } = await supabase
      .from('intimacy_cards')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      throw new Error(`Failed to delete existing cards: ${deleteError.message}`)
    }

    // Re-seed
    const result = await seedIntimacyCardsDatabase()
    
    if (result.success) {
      console.log('✅ Cards reset successfully')
    }
    
    return result

  } catch (error) {
    console.error('❌ Error resetting intimacy cards:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get seeding statistics
 */
export async function getSeedingStats() {
  try {
    const { data: cards, error } = await supabase
      .from('intimacy_cards')
      .select('category, difficulty, active')

    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`)
    }

    const stats = {
      total: cards?.length || 0,
      active: cards?.filter(c => c.active).length || 0,
      byCategory: {} as Record<string, number>,
      byDifficulty: {} as Record<number, number>,
    }

    cards?.forEach(card => {
      stats.byCategory[card.category] = (stats.byCategory[card.category] || 0) + 1
      stats.byDifficulty[card.difficulty] = (stats.byDifficulty[card.difficulty] || 0) + 1
    })

    return { success: true, stats }

  } catch (error) {
    console.error('❌ Error getting seeding stats:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Export for use in development/admin scripts

