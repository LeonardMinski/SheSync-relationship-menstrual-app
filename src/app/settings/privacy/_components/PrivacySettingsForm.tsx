'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getPrivacySettings, updatePrivacySettings } from '@/features/privacy/services'
import { PRIVACY_SETTING_DEFINITIONS } from '@/features/privacy/schemas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Toggle, ToggleGroup } from '@/components/ui/Toggle'
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cta-start"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Privacy Settings */}
      <div className="space-y-6">
        {/* Partner Sharing Section */}
        <Card>
          <CardHeader>
            <CardTitle>Partner Sharing</CardTitle>
            <CardDescription>
              Control what information you share with your partner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup>
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
            </ToggleGroup>
          </CardContent>
        </Card>

        {/* Data Sharing Section */}
        <Card>
          <CardHeader>
            <CardTitle>Data Sharing</CardTitle>
            <CardDescription>
              Control what specific data is shared with your partner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup>
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
            </ToggleGroup>
          </CardContent>
        </Card>
      </div>

      {/* Reset Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Resetting...' : 'Reset to Defaults'}
          </Button>
        </CardContent>
      </Card>
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
    <div className="flex items-center justify-between p-4 bg-bg-elevated rounded-lg">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-foreground mb-1">
          {label}
        </h4>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Toggle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  )
}

