/**
 * External API Services for Dashboard Insights
 * 
 * Integrates with:
 * - Infermedica API for health insights
 * - Nutritionix API for nutrition suggestions
 * - NewsAPI for health news
 */

// Infermedica API for health insights
export interface HealthInsight {
  type: 'mood' | 'energy' | 'stress' | 'libido'
  tip: string
  source: 'infermedica'
}

export async function getHealthInsights(phase: string, symptoms: string[] = []): Promise<HealthInsight[]> {
  try {
    // Mock implementation - replace with real Infermedica API
    const insights: HealthInsight[] = [
      {
        type: 'mood',
        tip: `During ${phase} phase, focus on mood-stabilizing activities like gentle exercise and meditation.`,
        source: 'infermedica'
      },
      {
        type: 'energy',
        tip: 'Consider iron-rich foods and adequate sleep to maintain energy levels.',
        source: 'infermedica'
      },
      {
        type: 'stress',
        tip: 'Practice deep breathing exercises and limit caffeine intake to manage stress.',
        source: 'infermedica'
      },
      {
        type: 'libido',
        tip: 'Hormonal changes are normal. Communicate openly with your partner about needs.',
        source: 'infermedica'
      }
    ]

    // Filter insights based on symptoms
    if (symptoms.includes('fatigue')) {
      insights.push({
        type: 'energy',
        tip: 'Fatigue is common during this phase. Prioritize rest and consider iron supplements.',
        source: 'infermedica'
      })
    }

    return insights
  } catch (error) {
    console.error('Error fetching health insights:', error)
    return []
  }
}

// Nutritionix API for nutrition suggestions
export interface NutritionSuggestion {
  food: string
  reason: string
  benefits: string[]
  source: 'nutritionix'
}

export async function getNutritionSuggestion(phase: string, mood: number): Promise<NutritionSuggestion | null> {
  try {
    // Mock implementation - replace with real Nutritionix API
    const suggestions: Record<string, NutritionSuggestion> = {
      menstrual: {
        food: 'Dark leafy greens with citrus',
        reason: 'High iron and vitamin C for energy and mood',
        benefits: ['Boosts iron absorption', 'Supports mood regulation', 'Reduces fatigue'],
        source: 'nutritionix'
      },
      follicular: {
        food: 'Lean proteins and complex carbs',
        reason: 'Supports energy and hormone production',
        benefits: ['Stable energy levels', 'Hormone balance', 'Muscle recovery'],
        source: 'nutritionix'
      },
      ovulation: {
        food: 'Omega-3 rich foods',
        reason: 'Supports hormone production and reduces inflammation',
        benefits: ['Hormone support', 'Anti-inflammatory', 'Brain health'],
        source: 'nutritionix'
      },
      luteal: {
        food: 'Magnesium-rich foods',
        reason: 'Helps with mood stability and sleep quality',
        benefits: ['Mood support', 'Better sleep', 'Reduces cravings'],
        source: 'nutritionix'
      }
    }

    return suggestions[phase] || suggestions.luteal
  } catch (error) {
    console.error('Error fetching nutrition suggestion:', error)
    return null
  }
}

// NewsAPI for health news
export interface HealthNews {
  title: string
  description: string
  url: string
  publishedAt: string
  source: 'newsapi'
}

export async function getHealthNews(): Promise<HealthNews[]> {
  try {
    // Mock implementation - replace with real NewsAPI
    const news: HealthNews[] = [
      {
        title: 'New Study Shows Benefits of Cycle Tracking for Mental Health',
        description: 'Research indicates that tracking menstrual cycles can improve mood awareness and mental health outcomes.',
        url: 'https://example.com/news/cycle-tracking-mental-health',
        publishedAt: new Date().toISOString(),
        source: 'newsapi'
      },
      {
        title: 'Nutrition Tips for Different Cycle Phases',
        description: 'Learn how to optimize your nutrition throughout your menstrual cycle for better energy and mood.',
        url: 'https://example.com/news/cycle-nutrition-tips',
        publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        source: 'newsapi'
      },
      {
        title: 'The Science Behind Hormonal Mood Changes',
        description: 'Understanding the biological basis of mood fluctuations during the menstrual cycle.',
        url: 'https://example.com/news/hormonal-mood-changes',
        publishedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        source: 'newsapi'
      }
    ]

    return news
  } catch (error) {
    console.error('Error fetching health news:', error)
    return []
  }
}

// Fallback messages when APIs are unavailable
export const API_FALLBACKS = {
  healthInsights: 'Health insights are temporarily unavailable. Please check back later.',
  nutrition: 'Nutrition suggestions are temporarily unavailable. Please check back later.',
  news: 'Health news is temporarily unavailable. Please check back later.'
}
