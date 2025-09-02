'use client';

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  CreditCard, 
  Heart, 
  Bell, 
  Download, 
  Trash2,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Crown,
  Check,
  UserPlus
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { subscriptionPlans } from '@/lib/mockData';

const Settings = () => {
  const { state, toggleTheme, logout } = useApp();
  const { user, notifications, isDarkMode, isLoading } = state;
  const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'partner' | 'subscription' | 'notifications'>('account');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const tabs = [
    { id: 'account', name: 'Account', icon: User },
    { id: 'privacy', name: 'Privacy', icon: Shield },
    { id: 'partner', name: 'Partner', icon: Heart },
    { id: 'subscription', name: 'Subscription', icon: CreditCard },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  const handleExportData = () => {
    // Export user data functionality
    const data = {
      user: user,
      cycleData: state.cycleData,
      aiMessages: state.aiMessages,
      intimacyCards: state.intimacyCards,
      fantasyEntries: state.fantasyEntries,
      notifications: state.notifications,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shesync-data-${new Date().toISOString().split('T')[0]}.json`;
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

  const currentPlan = subscriptionPlans.find(plan => plan.id === user?.subscriptionTier);

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
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
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{tab.name}</span>
                      {tab.id === 'notifications' && unreadNotifications > 0 && (
                        <span className="ml-auto bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadNotifications}
                        </span>
                      )}
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
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account Settings</h2>
                  
                  {/* Profile Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={user?.name || ''}
                        readOnly
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        readOnly
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Theme</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {isDarkMode ? 'Dark mode' : 'Light mode'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isDarkMode ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isDarkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Data Management */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Management</h3>
                    
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
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Privacy Settings</h2>
                  
                  <div className="space-y-4">
                    {Object.entries(user?.privacySettings || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {key === 'shareWithPartner' && 'Allow partner to access shared data'}
                            {key === 'shareCyclePhase' && 'Share your current cycle phase'}
                            {key === 'shareMood' && 'Share mood and energy levels'}
                            {key === 'shareFantasyVault' && 'Share fantasy vault entries'}
                            {key === 'shareIntimacyDeck' && 'Share intimacy card answers'}
                          </div>
                        </div>
                        <button
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            value ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Partner Tab */}
              {activeTab === 'partner' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Partner Management</h2>
                  
                  <div className="text-center py-8">
                    <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Partner Connected
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Invite your partner to enhance your SheSync+ experience together.
                    </p>
                    <button className="flex items-center space-x-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-rose-600 hover:to-purple-700 transition-all mx-auto">
                      <UserPlus size={20} />
                      <span>Invite Partner</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Subscription Tab */}
              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Subscription</h2>
                  
                  {/* Current Plan */}
                  <div className="bg-gradient-to-r from-rose-50 to-purple-50 dark:from-rose-900/20 dark:to-purple-900/20 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Crown className="text-purple-600" size={24} />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Current Plan: {currentPlan?.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {currentPlan?.price === 0 ? 'Free' : `£${currentPlan?.price}/${currentPlan?.interval}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {currentPlan?.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Check className="text-green-500" size={16} />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subscription Actions */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => window.location.href = '/pricing'}
                        className="flex-1 bg-gradient-to-r from-rose-500 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-rose-600 hover:to-purple-700 transition-all font-semibold"
                      >
                        View All Plans
                      </button>
                      
                      {user?.subscriptionTier !== 'free' && (
                        <button
                          onClick={() => {
                            // TODO: Implement subscription management
                            alert('Subscription management coming soon!');
                          }}
                          className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-xl hover:bg-gray-600 transition-all font-semibold"
                        >
                          Manage Subscription
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Billing Information */}
                  {user?.subscriptionTier !== 'free' && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Status:</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Next billing date:</span>
                          <span className="text-gray-900 dark:text-white">Coming soon</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Payment method:</span>
                          <span className="text-gray-900 dark:text-white">•••• •••• •••• 4242</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Upgrade Options */}
                  {user?.subscriptionTier === 'free' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upgrade to Unlock More</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {subscriptionPlans.filter(plan => plan.id !== 'free').map((plan) => (
                          <div
                            key={plan.id}
                            className={`p-4 border-2 rounded-xl transition-all ${
                              plan.isPopular
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h4>
                              {plan.isPopular && (
                                <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                                  Popular
                                </span>
                              )}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                              £{plan.price}
                              <span className="text-sm font-normal text-gray-600 dark:text-gray-300">
                                /{plan.interval}
                              </span>
                            </div>
                            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300 mb-4">
                              {plan.features.slice(0, 3).map((feature, index) => (
                                <li key={index}>• {feature}</li>
                              ))}
                            </ul>
                            <button 
                              onClick={() => window.location.href = '/pricing'}
                              className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white py-2 rounded-lg hover:from-rose-600 hover:to-purple-700 transition-all"
                            >
                              Upgrade to {plan.name}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                  
                  <div className="space-y-4">
                    {notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border ${
                          notification.isRead
                            ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                            : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {notification.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Delete All Data?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This action cannot be undone. All your cycle data, entries, and settings will be permanently deleted.
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