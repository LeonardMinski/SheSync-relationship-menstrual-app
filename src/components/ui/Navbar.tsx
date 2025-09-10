import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Calendar,
  Heart,
  Sparkles,
  MessageCircle,
  Settings
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
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
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
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
}

export function TopNavbar({ title, subtitle, actions, className }: TopNavbarProps) {
  return (
    <header className={cn('sticky top-0 z-50 bg-surface border-b border-border', className)}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
