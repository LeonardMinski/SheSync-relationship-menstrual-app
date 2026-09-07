import React from 'react'
import { cn } from '@/utils/cn'

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
  const generatedId = React.useId()
  const toggleId = id ?? `toggle-${generatedId}`
  
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
          onChange={(e) => {
            if (disabled) return;
            onChange(e.target.checked);
          }}
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
