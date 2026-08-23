import type {
  AICoachMessage,
  CycleData,
  CyclePhase,
  FantasyEntry,
  IntimacyCard,
  Notification,
  User,
} from "@/types";

export const getUser = (): User | null => {
  try {
    const userData = localStorage.getItem("sheSync_user");
    if (!userData) return null;

    const user = JSON.parse(userData) as Partial<User> & {
      createdAt?: string | number | Date;
    };

    const normalizedUser: User = {
      ...user,
      id: user.id ?? "",
      name: user.name ?? "",
      subscriptionTier: user.subscriptionTier ?? "free",
      createdAt: new Date(user.createdAt ?? new Date()),
      privacySettings: user.privacySettings ?? {
        shareWithPartner: false,
        shareCyclePhase: false,
        shareMood: false,
        shareFantasyVault: false,
        shareIntimacyDeck: false,
      },
    };

    return normalizedUser;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

export const saveUser = (user: User): void => {
  try {
    localStorage.setItem("sheSync_user", JSON.stringify(user));
  } catch (error) {
    console.error("Error saving user:", error);
  }
};

export const saveUserProfileImage = (
  userId: string,
  imageUrl: string,
): void => {
  try {
    const existingUser = getUser();
    if (existingUser) {
      const updatedUser = { ...existingUser, profileImageUrl: imageUrl };
      saveUser(updatedUser);
    }
    localStorage.setItem(`sheSync_profileImage_${userId}`, imageUrl);
  } catch (error) {
    console.error("Error saving user profile image:", error);
  }
};

export const getUserProfileImage = (userId: string): string | null => {
  try {
    const user = getUser();
    if (user && user.profileImageUrl) {
      return user.profileImageUrl;
    }
    return localStorage.getItem(`sheSync_profileImage_${userId}`);
  } catch (error) {
    console.error("Error getting user profile image:", error);
    return null;
  }
};

export const getCycleData = (): CycleData[] => {
  try {
    const cycleData = localStorage.getItem("sheSync_cycleData");
    if (!cycleData) return [];

    const data = JSON.parse(cycleData) as Array<Record<string, unknown>>;
    return data.map(
      (entry): CycleData => ({
        id: String(entry.id ?? ""),
        date: new Date((entry.date as string | number | Date) ?? new Date()),
        phase: (entry.phase as CycleData["phase"]) ?? "luteal",
        periodFlow: (entry.periodFlow as CycleData["periodFlow"]) ?? undefined,
        mood: Number(entry.mood ?? 0),
        energy: Number(entry.energy ?? 0),
        libido: Number(entry.libido ?? 0),
        stress: Number(entry.stress ?? 0),
        symptoms: Array.isArray(entry.symptoms)
          ? entry.symptoms.map(String)
          : [],
        notes: typeof entry.notes === "string" ? entry.notes : undefined,
        temperature:
          typeof entry.temperature === "number" ? entry.temperature : undefined,
        weight: typeof entry.weight === "number" ? entry.weight : undefined,
      }),
    );
  } catch (error) {
    console.error("Error getting cycle data:", error);
    return [];
  }
};

export const saveCycleData = (cycleData: CycleData[]): void => {
  try {
    localStorage.setItem("sheSync_cycleData", JSON.stringify(cycleData));
  } catch (error) {
    console.error("Error saving cycle data:", error);
  }
};

export const getAIMessages = (): AICoachMessage[] => {
  try {
    const messages = localStorage.getItem("sheSync_aiMessages");
    if (!messages) return [];

    const data = JSON.parse(messages) as Array<Record<string, unknown>>;
    return data.map(
      (message): AICoachMessage => ({
        id: String(message.id ?? ""),
        timestamp: new Date(
          (message.timestamp as string | number | Date) ?? new Date(),
        ),
        question: String(message.question ?? ""),
        response: String(message.response ?? ""),
        phase: (message.phase as CyclePhase) ?? "luteal",
        relevantData: ((message.relevantData as Partial<CycleData>) ??
          {}) as Partial<CycleData>,
      }),
    );
  } catch (error) {
    console.error("Error getting AI messages:", error);
    return [];
  }
};

export const getIntimacyCards = (): IntimacyCard[] => {
  try {
    const cards = localStorage.getItem("sheSync_intimacyCards");
    if (!cards) return [];
    return JSON.parse(cards) as IntimacyCard[];
  } catch (error) {
    console.error("Error getting intimacy cards:", error);
    return [];
  }
};

export const getFantasyEntries = (): FantasyEntry[] => {
  try {
    const entries = localStorage.getItem("sheSync_fantasyEntries");
    if (!entries) return [];

    const data = JSON.parse(entries) as Array<Record<string, unknown>>;
    return data.map(
      (entry): FantasyEntry => ({
        id: String(entry.id ?? ""),
        title: String(entry.title ?? ""),
        content: String(entry.content ?? ""),
        type: (entry.type as FantasyEntry["type"]) ?? "text",
        tags: Array.isArray(entry.tags) ? entry.tags.map(String) : [],
        isSharedWithPartner: Boolean(entry.isSharedWithPartner),
        createdAt: new Date(
          (entry.createdAt as string | number | Date) ?? new Date(),
        ),
        updatedAt: new Date(
          (entry.updatedAt as string | number | Date) ?? new Date(),
        ),
        mood: typeof entry.mood === "number" ? entry.mood : undefined,
        phase: (entry.phase as FantasyEntry["phase"]) ?? undefined,
      }),
    );
  } catch (error) {
    console.error("Error getting fantasy entries:", error);
    return [];
  }
};

export const updateFantasyEntry = (
  entryId: string,
  updates: Partial<FantasyEntry>,
): void => {
  try {
    const entries = getFantasyEntries();
    const updatedEntries = entries.map((entry) =>
      entry.id === entryId
        ? { ...entry, ...updates, updatedAt: new Date() }
        : entry,
    );

    localStorage.setItem(
      "sheSync_fantasyEntries",
      JSON.stringify(updatedEntries),
    );
  } catch (error) {
    console.error("Error updating fantasy entry:", error);
  }
};

export const getNotifications = (): Notification[] => {
  try {
    const notifications = localStorage.getItem("sheSync_notifications");
    if (!notifications) return [];

    const data = JSON.parse(notifications) as Array<Record<string, unknown>>;
    return data.map(
      (notification): Notification => ({
        id: String(notification.id ?? ""),
        type: (notification.type as Notification["type"]) ?? "reminder",
        title: String(notification.title ?? ""),
        message: String(notification.message ?? ""),
        isRead: Boolean(notification.isRead),
        createdAt: new Date(
          (notification.createdAt as string | number | Date) ?? new Date(),
        ),
        actionUrl:
          typeof notification.actionUrl === "string"
            ? notification.actionUrl
            : undefined,
      }),
    );
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
};

export const getTheme = (): "light" | "dark" => {
  try {
    const theme = localStorage.getItem("sheSync_theme");
    return theme === "dark" ? "dark" : "light";
  } catch (error) {
    console.error("Error getting theme:", error);
    return "light";
  }
};

export const saveTheme = (theme: "light" | "dark"): void => {
  try {
    localStorage.setItem("sheSync_theme", theme);
  } catch (error) {
    console.error("Error saving theme:", error);
  }
};
