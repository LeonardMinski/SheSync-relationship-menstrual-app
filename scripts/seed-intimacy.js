/**
 * Seed script for intimacy cards and boundaries
 * Run with: node scripts/seed-intimacy.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Seed data for intimacy cards
const intimacyCards = [
  // TALK category
  {
    category: 'talk',
    difficulty: 1,
    text: 'Phones off for 10 minutes. Share one highlight and one worry from your day.',
    phase_tags: ['menstrual', 'luteal'],
    active: true
  },
  {
    category: 'talk',
    difficulty: 1,
    text: 'Ask each other: "What made you feel most loved today?"',
    phase_tags: ['any'],
    active: true
  },
  {
    category: 'talk',
    difficulty: 1,
    text: 'Share three things you appreciate about your partner right now.',
    phase_tags: ['follicular', 'ovulation'],
    active: true
  },
  {
    category: 'talk',
    difficulty: 2,
    text: 'Discuss one thing you\'d like to try together this week.',
    phase_tags: ['any'],
    active: true
  },
  {
    category: 'talk',
    difficulty: 2,
    text: 'Share a childhood memory that shaped who you are today.',
    phase_tags: ['any'],
    active: true
  },
  {
    category: 'talk',
    difficulty: 3,
    text: 'Talk about your love languages and how you can better express them.',
    phase_tags: ['any'],
    active: true
  },

  // AFFECTION category
  {
    category: 'affection',
    difficulty: 1,
    text: '5-minute cuddle while syncing your breathing.',
    phase_tags: ['menstrual', 'luteal'],
    active: true
  },
  {
    category: 'affection',
    difficulty: 1,
    text: 'Hold hands and look into each other\'s eyes for 2 minutes.',
    phase_tags: ['any'],
    active: true
  },
  {
    category: 'affection',
    difficulty: 1,
    text: 'Give each other a 3-minute shoulder massage.',
    phase_tags: ['any'],
    active: true
  },
  {
    category: 'affection',
    difficulty: 2,
    text: 'Dance together to your favourite song.',
    phase_tags: ['follicular', 'ovulation'],
    active: true
  },
  {
    category: 'affection',
    difficulty: 2,
    text: 'Take turns giving each other gentle forehead kisses.',
    phase_tags: ['any'],
    active: true
  },
  {
    category: 'affection',
    difficulty: 3,
    text: 'Create a "love map" by tracing each other\'s hands.',
    phase_tags: ['any'],
    active: true
  },

  // QUALITY_TIME category
  {
    category: 'quality_time',
    difficulty: 1,
    text: 'Tea together; swap three appreciations.',
    phase_tags: ['any'],
    active: true
  },
  {
    category: 'quality_time',
    difficulty: 1,
    text: 'Watch the sunset together and share what you\'re grateful for.',
    phase_tags: ['any'],
    active: true
  },
  {
    category: 'quality_time',
    difficulty: 1,
    text: 'Cook a simple meal together without distractions.',
    phase_tags: ['any'],
    active: true
  },
  {
    category: 'quality_time',
    difficulty: 2,
    text: 'Take a 20-minute walk and share your dreams.',
    phase_tags: ['follicular', 'ovulation'],
    active: true
  },
  {
    category: 'quality_time',
    difficulty: 2,
    text: 'Build a blanket fort and read to each other.',
    phase_tags: ['menstrual', 'luteal'],
    active: true
  },
  {
    category: 'quality_time',
    difficulty: 3,
    text: 'Plan your ideal weekend together.',
    phase_tags: ['any'],
    active: true
  },

  // DESIRE_EXPLORATION category
  {
    category: 'desire_exploration',
    difficulty: 1,
    text: 'Share one thing that increases your desire for connection this week.',
    phase_tags: ['follicular', 'ovulation'],
    active: true
  },
  {
    category: 'desire_exploration',
    difficulty: 1,
    text: 'Tell each other what makes you feel most attractive.',
    phase_tags: ['any'],
    active: true
  },
  {
    category: 'desire_exploration',
    difficulty: 2,
    text: 'Share a fantasy about your future together.',
    phase_tags: ['follicular', 'ovulation'],
    active: true
  },
  {
    category: 'desire_exploration',
    difficulty: 2,
    text: 'Discuss what intimacy means to each of you.',
    phase_tags: ['any'],
    active: true
  },
  {
    category: 'desire_exploration',
    difficulty: 3,
    text: 'Share something new you\'d like to explore together.',
    phase_tags: ['any'],
    active: true
  },

  // ACTS category
  {
    category: 'acts',
    difficulty: 1,
    text: 'Offer to handle one small task they\'ve been delaying.',
    phase_tags: ['luteal'],
    active: true
  },
  {
    category: 'acts',
    difficulty: 1,
    text: 'Make their favourite drink and bring it to them.',
    phase_tags: ['any'],
    active: true
  },
  {
    category: 'acts',
    difficulty: 1,
    text: 'Do one of their regular chores without being asked.',
    phase_tags: ['any'],
    active: true
  },
  {
    category: 'acts',
    difficulty: 2,
    text: 'Plan a surprise date for this weekend.',
    phase_tags: ['follicular', 'ovulation'],
    active: true
  },
  {
    category: 'acts',
    difficulty: 2,
    text: 'Write them a love note and hide it somewhere they\'ll find it.',
    phase_tags: ['any'],
    active: true
  },
  {
    category: 'acts',
    difficulty: 3,
    text: 'Create a playlist of songs that remind you of them.',
    phase_tags: ['any'],
    active: true
  }
]

async function seedIntimacyCards() {
  try {
    console.log('🌱 Starting intimacy cards seed...')

    // Check if cards already exist
    const { data: existingCards, error: checkError } = await supabase
      .from('intimacy_cards')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('❌ Error checking existing cards:', checkError.message)
      return false
    }

    if (existingCards && existingCards.length > 0) {
      console.log('✅ Intimacy cards already exist, skipping seed')
      return true
    }

    // Insert all cards
    const { error: insertError } = await supabase
      .from('intimacy_cards')
      .insert(intimacyCards)

    if (insertError) {
      console.error('❌ Error inserting intimacy cards:', insertError.message)
      return false
    }

    console.log(`✅ Successfully seeded ${intimacyCards.length} intimacy cards`)
    return true
  } catch (error) {
    console.error('❌ Error seeding intimacy cards:', error)
    return false
  }
}

async function checkTablesExist() {
  console.log('🔍 Checking if intimacy tables exist...')
  
  const tables = ['intimacy_cards', 'boundary_items', 'intimacy_sessions']
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`❌ Table '${table}' does not exist or is not accessible`)
        console.log(`   Error: ${error.message}`)
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`)
      }
    } catch (error) {
      console.log(`❌ Error checking table '${table}':`, error.message)
    }
  }
}

async function main() {
  console.log('🚀 Starting intimacy seed process...\n')
  
  await checkTablesExist()
  console.log('')
  
  const success = await seedIntimacyCards()
  
  if (success) {
    console.log('\n🎉 Intimacy seed completed successfully!')
  } else {
    console.log('\n💥 Intimacy seed failed!')
    process.exit(1)
  }
}

main().catch(console.error)