'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Calendar, 
  MessageCircle, 
  Heart, 
  Sparkles, 
  Settings,
  Moon,
  Sun,
  Bell,
  User,
  Camera,
  Upload,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { uploadProfileImage, deleteProfileImage, getUserProfileImage, saveUserProfileImage } from '@/lib/storage';
import { getPhaseEmoji } from '@/lib/mockData';

const Navigation = () => {
  const pathname = usePathname();
  const { state, toggleTheme, markNotificationAsRead } = useApp();
  const { isDarkMode, currentPhase, notifications } = state;
  const { user, signOut } = useAuth();
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  // Load profile image on component mount
  useEffect(() => {
    if (user?.id) {
      const savedImageUrl = getUserProfileImage(user.id);
      setProfileImageUrl(savedImageUrl);
    }
  }, [user?.id]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user?.id) {
      handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadStatus({ type: 'error', message: 'Please select an image file' });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus({ type: 'error', message: 'Image must be smaller than 5MB' });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const { url, error } = await uploadProfileImage(file, user.id);
      
      if (error) {
        setUploadStatus({ type: 'error', message: error });
      } else if (url) {
        setProfileImageUrl(url);
        saveUserProfileImage(user.id, url);
        setUploadStatus({ type: 'success', message: 'Profile image updated successfully!' });
        
        // Auto-close modal after success
        setTimeout(() => {
          setShowProfileModal(false);
          setUploadStatus({ type: null, message: '' });
        }, 2000);
      }
    } catch (error) {
      setUploadStatus({ type: 'error', message: 'Failed to upload image' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!user?.id) return;

    setUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const { error } = await deleteProfileImage(user.id);
      
      if (error) {
        setUploadStatus({ type: 'error', message: error });
      } else {
        setProfileImageUrl(null);
        saveUserProfileImage(user.id, '');
        setUploadStatus({ type: 'success', message: 'Profile image removed successfully!' });
        
        // Auto-close modal after success
        setTimeout(() => {
          setShowProfileModal(false);
          setUploadStatus({ type: null, message: '' });
        }, 2000);
      }
    } catch (error) {
      setUploadStatus({ type: 'error', message: 'Failed to delete image' });
    } finally {
      setUploading(false);
    }
  };

  const navItems = [
    {
      name: 'Cycle',
      href: '/dashboard',
      icon: Calendar,
      emoji: getPhaseEmoji(currentPhase),
    },
    {
      name: 'AI Coach',
      href: '/ai-coach',
      icon: MessageCircle,
    },
    {
      name: 'Intimacy',
      href: '/intimacy',
      icon: Heart,
    },
    {
      name: 'Fantasy',
      href: '/fantasy',
      icon: Sparkles,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="border-b sticky top-0 z-50 bg-white dark:bg-[#17121F] dark:border-[#34263F]" style={{
        boxShadow: 'var(--shadow-soft)'
      }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md" style={{background: 'var(--accent-gradient)'}}>
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <div className="text-xl font-bold gradient-text">
                  SheSync+
                </div>
              </div>
              <div className="text-lg">{getPhaseEmoji(currentPhase)}</div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* User Menu */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="w-8 h-8 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform duration-200 overflow-hidden"
                    >
                      {profileImageUrl ? (
                        <img 
                          src={profileImageUrl} 
                          alt="Profile" 
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <User size={16} className="text-white" />
                      )}
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
                      {user.name || user.email?.split('@')[0]}
                    </span>
                  </div>
                  <button
                    onClick={signOut}
                    className="text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                >
                  Sign In
                </Link>
              )}
              
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-rose-500 transition-colors">
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 nav-inactive hover:nav-active transition-all duration-300 rounded-lg"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t z-50 bg-white dark:bg-[#17121F] dark:border-[#34263F]" style={{
        boxShadow: 'var(--shadow-soft)'
      }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'nav-active'
                      : 'nav-inactive hover:nav-active'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'rgba(224, 67, 130, 0.1)' : 'transparent'
                  }}
                >
                  <div className="relative">
                    {item.emoji ? (
                      <span className="text-xl">{item.emoji}</span>
                    ) : (
                      <item.icon size={20} />
                    )}
                    {item.name === 'Settings' && unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Profile Image Upload Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-8 w-full max-w-md border border-white/20 dark:border-slate-700/50 shadow-2xl dark:shadow-purple-900/30 relative">
            {/* Glass morphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-slate-800/20 dark:to-transparent rounded-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white dark:text-white">Profile Picture</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Current Profile Image Preview */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                  {profileImageUrl ? (
                    <img 
                      src={profileImageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User size={32} className="text-white" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {profileImageUrl ? 'Current profile picture' : 'No profile picture set'}
                </p>
              </div>

              {/* Upload Status */}
              {uploadStatus.type && (
                <div className={`flex items-center space-x-2 p-3 rounded-lg mb-4 ${
                  uploadStatus.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                  {uploadStatus.type === 'success' ? (
                    <Check size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  <span className="text-sm">{uploadStatus.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-rose-500 to-purple-600 dark:from-violet-600 dark:via-purple-600 dark:to-rose-500 text-white rounded-2xl font-semibold hover:from-rose-600 hover:to-purple-700 dark:hover:from-violet-700 dark:hover:via-purple-700 dark:hover:to-rose-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg dark:shadow-purple-900/50 hover:shadow-xl dark:hover:shadow-purple-900/70 hover:scale-105 active:scale-95"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Upload New Photo</span>
                    </>
                  )}
                </button>

                {/* Take Photo Button (mobile) */}
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.setAttribute('capture', 'user');
                      fileInputRef.current.click();
                    }
                  }}
                  disabled={uploading}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera size={16} />
                  <span>Take Photo</span>
                </button>

                {/* Remove Photo Button */}
                {profileImageUrl && (
                  <button
                    onClick={handleDeleteImage}
                    disabled={uploading}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={16} />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                Supported formats: JPG, PNG, WebP • Max size: 5MB
              </p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;