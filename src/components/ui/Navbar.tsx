'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Calendar,
  Heart,
  Sparkles,
  MessageCircle,
  Settings,
  Bell,
  Sun,
  Moon
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/cycle', label: 'Cycle', icon: Calendar },
  { href: '/intimacy', label: 'Intimacy', icon: Heart },
  { href: '/fantasy', label: 'Fantasy', icon: Sparkles },
  { href: '/coach', label: 'Coach', icon: MessageCircle },
  { href: '/settings', label: 'Settings', icon: Settings }
]

interface NavbarProps {
  className?: string
}

export function Navbar({ className }: NavbarProps) {
  const pathname = usePathname()
  
  return (
    <nav className={cn('fixed bottom-0 left-0 right-0 bg-surface border-t border-border', className)}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'nav-item flex-col',
                  isActive && 'active'
                )}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

interface TopNavbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
  showNotifications?: boolean
  showThemeToggle?: boolean
}

export function TopNavbar({ 
  title, 
  subtitle, 
  actions, 
  className,
  showNotifications = true,
  showThemeToggle = true
}: TopNavbarProps) {
  const [isDark, setIsDark] = useState(false)
  const [notifications, setNotifications] = useState(0)

  useEffect(() => {
    // Check initial theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDarkMode = savedTheme === 'dark' || (!savedTheme && systemPrefersDark)
    
    setIsDark(isDarkMode)
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Mock notifications count - in real app, this would come from context/API
  useEffect(() => {
    // Simulate notifications count
    setNotifications(Math.floor(Math.random() * 5))
  }, [])

  return (
    <header className={cn('sticky top-0 z-50 bg-bg-surface border-b border-border', className)}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notifications */}
            {showNotifications && (
              <button
                className="relative p-2 rounded-lg hover:bg-bg-elevated transition-colors"
                aria-label={`Notifications ${notifications > 0 ? `(${notifications} unread)` : ''}`}
              >
                <Bell className="h-5 w-5 text-foreground" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-error text-white text-xs rounded-full flex items-center justify-center">
                    {notifications > 9 ? '9+' : notifications}
                  </span>
                )}
              </button>
            )}
            
            {/* Theme Toggle */}
            {showThemeToggle && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-bg-elevated transition-colors"
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-foreground" />
                ) : (
                  <Moon className="h-5 w-5 text-foreground" />
                )}
              </button>
            )}
            
            {/* Custom Actions */}
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
