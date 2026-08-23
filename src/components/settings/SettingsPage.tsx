"use client";

import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Heart,
  Download,
  Trash2,
  Moon,
  Sun,
  UserPlus,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import Navigation from "@/components/layout/Navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const Settings = () => {
  const { state, toggleTheme, logout } = useApp();
  const { user: authUser } = useAuth();
  const { isDarkMode, isLoading } = state;
  const [activeTab, setActiveTab] = useState<"account" | "privacy" | "partner">(
    "account",
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  const tabs: Array<{
    id: "account" | "privacy" | "partner";
    name: string;
    icon: typeof User;
  }> = [
    { id: "account", name: "Account", icon: User },
    { id: "privacy", name: "Privacy", icon: Shield },
    { id: "partner", name: "Partner", icon: Heart },
  ];

  const handleExportData = () => {
    // Export user data functionality
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
    const a = document.createElement("a");
    a.href = url;
    a.download = `shesync-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAllData = () => {
    // Clear all local data
    localStorage.clear();
    logout();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="min-h-screen pb-20">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700 mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-3 rounded-xl">
              <SettingsIcon className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white dark:text-white">
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your account, privacy, and preferences
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 border border-rose-200 dark:border-gray-700">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-rose-500 to-purple-600 text-[var(--btn-primary-text)]"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700">
              {/* Account Tab */}
              {activeTab === "account" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white dark:text-white">
                    Account Settings
                  </h2>

                  {/* Profile Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={authUser?.name || ""}
                        readOnly
                        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3 text-[var(--text-primary)] transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={authUser?.email || ""}
                        readOnly
                        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3 text-[var(--text-primary)] transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                      <div>
                        <div className="font-medium text-white dark:text-white">
                          Theme
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {isDarkMode ? "Dark mode" : "Light mode"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isDarkMode
                          ? "bg-purple-600"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isDarkMode ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Data Management */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white dark:text-white">
                      Data Management
                    </h3>

                    <button
                      onClick={handleExportData}
                      className="flex items-center space-x-2 w-full p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <Download size={20} />
                      <span>Export My Data</span>
                    </button>

                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center space-x-2 w-full p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 size={20} />
                      <span>Delete All Data</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === "privacy" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white dark:text-white">
                    Privacy Settings
                  </h2>

                  <div className="space-y-4">
                    {Object.entries(authUser?.privacySettings || {}).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-white dark:text-white">
                              {key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {key === "shareWithPartner" &&
                                "Allow partner to access shared data"}
                              {key === "share_with_partner" &&
                                "Allow partner to access shared data"}
                              {key === "shareCyclePhase" &&
                                "Share your current cycle phase"}
                              {key === "share_cycle_phase" &&
                                "Share your current cycle phase"}
                              {key === "shareMood" &&
                                "Share mood and energy levels"}
                              {key === "share_mood" &&
                                "Share mood and energy levels"}
                              {key === "shareFantasyVault" &&
                                "Share fantasy vault entries"}
                              {key === "share_fantasy_vault" &&
                                "Fantasy vault sharing is parked for a later phase"}
                              {key === "shareIntimacyDeck" &&
                                "Share intimacy card answers"}
                              {key === "share_intimacy_deck" &&
                                "Intimacy deck sharing is parked for a later phase"}
                            </div>
                          </div>
                          <button
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              value
                                ? "bg-purple-600"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                value ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Partner Tab */}
              {activeTab === "partner" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white dark:text-white">
                    Partner Management
                  </h2>

                  <div className="text-center py-8">
                    <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white dark:text-white mb-2">
                      No Partner Connected
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Invite your partner to enhance your SheSync+ experience
                      together.
                    </p>
                    <button className="flex items-center space-x-2 bg-gradient-to-r from-rose-500 to-purple-600 text-[var(--btn-primary-text)] px-6 py-3 rounded-xl hover:from-rose-600 hover:to-purple-700 transition-all mx-auto">
                      <UserPlus size={20} />
                      <span>Invite Partner</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="text-center">
              <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white dark:text-white mb-2">
                Delete All Data?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This action cannot be undone. All your cycle data, entries, and
                settings will be permanently deleted.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllData}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete Everything
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
