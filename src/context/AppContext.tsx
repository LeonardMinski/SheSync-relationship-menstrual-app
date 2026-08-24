"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import type {
  AppAction,
  AppContextType,
  AppState,
  AICoachMessage,
  CycleData,
  FantasyEntry,
  IntimacyCard,
  User,
} from "@/types";
import {
  getUser,
  getCycleData,
  getAIMessages,
  getIntimacyCards,
  getFantasyEntries,
  getNotifications,
  getTheme,
  saveUser,
  saveCycleData,
  saveTheme,
  updateFantasyEntry as updateFantasyEntryStorage,
} from "@/lib/browserStorage";

const initialState: AppState = {
  user: null,
  partner: null,
  cycleData: [],
  aiMessages: [],
  intimacyCards: [],
  fantasyEntries: [],
  notifications: [],
  currentPhase: null,
  isDarkMode: false,
  isLoading: true,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_THEME":
      return { ...state, isDarkMode: action.payload };
    case "SET_CYCLE_DATA":
      return { ...state, cycleData: action.payload };
    case "ADD_CYCLE_ENTRY":
      return {
        ...state,
        cycleData: [
          ...state.cycleData.filter((e) => e.id !== action.payload.id),
          action.payload,
        ],
        currentPhase: action.payload.phase,
      };
    case "SET_AI_MESSAGES":
      return { ...state, aiMessages: action.payload };
    case "ADD_AI_MESSAGE":
      return { ...state, aiMessages: [...state.aiMessages, action.payload] };
    case "SET_INTIMACY_CARDS":
      return { ...state, intimacyCards: action.payload };
    case "UPDATE_INTIMACY_CARD":
      return {
        ...state,
        intimacyCards: state.intimacyCards.map((card) =>
          card.id === action.payload.cardId
            ? { ...card, ...action.payload.updates }
            : card,
        ),
      };
    case "SET_FANTASY_ENTRIES":
      return { ...state, fantasyEntries: action.payload };
    case "ADD_FANTASY_ENTRY":
      return {
        ...state,
        fantasyEntries: [...state.fantasyEntries, action.payload],
      };
    case "UPDATE_FANTASY_ENTRY":
      return {
        ...state,
        fantasyEntries: state.fantasyEntries.map((entry) =>
          entry.id === action.payload.entryId
            ? { ...entry, ...action.payload.updates, updatedAt: new Date() }
            : entry,
        ),
      };
    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.payload };
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((notif) =>
          notif.id === action.payload ? { ...notif, isRead: true } : notif,
        ),
      };
    case "INITIALIZE_APP":
      return { ...state, ...action.payload, isLoading: false };
    default:
      return state;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const storedUser = getUser();
    const isDarkMode = getTheme() === "dark";

    if (storedUser) {
      const cycleData = getCycleData();
      const aiMessages = getAIMessages();
      const intimacyCards = getIntimacyCards();
      const fantasyEntries = getFantasyEntries();
      const notifications = getNotifications();

      dispatch({
        type: "INITIALIZE_APP",
        payload: {
          user: storedUser,
          cycleData,
          aiMessages,
          intimacyCards,
          fantasyEntries,
          notifications,
          currentPhase: cycleData[cycleData.length - 1]?.phase ?? null,
          isDarkMode,
        },
      });
      return;
    }

    dispatch({
      type: "INITIALIZE_APP",
      payload: {
        user: null,
        cycleData: [],
        aiMessages: [],
        intimacyCards: [],
        fantasyEntries: [],
        notifications: [],
        currentPhase: null,
        isDarkMode,
      },
    });
  }, []);

  const login = (user: User) => {
    saveUser(user);
    dispatch({ type: "SET_USER", payload: user });
  };

  const logout = () => {
    dispatch({ type: "SET_USER", payload: null });
    // Note: We don't clear all data for privacy, just log out
  };

  const toggleTheme = () => {
    const newTheme = !state.isDarkMode;
    saveTheme(newTheme ? "dark" : "light");
    dispatch({ type: "SET_THEME", payload: newTheme });
  };

  const addCycleEntry = (entry: CycleData) => {
    const updatedData = [
      ...state.cycleData.filter((e) => e.id !== entry.id),
      entry,
    ];
    saveCycleData(updatedData);
    dispatch({ type: "ADD_CYCLE_ENTRY", payload: entry });
  };

  const addAIMessage = (message: AICoachMessage) => {
    dispatch({ type: "ADD_AI_MESSAGE", payload: message });
  };

  const updateIntimacyCard = (
    cardId: string,
    updates: Partial<IntimacyCard>,
  ) => {
    dispatch({ type: "UPDATE_INTIMACY_CARD", payload: { cardId, updates } });
  };

  const addFantasyEntry = (entry: FantasyEntry) => {
    dispatch({ type: "ADD_FANTASY_ENTRY", payload: entry });
  };

  const updateFantasyEntry = (
    entryId: string,
    updates: Partial<FantasyEntry>,
  ) => {
    updateFantasyEntryStorage(entryId, updates);
    dispatch({ type: "UPDATE_FANTASY_ENTRY", payload: { entryId, updates } });
  };

  const markNotificationAsRead = (notificationId: string) => {
    dispatch({ type: "MARK_NOTIFICATION_READ", payload: notificationId });
  };

  const value: AppContextType = {
    state,
    dispatch,
    login,
    logout,
    toggleTheme,
    addCycleEntry,
    addAIMessage,
    updateIntimacyCard,
    addFantasyEntry,
    updateFantasyEntry,
    markNotificationAsRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
