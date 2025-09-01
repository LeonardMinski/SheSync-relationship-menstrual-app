export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: 'free' | 'premium' | 'vip' | 'lifetime';
  createdAt: Date;
  partnerId?: string;
  privacySettings: PrivacySettings;
}

export interface PrivacySettings {
  shareWithPartner: boolean;
  shareCyclePhase: boolean;
  shareMood: boolean;
  shareFantasyVault: boolean;
  shareIntimacyDeck: boolean;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  inviteStatus: 'pending' | 'accepted' | 'declined';
  accessLevel: 'basic' | 'full';
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface CycleData {
  id: string;
  date: Date;
  phase: CyclePhase;
  periodFlow?: 'light' | 'medium' | 'heavy';
  mood: number; // 1-10 scale
  energy: number; // 1-10 scale
  libido: number; // 1-10 scale
  stress: number; // 1-10 scale
  symptoms: string[];
  notes?: string;
  temperature?: number;
  weight?: number;
}

export interface AICoachMessage {
  id: string;
  timestamp: Date;
  question: string;
  response: string;
  phase: CyclePhase;
  relevantData: Partial<CycleData>;
}

export interface IntimacyCard {
  id: string;
  category: 'emotional' | 'sensual' | 'fantasy';
  question: string;
  description?: string;
  tags: string[];
  isAnswered: boolean;
  userAnswer?: string;
  partnerAnswer?: string;
  isShared: boolean;
}

export interface FantasyEntry {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'moodboard' | 'audio';
  tags: string[];
  isSharedWithPartner: boolean;
  createdAt: Date;
  updatedAt: Date;
  mood?: number;
  phase?: CyclePhase;
}

export interface Notification {
  id: string;
  type: 'cycle' | 'partner' | 'intimacy' | 'reminder';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface AppState {
  user: User | null;
  partner: Partner | null;
  cycleData: CycleData[];
  aiMessages: AICoachMessage[];
  intimacyCards: IntimacyCard[];
  fantasyEntries: FantasyEntry[];
  notifications: Notification[];
  currentPhase: CyclePhase;
  isDarkMode: boolean;
  isLoading: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year' | 'lifetime';
  features: string[];
  isPopular?: boolean;
}

export interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  category: 'experience' | 'gift' | 'activity' | 'food';
  priority: 'low' | 'medium' | 'high';
  isSharedWithPartner: boolean;
  createdAt: Date;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cyclePhase: CyclePhase[];
  nutrients: string[];
  prepTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  image?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  notifications: {
    cycleReminders: boolean;
    intimacyReminders: boolean;
    partnerNotifications: boolean;
  };
  privacy: PrivacySettings;
  dataRetention: number; // days
}