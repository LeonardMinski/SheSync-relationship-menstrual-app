"use client";

import { useEffect } from "react";

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useCycleLogger } from "@/hooks/useCycleLogger";
import { getPrivacySettings } from "@/services/privacy/settings";

export function useSettingsPageState() {
  const { state, toggleTheme } = useApp();
  const { user: authUser } = useAuth();
  const { cycles, fetchCycles } = useCycleLogger();

  useEffect(() => {
    if (authUser) {
      void fetchCycles();
    }
  }, [authUser, fetchCycles]);

  const exportData = async () => {
    if (!authUser) return;

    let privacySettings = null;
    try {
      privacySettings = await getPrivacySettings(authUser.id);
    } catch (error) {
      console.error("[settings] failed to include privacy settings in export", error);
    }

    const data = {
      user: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
      },
      privacySettings,
      cycleLogs: cycles,
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

  return {
    authUser,
    exportData,
    isDarkMode: state.isDarkMode,
    isLoading: state.isLoading,
    toggleTheme,
  };
}
