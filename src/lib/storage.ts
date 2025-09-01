import { AppState, User, CycleData, AICoachMessage, IntimacyCard, FantasyEntry, Notification } from '@/types';

const STORAGE_KEYS = {
  USER: 'shesync_user',
  CYCLE_DATA: 'shesync_cycle_data',
  AI_MESSAGES: 'shesync_ai_messages',
  INTIMACY_CARDS: 'shesync_intimacy_cards',
  FANTASY_ENTRIES: 'shesync_fantasy_entries',
  NOTIFICATIONS: 'shesync_notifications',
  THEME: 'shesync_theme',
  ONBOARDING: 'shesync_onboarding',
} as const;

class LocalStorage {
  private isClient = typeof window !== 'undefined';

  setItem(key: string, value: any): void {
    if (!this.isClient) return;
    try {
      const serializedValue = JSON.stringify(value, (key, val) => {
        if (val instanceof Date) {
          return { __type: 'Date', value: val.toISOString() };
        }
        return val;
      });
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  getItem<T>(key: string, defaultValue: T): T {
    if (!this.isClient) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      const parsed = JSON.parse(item, (key, val) => {
        if (val && typeof val === 'object' && val.__type === 'Date') {
          return new Date(val.value);
        }
        return val;
      });
      
      return parsed;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  removeItem(key: string): void {
    if (!this.isClient) return;
    localStorage.removeItem(key);
  }

  clear(): void {
    if (!this.isClient) return;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

const storage = new LocalStorage();

// User management
export const saveUser = (user: User): void => {
  storage.setItem(STORAGE_KEYS.USER, user);
};

export const getUser = (): User | null => {
  return storage.getItem<User | null>(STORAGE_KEYS.USER, null);
};

export const removeUser = (): void => {
  storage.removeItem(STORAGE_KEYS.USER);
};

// Cycle data management
export const saveCycleData = (cycleData: CycleData[]): void => {
  storage.setItem(STORAGE_KEYS.CYCLE_DATA, cycleData);
};

export const getCycleData = (): CycleData[] => {
  return storage.getItem<CycleData[]>(STORAGE_KEYS.CYCLE_DATA, []);
};

export const addCycleEntry = (entry: CycleData): void => {
  const existing = getCycleData();
  const updated = [...existing.filter(e => e.id !== entry.id), entry];
  saveCycleData(updated);
};

// AI messages management
export const saveAIMessages = (messages: AICoachMessage[]): void => {
  storage.setItem(STORAGE_KEYS.AI_MESSAGES, messages);
};

export const getAIMessages = (): AICoachMessage[] => {
  return storage.getItem<AICoachMessage[]>(STORAGE_KEYS.AI_MESSAGES, []);
};

export const addAIMessage = (message: AICoachMessage): void => {
  const existing = getAIMessages();
  saveAIMessages([...existing, message]);
};

// Intimacy cards management
export const saveIntimacyCards = (cards: IntimacyCard[]): void => {
  storage.setItem(STORAGE_KEYS.INTIMACY_CARDS, cards);
};

export const getIntimacyCards = (): IntimacyCard[] => {
  return storage.getItem<IntimacyCard[]>(STORAGE_KEYS.INTIMACY_CARDS, []);
};

export const updateIntimacyCard = (cardId: string, updates: Partial<IntimacyCard>): void => {
  const existing = getIntimacyCards();
  const updated = existing.map(card => 
    card.id === cardId ? { ...card, ...updates } : card
  );
  saveIntimacyCards(updated);
};

// Fantasy entries management
export const saveFantasyEntries = (entries: FantasyEntry[]): void => {
  storage.setItem(STORAGE_KEYS.FANTASY_ENTRIES, entries);
};

export const getFantasyEntries = (): FantasyEntry[] => {
  return storage.getItem<FantasyEntry[]>(STORAGE_KEYS.FANTASY_ENTRIES, []);
};

export const addFantasyEntry = (entry: FantasyEntry): void => {
  const existing = getFantasyEntries();
  saveFantasyEntries([...existing, entry]);
};

export const updateFantasyEntry = (entryId: string, updates: Partial<FantasyEntry>): void => {
  const existing = getFantasyEntries();
  const updated = existing.map(entry => 
    entry.id === entryId ? { ...entry, ...updates, updatedAt: new Date() } : entry
  );
  saveFantasyEntries(updated);
};

export const deleteFantasyEntry = (entryId: string): void => {
  const existing = getFantasyEntries();
  const updated = existing.filter(entry => entry.id !== entryId);
  saveFantasyEntries(updated);
};

// Notifications management
export const saveNotifications = (notifications: Notification[]): void => {
  storage.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
};

export const getNotifications = (): Notification[] => {
  return storage.getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
};

export const addNotification = (notification: Notification): void => {
  const existing = getNotifications();
  saveNotifications([notification, ...existing]);
};

export const markNotificationAsRead = (notificationId: string): void => {
  const existing = getNotifications();
  const updated = existing.map(notif => 
    notif.id === notificationId ? { ...notif, isRead: true } : notif
  );
  saveNotifications(updated);
};

// Theme management
export const saveTheme = (theme: 'light' | 'dark'): void => {
  storage.setItem(STORAGE_KEYS.THEME, theme);
};

export const getTheme = (): 'light' | 'dark' => {
  return storage.getItem<'light' | 'dark'>(STORAGE_KEYS.THEME, 'light');
};

// Onboarding management
export const saveOnboardingStatus = (status: boolean): void => {
  storage.setItem(STORAGE_KEYS.ONBOARDING, status);
};

export const getOnboardingStatus = (): boolean => {
  return storage.getItem<boolean>(STORAGE_KEYS.ONBOARDING, false);
};

// Privacy utilities
export const exportUserData = (): string => {
  const data = {
    user: getUser(),
    cycleData: getCycleData(),
    aiMessages: getAIMessages(),
    intimacyCards: getIntimacyCards(),
    fantasyEntries: getFantasyEntries(),
    notifications: getNotifications(),
    exportDate: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
};

export const clearAllData = (): void => {
  storage.clear();
};