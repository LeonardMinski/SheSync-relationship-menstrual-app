#!/usr/bin/env node

/**
 * Seed Intimacy Cards Script
 * 
 * This script seeds the intimacy_cards table with initial data.
 * Run this after setting up the database schema.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Check if environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
    text: 'Talk about your love languages and how you prefer to receive affection.',
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
    text: 'Hold hands and share what you\'re grateful for today.',
    phase_tags: ['any']
  },
  {
    category: 'affection',
    difficulty: 1,
    text: 'Give each other a 2-minute shoulder massage.',
    phase_tags: ['any']
  },
  {
    category: 'affection',
    difficulty: 2,
    text: 'Dance together to your favorite song, even if it\'s just swaying.',
    phase_tags: ['follicular', 'ovulation']
  },
  {
    category: 'affection',
    difficulty: 2,
    text: 'Take turns giving each other a gentle face massage.',
    phase_tags: ['any']
  },
  {
    category: 'affection',
    difficulty: 3,
    text: 'Create a "love map" - draw or describe your partner\'s favorite places, foods, and memories.',
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
    text: 'Watch a sunset or sunrise together (even through a window).',
    phase_tags: ['any']
  },
  {
    category: 'quality_time',
    difficulty: 1,
    text: 'Cook a simple meal together, no phones allowed.',
    phase_tags: ['any']
  },
  {
    category: 'quality_time',
    difficulty: 2,
    text: 'Take a walk and share your dreams for the next year.',
    phase_tags: ['follicular', 'ovulation']
  },
  {
    category: 'quality_time',
    difficulty: 2,
    text: 'Play a board game or card game together.',
    phase_tags: ['any']
  },
  {
    category: 'quality_time',
    difficulty: 3,
    text: 'Plan a future date or trip together, even if it\'s just dreaming.',
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
    text: 'Tell each other what you find most attractive about the other person.',
    phase_tags: ['any']
  },
  {
    category: 'desire_exploration',
    difficulty: 2,
    text: 'Share a fantasy about a perfect day together (non-sexual).',
    phase_tags: ['any']
  },
  {
    category: 'desire_exploration',
    difficulty: 2,
    text: 'Discuss what makes you feel most confident and desired.',
    phase_tags: ['follicular', 'ovulation']
  },
  {
    category: 'desire_exploration',
    difficulty: 3,
    text: 'Share something new you\'d like to explore together (activity, place, or experience).',
    phase_tags: ['any']
  },

  // ACTS category
  {
    category: 'acts',
    difficulty: 1,
    text: 'Offer to handle one small task she\'s been delaying.',
    phase_tags: ['luteal']
  },
  {
    category: 'acts',
    difficulty: 1,
    text: 'Bring her favorite snack or drink without being asked.',
    phase_tags: ['any']
  },
  {
    category: 'acts',
    difficulty: 1,
    text: 'Write a short love note and leave it somewhere she\'ll find it.',
    phase_tags: ['any']
  },
  {
    category: 'acts',
    difficulty: 2,
    text: 'Plan a surprise activity she would enjoy (even if it\'s just a movie night).',
    phase_tags: ['any']
  },
  {
    category: 'acts',
    difficulty: 2,
    text: 'Take care of a household task she usually handles.',
    phase_tags: ['menstrual', 'luteal']
  },
  {
    category: 'acts',
    difficulty: 3,
    text: 'Create a personalized playlist of songs that remind you of her.',
    phase_tags: ['any']
  },

  // Additional cards for variety
  {
    category: 'talk',
    difficulty: 1,
    text: 'Share one thing you learned about yourself this week.',
    phase_tags: ['any']
  },
  {
    category: 'affection',
    difficulty: 1,
    text: 'Sit close together and share your favorite childhood memory.',
    phase_tags: ['any']
  },
  {
    category: 'quality_time',
    difficulty: 1,
    text: 'Look at old photos together and share the stories behind them.',
    phase_tags: ['any']
  },
  {
    category: 'desire_exploration',
    difficulty: 1,
    text: 'Share what makes you feel most loved and appreciated.',
    phase_tags: ['any']
  },
  {
    category: 'acts',
    difficulty: 1,
    text: 'Make her favorite breakfast or coffee exactly how she likes it.',
    phase_tags: ['any']
  },
  {
    category: 'talk',
    difficulty: 2,
    text: 'Discuss your ideal weekend together.',
    phase_tags: ['any']
  },
  {
    category: 'affection',
    difficulty: 2,
    text: 'Give each other a foot massage while talking about your day.',
    phase_tags: ['any']
  },
  {
    category: 'quality_time',
    difficulty: 2,
    text: 'Build a blanket fort and watch a movie together.',
    phase_tags: ['any']
  },
  {
    category: 'desire_exploration',
    difficulty: 2,
    text: 'Share what you find most attractive about your partner\'s personality.',
    phase_tags: ['any']
  },
  {
    category: 'acts',
    difficulty: 2,
    text: 'Surprise her with flowers or her favorite treat.',
    phase_tags: ['any']
  },
  {
    category: 'talk',
    difficulty: 3,
    text: 'Share your biggest dream and how your partner could support it.',
    phase_tags: ['any']
  },
  {
    category: 'affection',
    difficulty: 3,
    text: 'Create a "love ritual" - something special you do together regularly.',
    phase_tags: ['any']
  },
  {
    category: 'quality_time',
    difficulty: 3,
    text: 'Plan a "date night in" with activities you both enjoy.',
    phase_tags: ['any']
  },
  {
    category: 'desire_exploration',
    difficulty: 3,
    text: 'Share what you\'re most excited about in your relationship right now.',
    phase_tags: ['any']
  },
  {
    category: 'acts',
    difficulty: 3,
    text: 'Create a surprise care package for her with things she loves.',
    phase_tags: ['any']
  }
];

async function seedIntimacyCards() {
  try {
    console.log('🌱 Starting intimacy cards seeding...');
    
    // Check if cards already exist
    const { count, error: countError } = await supabase
      .from('intimacy_cards')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to check existing cards: ${countError.message}`);
    }

    if (count && count > 0) {
      console.log(`✅ Found ${count} existing cards, skipping seed`);
      return { success: true, message: `${count} cards already exist` };
    }

    // Insert the cards
    const { data, error } = await supabase
      .from('intimacy_cards')
      .insert(intimacyCards);

    if (error) {
      throw new Error(`Failed to insert cards: ${error.message}`);
    }

    // Get final count
    const { count: finalCount, error: finalCountError } = await supabase
      .from('intimacy_cards')
      .select('*', { count: 'exact', head: true });

    if (finalCountError) {
      throw new Error(`Failed to get final count: ${finalCountError.message}`);
    }

    console.log(`✅ Successfully seeded ${finalCount || 0} intimacy cards`);
    return {
      success: true,
      message: `Successfully seeded ${finalCount || 0} intimacy cards`
    };
  } catch (error) {
    console.error('❌ Error seeding intimacy cards:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the seed function
seedIntimacyCards()
  .then(result => {
    if (result.success) {
      console.log('🎉 Intimacy cards seeding completed successfully!');
      process.exit(0);
    } else {
      console.error('💥 Intimacy cards seeding failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
