import { v4 as uuidv4 } from 'uuid';
import { 
  User, 
  CycleData, 
  AICoachMessage, 
  IntimacyCard, 
  FantasyEntry, 
  Notification, 
  SubscriptionPlan,
  Recipe,
  CyclePhase
} from '@/types';
import { subDays, addDays } from 'date-fns';

export const mockUser: User = {
  id: uuidv4(),
  email: 'sarah@example.com',
  name: 'Sarah',
  subscriptionTier: 'premium',
  createdAt: subDays(new Date(), 30),
  privacySettings: {
    shareWithPartner: true,
    shareCyclePhase: true,
    shareMood: true,
    shareFantasyVault: false,
    shareIntimacyDeck: true,
  }
};

export const mockCycleData: CycleData[] = [
  {
    id: uuidv4(),
    date: new Date(),
    phase: 'luteal',
    mood: 6,
    energy: 5,
    libido: 4,
    stress: 7,
    symptoms: ['Mild cramping', 'Bloating', 'Cravings'],
    notes: 'Feeling a bit low energy today, craving chocolate',
    temperature: 98.2,
  },
  {
    id: uuidv4(),
    date: subDays(new Date(), 1),
    phase: 'luteal',
    mood: 7,
    energy: 6,
    libido: 5,
    stress: 6,
    symptoms: ['Tender breasts', 'Mild acne'],
    notes: 'Better day, did some yoga',
    temperature: 98.4,
  },
  {
    id: uuidv4(),
    date: subDays(new Date(), 7),
    phase: 'ovulation',
    mood: 9,
    energy: 9,
    libido: 8,
    stress: 3,
    symptoms: ['High energy', 'Clear skin'],
    notes: 'Amazing energy today! Felt really confident and social',
    temperature: 97.8,
  },
];

export const mockAIMessages: AICoachMessage[] = [
  {
    id: uuidv4(),
    timestamp: new Date(),
    question: "Why do I feel so anxious today?",
    response: "Based on your cycle data, you're currently in your luteal phase, which is when progesterone levels drop. This can naturally increase anxiety and stress sensitivity. Your stress level today is 7/10, which is higher than your usual. Try some deep breathing exercises, magnesium supplementation, and gentle movement like yoga. Your body is preparing for your next cycle, so be extra kind to yourself.",
    phase: 'luteal',
    relevantData: {
      mood: 6,
      stress: 7,
      phase: 'luteal'
    }
  },
  {
    id: uuidv4(),
    timestamp: subDays(new Date(), 2),
    question: "Should I do intense workouts today?",
    response: "During your luteal phase with energy at 5/10, I'd recommend switching to gentler forms of exercise. Your body is working hard with hormonal changes right now. Consider yoga, walking, or light strength training instead of high-intensity workouts. This will support your energy rather than depleting it further.",
    phase: 'luteal',
    relevantData: {
      energy: 5,
      phase: 'luteal'
    }
  }
];

export const mockIntimacyCards: IntimacyCard[] = [
  {
    id: uuidv4(),
    category: 'emotional',
    question: "What's one thing your partner does that makes you feel most loved?",
    description: "Explore love languages and emotional connection",
    tags: ['love languages', 'emotional intimacy', 'appreciation'],
    isAnswered: true,
    userAnswer: "When he makes me tea without me asking, especially during my period",
    partnerAnswer: "When she laughs at my silly jokes even when she's tired",
    isShared: true,
  },
  {
    id: uuidv4(),
    category: 'sensual',
    question: "Describe your ideal romantic evening together",
    description: "Share desires for romantic connection",
    tags: ['romance', 'date night', 'sensuality'],
    isAnswered: false,
    isShared: false,
  },
  {
    id: uuidv4(),
    category: 'fantasy',
    question: "If we could go anywhere in the world together, where would it be and why?",
    description: "Explore shared dreams and adventures",
    tags: ['dreams', 'travel', 'future plans'],
    isAnswered: true,
    userAnswer: "A cozy cabin in Norway to see the Northern Lights together",
    isShared: false,
  }
];

export const mockFantasyEntries: FantasyEntry[] = [
  {
    id: uuidv4(),
    title: "Weekend Getaway Dreams",
    content: "A romantic weekend at a spa resort with couples massages and no phones allowed",
    type: 'text',
    tags: ['relaxation', 'spa', 'romantic getaway'],
    isSharedWithPartner: false,
    createdAt: subDays(new Date(), 5),
    updatedAt: subDays(new Date(), 5),
    mood: 8,
    phase: 'follicular'
  },
  {
    id: uuidv4(),
    title: "Dancing Under Stars",
    content: "Slow dancing in our living room with fairy lights and our favorite playlist",
    type: 'text',
    tags: ['dancing', 'home', 'intimate'],
    isSharedWithPartner: true,
    createdAt: subDays(new Date(), 10),
    updatedAt: subDays(new Date(), 10),
    mood: 9,
    phase: 'ovulation'
  }
];

export const mockNotifications: Notification[] = [
  {
    id: uuidv4(),
    type: 'cycle',
    title: 'Cycle Phase Change',
    message: 'You\'re entering your luteal phase. Time for self-care and gentle activities.',
    isRead: false,
    createdAt: subDays(new Date(), 1),
  },
  {
    id: uuidv4(),
    type: 'partner',
    title: 'Partner Message',
    message: 'Alex wants to plan a special date night this weekend',
    isRead: false,
    createdAt: subDays(new Date(), 2),
  },
  {
    id: uuidv4(),
    type: 'intimacy',
    title: 'New Intimacy Card',
    message: 'Try tonight\'s intimate conversation starter',
    isRead: true,
    createdAt: subDays(new Date(), 3),
  }
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      'Basic cycle tracking',
      '5 intimacy cards',
      'Simple mood logging',
      'Basic phase predictions'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 15,
    interval: 'month',
    features: [
      'Advanced cycle tracking',
      'AI Coach unlimited',
      'Partner access & sharing',
      '100+ intimacy cards',
      'Detailed analytics',
      'Custom reminders'
    ],
    isPopular: true
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 39,
    interval: 'month',
    features: [
      'Everything in Premium',
      'Fantasy Vault unlimited',
      'Custom rituals & soundscapes',
      'Advanced partner features',
      'Priority support',
      'Early access to new features'
    ]
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 199,
    interval: 'lifetime',
    features: [
      'All current & future features',
      'Lifetime updates',
      'Premium data backup',
      'Exclusive community access',
      'Personal coach sessions'
    ]
  }
];

export const mockRecipes: Recipe[] = [
  {
    id: uuidv4(),
    name: 'Hormone-Balancing Smoothie',
    description: 'Perfect for luteal phase with magnesium-rich ingredients',
    ingredients: [
      '1 cup spinach',
      '1 banana',
      '1 tbsp almond butter',
      '1 tsp cacao powder',
      '1 cup almond milk',
      '1 tbsp chia seeds'
    ],
    instructions: [
      'Blend all ingredients until smooth',
      'Add ice if desired',
      'Enjoy immediately for best nutrition'
    ],
    cyclePhase: ['luteal', 'menstrual'],
    nutrients: ['Magnesium', 'Iron', 'Healthy fats'],
    prepTime: 5,
    difficulty: 'easy'
  },
  {
    id: uuidv4(),
    name: 'Energy-Boosting Quinoa Bowl',
    description: 'High-protein meal perfect for follicular phase',
    ingredients: [
      '1 cup cooked quinoa',
      '1/2 avocado',
      '1 cup roasted vegetables',
      '2 tbsp pumpkin seeds',
       'Lemon tahini dressing'
    ],
    instructions: [
      'Combine quinoa and vegetables in bowl',
      'Top with avocado and seeds',
      'Drizzle with dressing'
    ],
    cyclePhase: ['follicular', 'ovulation'],
    nutrients: ['Protein', 'Healthy fats', 'Complex carbs'],
    prepTime: 15,
    difficulty: 'medium'
  }
];

// Mock AI responses for different questions
export const mockAIResponses: Record<string, string> = {
  'cycle': "Based on your current luteal phase and recent symptoms, your body is preparing for your next cycle. This is completely normal! I recommend focusing on magnesium-rich foods, gentle movement, and extra rest.",
  
  'mood': "Your mood patterns show you're experiencing typical hormonal fluctuations. During this phase, try some mood-supporting activities like journaling, calling a friend, or doing something creative.",
  
  'energy': "Your energy levels align with your current cycle phase. Consider adapting your workout routine - maybe swap that HIIT class for some yoga or a peaceful walk in nature.",
  
  'relationship': "Communication is key during hormonal shifts. Let your partner know how you're feeling and what kind of support would be most helpful right now.",
  
  'default': "I'm here to help you understand your body's natural rhythms. Based on your cycle data, I can provide personalized insights about your symptoms, energy levels, and what to expect in the coming days."
};

// Helper function to generate cycle predictions
export const generateCyclePredictions = (lastPeriodDate: Date, cycleLength: number = 28) => {
  const predictions = [];
  const today = new Date();
  
  for (let i = 0; i < 90; i++) {
    const date = addDays(today, i);
    const dayInCycle = ((date.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24)) % cycleLength;
    
    let phase: CyclePhase;
    if (dayInCycle >= 0 && dayInCycle < 5) phase = 'menstrual';
    else if (dayInCycle < 13) phase = 'follicular';
    else if (dayInCycle < 17) phase = 'ovulation';
    else phase = 'luteal';
    
    predictions.push({
      date,
      phase,
      dayInCycle: Math.floor(dayInCycle) + 1
    });
  }
  
  return predictions;
};

export const getPhaseColor = (phase: CyclePhase): string => {
  const colors = {
    menstrual: 'badge badge--menstrual',
    follicular: 'badge badge--follicular',
    ovulation: 'badge badge--ovulation',
    luteal: 'badge badge--luteal'
  };
  return colors[phase];
};
