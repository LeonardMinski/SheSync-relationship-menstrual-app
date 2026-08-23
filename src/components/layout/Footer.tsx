import React from 'react'
import Link from 'next/link'
import { cn } from '@/utils/cn'

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn('bg-bg-elevated border-t border-border py-6 mt-auto', className)}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cta-start to-cta-end flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-sm font-medium text-foreground">Shesync+</span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6">
            <Link 
              href="/about" 
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link 
              href="/privacy" 
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link 
              href="/terms" 
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link 
              href="/support" 
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Support
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-muted">
            © 2024 Shesync+. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
