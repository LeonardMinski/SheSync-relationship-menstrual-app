import type {
  User,
  PrivacySettings,
  CycleData,
  AICoachMessage,
  IntimacyCard,
  FantasyEntry,
  Notification,
  CyclePhase,
} from "@/types";

export type AppState = {
  user: User | null;
  partner: import("@/types").Partner | null;
  cycleData: CycleData[];
  aiMessages: AICoachMessage[];
  intimacyCards: IntimacyCard[];
  fantasyEntries: FantasyEntry[];
  notifications: Notification[];
  currentPhase: CyclePhase;
  isDarkMode: boolean;
  isLoading: boolean;
};

export type AppAction =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_THEME"; payload: boolean }
  | { type: "SET_CYCLE_DATA"; payload: CycleData[] }
  | { type: "ADD_CYCLE_ENTRY"; payload: CycleData }
  | { type: "SET_AI_MESSAGES"; payload: AICoachMessage[] }
  | { type: "ADD_AI_MESSAGE"; payload: AICoachMessage }
  | { type: "SET_INTIMACY_CARDS"; payload: IntimacyCard[] }
  | {
      type: "UPDATE_INTIMACY_CARD";
      payload: { cardId: string; updates: Partial<IntimacyCard> };
    }
  | { type: "SET_FANTASY_ENTRIES"; payload: FantasyEntry[] }
  | { type: "ADD_FANTASY_ENTRY"; payload: FantasyEntry }
  | {
      type: "UPDATE_FANTASY_ENTRY";
      payload: { entryId: string; updates: Partial<FantasyEntry> };
    }
  | { type: "SET_NOTIFICATIONS"; payload: Notification[] }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "INITIALIZE_APP"; payload: Partial<AppState> };

export type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (user: User) => void;
  logout: () => void;
  toggleTheme: () => void;
  addCycleEntry: (entry: CycleData) => void;
  addAIMessage: (message: AICoachMessage) => void;
  updateIntimacyCard: (cardId: string, updates: Partial<IntimacyCard>) => void;
  addFantasyEntry: (entry: FantasyEntry) => void;
  updateFantasyEntry: (entryId: string, updates: Partial<FantasyEntry>) => void;
  markNotificationAsRead: (notificationId: string) => void;
};

export type AppProviderProps = {
  children: React.ReactNode;
};

export type ThemeMode = "light" | "dark" | "system";

export type AppSettings = {
  theme: ThemeMode;
  notifications: {
    cycleReminders: boolean;
    intimacyReminders: boolean;
    partnerNotifications: boolean;
  };
  privacy: PrivacySettings;
  dataRetention: number;
};
