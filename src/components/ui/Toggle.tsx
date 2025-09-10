import React from 'react'
import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  helperText?: string
  disabled?: boolean
  id?: string
}

export function Toggle({
  checked,
  onChange,
  label,
  helperText,
  disabled = false,
  id
}: ToggleProps) {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={toggleId}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <div className="toggle">
        <input
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <span className="toggle-slider" />
      </div>
      {helperText && (
        <p className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  )
}

interface ToggleGroupProps {
  children: React.ReactNode
  className?: string
}

export function ToggleGroup({ children, className }: ToggleGroupProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  )
}
