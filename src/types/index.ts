import type { CyclePhase } from "./cycle";

export interface User {
  id: string;
  email?: string;
  name: string;
  subscriptionTier: "free" | "premium" | "vip" | "lifetime";
  createdAt: Date;
  partnerId?: string;
  privacySettings: PrivacySettings;
  profileImageUrl?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  aud?: string;
  created_at?: string;
  /**
   * NULL = known to be incomplete; an ISO timestamp = known complete.
   * `undefined` specifically means "not yet loaded from the real profile" —
   * callers that gate navigation on this must treat `undefined` as "wait,
   * don't decide yet," not as "incomplete." See AuthContext's mapSessionUser
   * (the brief session-only fallback before the DB profile resolves) vs.
   * mapDbUser (the real value).
   */
  onboardingCompletedAt?: string | null;
  /**
   * Whether this account can use self-tracking features (Cycle, Coach,
   * Vault) — independent of whether it is also a partner/viewer of someone
   * else's shared data. `undefined` specifically means "not yet loaded
   * from the real profile," mirroring onboardingCompletedAt above: callers
   * that gate access on this must treat `undefined` as "wait, don't decide
   * yet," never as either granted or denied. See
   * src/features/account/capabilities.ts.
   */
  trackingEnabled?: boolean;
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
  inviteStatus: "pending" | "accepted" | "declined";
  accessLevel: "basic" | "full";
}

export interface CycleData {
  id: string;
  date: Date;
  phase: CyclePhase;
  periodFlow?: "light" | "medium" | "heavy";
  mood: number;
  energy: number;
  libido: number;
  stress: number;
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
  category: "emotional" | "sensual" | "fantasy";
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
  type: "text" | "moodboard" | "audio";
  tags: string[];
  isSharedWithPartner: boolean;
  createdAt: Date;
  updatedAt: Date;
  mood?: number;
  phase?: CyclePhase;
}

export interface Notification {
  id: string;
  type: "cycle" | "partner" | "intimacy" | "reminder";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year" | "lifetime";
  features: string[];
  isPopular?: boolean;
}

export interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  category: "experience" | "gift" | "activity" | "food";
  priority: "low" | "medium" | "high";
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
  difficulty: "easy" | "medium" | "hard";
  image?: string;
}

export type ThemeMode = "light" | "dark" | "system";

export interface AppSettings {
  theme: ThemeMode;
  notifications: {
    cycleReminders: boolean;
    intimacyReminders: boolean;
    partnerNotifications: boolean;
  };
  privacy: PrivacySettings;
  dataRetention: number;
}

export * from "./auth";
export * from "./app";
export * from "./cycle";
export * from "./dashboard";
export * from "./navigation";
export * from "./partner";
export * from "./period";
export * from "./storage";
export * from "./api";
