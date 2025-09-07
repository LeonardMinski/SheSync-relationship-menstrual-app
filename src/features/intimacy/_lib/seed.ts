import { supabase } from '@/lib/supabaseClient'

// Seed data for intimacy cards - ~40 non-explicit cards
const intimacyCards = [
  // TALK category
  {
    category: 'talk',
    difficulty: 1,
    text: 'Phones off for 10 minutes. Share one highlight and one worry from your day.',
    phase_tags: ['menstrual', 'luteal']
  },
  {
    category: 'talk',
    difficulty: 1,
    text: 'Ask each other: "What made you feel most loved today?"',
    phase_tags: ['any']
  },
  {
    category: 'talk',
    difficulty: 1,
    text: 'Share three things you appreciate about your partner right now.',
    phase_tags: ['follicular', 'ovulation']
  },
  {
    category: 'talk',
    difficulty: 2,
    text: 'Discuss one thing you\'d like to try together this week.',
    phase_tags: ['any']
  },
  {
    category: 'talk',
    difficulty: 2,
    text: 'Share a childhood memory that shaped who you are today.',
    phase_tags: ['any']
  },
  {
    category: 'talk',
    difficulty: 3,
    text: 'Talk about your love languages and how you can better express them.',
    phase_tags: ['any']
  },

  // AFFECTION category
  {
    category: 'affection',
    difficulty: 1,
    text: '5-minute cuddle while syncing your breathing.',
    phase_tags: ['menstrual', 'luteal']
  },
  {
    category: 'affection',
    difficulty: 1,
    text: 'Hold hands and look into each other\'s eyes for 2 minutes.',
    phase_tags: ['any']
  },
  {
    category: 'affection',
    difficulty: 1,
    text: 'Give each other a 3-minute shoulder massage.',
    phase_tags: ['any']
  },
  {
    category: 'affection',
    difficulty: 2,
    text: 'Dance together to your favourite song.',
    phase_tags: ['follicular', 'ovulation']
  },
  {
    category: 'affection',
    difficulty: 2,
    text: 'Take turns giving each other gentle forehead kisses.',
    phase_tags: ['any']
  },
  {
    category: 'affection',
    difficulty: 3,
    text: 'Create a "love map" by tracing each other\'s hands.',
    phase_tags: ['any']
  },

  // QUALITY_TIME category
  {
    category: 'quality_time',
    difficulty: 1,
    text: 'Tea together; swap three appreciations.',
    phase_tags: ['any']
  },
  {
    category: 'quality_time',
    difficulty: 1,
    text: 'Watch the sunset together and share what you\'re grateful for.',
    phase_tags: ['any']
  },
  {
    category: 'quality_time',
    difficulty: 1,
    text: 'Cook a simple meal together without distractions.',
    phase_tags: ['any']
  },
  {
    category: 'quality_time',
    difficulty: 2,
    text: 'Take a 20-minute walk and share your dreams.',
    phase_tags: ['follicular', 'ovulation']
  },
  {
    category: 'quality_time',
    difficulty: 2,
    text: 'Build a blanket fort and read to each other.',
    phase_tags: ['menstrual', 'luteal']
  },
  {
    category: 'quality_time',
    difficulty: 3,
    text: 'Plan your ideal weekend together.',
    phase_tags: ['any']
  },

  // DESIRE_EXPLORATION category
  {
    category: 'desire_exploration',
    difficulty: 1,
    text: 'Share one thing that increases your desire for connection this week.',
    phase_tags: ['follicular', 'ovulation']
  },
  {
    category: 'desire_exploration',
    difficulty: 1,
    text: 'Tell each other what makes you feel most attractive.',
    phase_tags: ['any']
  },
  {
    category: 'desire_exploration',
    difficulty: 2,
    text: 'Share a fantasy about your future together.',
    phase_tags: ['follicular', 'ovulation']
  },
  {
    category: 'desire_exploration',
    difficulty: 2,
    text: 'Discuss what intimacy means to each of you.',
    phase_tags: ['any']
  },
  {
    category: 'desire_exploration',
    difficulty: 3,
    text: 'Share something new you\'d like to explore together.',
    phase_tags: ['any']
  },

  // ACTS category
  {
    category: 'acts',
    difficulty: 1,
    text: 'Offer to handle one small task they\'ve been delaying.',
    phase_tags: ['luteal']
  },
  {
    category: 'acts',
    difficulty: 1,
    text: 'Make their favourite drink and bring it to them.',
    phase_tags: ['any']
  },
  {
    category: 'acts',
    difficulty: 1,
    text: 'Do one of their regular chores without being asked.',
    phase_tags: ['any']
  },
  {
    category: 'acts',
    difficulty: 2,
    text: 'Plan a surprise date for this weekend.',
    phase_tags: ['follicular', 'ovulation']
  },
  {
    category: 'acts',
    difficulty: 2,
    text: 'Write them a love note and hide it somewhere they\'ll find it.',
    phase_tags: ['any']
  },
  {
    category: 'acts',
    difficulty: 3,
    text: 'Create a playlist of songs that remind you of them.',
    phase_tags: ['any']
  },

  // Additional cards for variety
  {
    category: 'talk',
    difficulty: 1,
    text: 'Share your favourite memory from this month.',
    phase_tags: ['any']
  },
  {
    category: 'affection',
    difficulty: 1,
    text: 'Give each other a warm hug and hold it for 30 seconds.',
    phase_tags: ['any']
  },
  {
    category: 'quality_time',
    difficulty: 1,
    text: 'Look at old photos together and share stories.',
    phase_tags: ['any']
  },
  {
    category: 'desire_exploration',
    difficulty: 1,
    text: 'Share what you find most attractive about your partner today.',
    phase_tags: ['any']
  },
  {
    category: 'acts',
    difficulty: 1,
    text: 'Bring them breakfast in bed.',
    phase_tags: ['any']
  },
  {
    category: 'talk',
    difficulty: 2,
    text: 'Discuss your relationship goals for the next year.',
    phase_tags: ['any']
  },
  {
    category: 'affection',
    difficulty: 2,
    text: 'Give each other a foot massage while talking.',
    phase_tags: ['any']
  },
  {
    category: 'quality_time',
    difficulty: 2,
    text: 'Play a board game together.',
    phase_tags: ['any']
  },
  {
    category: 'desire_exploration',
    difficulty: 2,
    text: 'Share what makes you feel most connected to your partner.',
    phase_tags: ['any']
  },
  {
    category: 'acts',
    difficulty: 2,
    text: 'Surprise them with their favourite treat.',
    phase_tags: ['any']
  },
  {
    category: 'talk',
    difficulty: 3,
    text: 'Discuss your communication styles and how to improve them.',
    phase_tags: ['any']
  },
  {
    category: 'affection',
    difficulty: 3,
    text: 'Create a "touch map" by exploring each other\'s hands.',
    phase_tags: ['any']
  },
  {
    category: 'quality_time',
    difficulty: 3,
    text: 'Plan a dream holiday together.',
    phase_tags: ['any']
  },
  {
    category: 'desire_exploration',
    difficulty: 3,
    text: 'Share your deepest relationship wish.',
    phase_tags: ['any']
  },
  {
    category: 'acts',
    difficulty: 3,
    text: 'Create a surprise care package for them.',
    phase_tags: ['any']
  }
]

export async function seedIntimacyCards(): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if cards already exist
    const { data: existingCards, error: checkError } = await supabase
      .from('intimacy_cards')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('Error checking existing cards:', checkError)
      return { success: false, error: checkError.message }
    }

    if (existingCards && existingCards.length > 0) {
      console.log('Intimacy cards already exist, skipping seed')
      return { success: true }
    }

    // Insert all cards
    const { error: insertError } = await supabase
      .from('intimacy_cards')
      .insert(intimacyCards)

    if (insertError) {
      console.error('Error inserting intimacy cards:', insertError)
      return { success: false, error: insertError.message }
    }

    console.log(`Successfully seeded ${intimacyCards.length} intimacy cards`)
    return { success: true }
  } catch (error) {
    console.error('Error seeding intimacy cards:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

// Function to run the seed
export async function runSeed(): Promise<void> {
  console.log('Starting intimacy cards seed...')
  const result = await seedIntimacyCards()
  
  if (result.success) {
    console.log('✅ Intimacy cards seed completed successfully')
  } else {
    console.error('❌ Intimacy cards seed failed:', result.error)
  }
}