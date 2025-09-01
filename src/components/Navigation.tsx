'use client';

import React from 'react';
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
  Bell
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getPhaseEmoji } from '@/lib/mockData';

const Navigation = () => {
  const pathname = usePathname();
  const { state, toggleTheme, markNotificationAsRead } = useApp();
  const { isDarkMode, currentPhase, notifications } = state;

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const navItems = [
    {
      name: 'Cycle',
      href: '/',
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
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-rose-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
                SheSync+
              </div>
              <div className="text-lg">{getPhaseEmoji(currentPhase)}</div>
            </div>
            
            <div className="flex items-center space-x-3">
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
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-rose-500 transition-colors"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-rose-200 dark:border-gray-700 z-50">
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
                      ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-300'
                  }`}
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
    </>
  );
};

export default Navigation;