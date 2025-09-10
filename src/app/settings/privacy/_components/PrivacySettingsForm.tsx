'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getPrivacySettings, updatePrivacySettings } from '@/features/privacy/services'
import { PRIVACY_SETTING_DEFINITIONS } from '@/features/privacy/schemas'
import type { PrivacySettings } from '@/features/privacy/schemas'

interface PrivacySettingsFormProps {
  initialSettings?: PrivacySettings
}

export default function PrivacySettingsForm({ initialSettings }: PrivacySettingsFormProps) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<PrivacySettings>(initialSettings || {
    share_with_partner: false,
    share_cycle_phase: false,
    share_mood: false,
    share_fantasy_vault: false,
    share_intimacy_deck: false,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load settings if not provided
  useEffect(() => {
    if (!initialSettings && user?.id) {
      loadSettings()
    }
  }, [user?.id, initialSettings])

  const loadSettings = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    try {
      const userSettings = await getPrivacySettings(user.id)
      setSettings(userSettings)
    } catch (err) {
      setError('Failed to load privacy settings')
      console.error('Error loading privacy settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = async (key: keyof PrivacySettings, value: boolean) => {
    if (!user?.id) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await updatePrivacySettings(user.id, { [key]: value })
      
      if (result.success) {
        setSettings(prev => ({ ...prev, [key]: value }))
        setSuccess('Privacy settings updated successfully')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || 'Failed to update privacy settings')
      }
    } catch (err) {
      setError('Failed to update privacy settings')
      console.error('Error updating privacy settings:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!user?.id) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await updatePrivacySettings(user.id, {
        share_with_partner: false,
        share_cycle_phase: false,
        share_mood: false,
        share_fantasy_vault: false,
        share_intimacy_deck: false,
      })
      
      if (result.success) {
        setSettings({
          share_with_partner: false,
          share_cycle_phase: false,
          share_mood: false,
          share_fantasy_vault: false,
          share_intimacy_deck: false,
        })
        setSuccess('Privacy settings reset to defaults')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || 'Failed to reset privacy settings')
      }
    } catch (err) {
      setError('Failed to reset privacy settings')
      console.error('Error resetting privacy settings:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-200 text-sm">{success}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Privacy Settings */}
      <div className="space-y-6">
        {/* Partner Sharing Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Partner Sharing
          </h3>
          <div className="space-y-4">
            {PRIVACY_SETTING_DEFINITIONS
              .filter(setting => setting.category === 'partner_sharing')
              .map(setting => (
                <PrivacyToggle
                  key={setting.key}
                  label={setting.label}
                  description={setting.description}
                  checked={settings[setting.key]}
                  onChange={(checked) => handleSettingChange(setting.key, checked)}
                  disabled={saving}
                />
              ))}
          </div>
        </div>

        {/* Data Sharing Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Data Sharing
          </h3>
          <div className="space-y-4">
            {PRIVACY_SETTING_DEFINITIONS
              .filter(setting => setting.category === 'data_sharing')
              .map(setting => (
                <PrivacyToggle
                  key={setting.key}
                  label={setting.label}
                  description={setting.description}
                  checked={settings[setting.key]}
                  onChange={(checked) => handleSettingChange(setting.key, checked)}
                  disabled={saving}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleReset}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Resetting...' : 'Reset to Defaults'}
        </button>
      </div>
    </div>
  )
}

interface PrivacyToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function PrivacyToggle({ label, description, checked, onChange, disabled }: PrivacyToggleProps) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex items-center h-5">
        <input
          id={label}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex-1 min-w-0">
        <label htmlFor={label} className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
          {label}
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>
    </div>
  )
}

