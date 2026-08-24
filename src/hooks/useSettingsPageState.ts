"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

export function useSettingsPageState() {
  const { state, toggleTheme } = useApp();
  const { user: authUser, signOut } = useAuth();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const exportData = () => {
    const data = {
      user: authUser,
      cycleData: state.cycleData,
      aiMessages: state.aiMessages,
      intimacyCards: state.intimacyCards,
      fantasyEntries: state.fantasyEntries,
      notifications: state.notifications,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shesync-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const deleteAllData = async () => {
    localStorage.clear();
    await signOut();
    setShowDeleteConfirm(false);
    router.replace("/");
  };

  return {
    authUser,
    deleteAllData,
    exportData,
    isDarkMode: state.isDarkMode,
    isLoading: state.isLoading,
    setShowDeleteConfirm,
    showDeleteConfirm,
    toggleTheme,
  };
}
