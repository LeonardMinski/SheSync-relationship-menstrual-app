import { Metadata } from 'next'
import { getPrivacySettings } from '@/features/privacy/services'
import { getCurrentUser } from '@/lib/api-utils'
import PrivacySettingsForm from './_components/PrivacySettingsForm'

export const metadata: Metadata = {
  title: 'Privacy Settings | SheSync+',
  description: 'Manage your privacy settings and data sharing preferences',
}

export default async function PrivacySettingsPage() {
  let initialSettings = null
  let error = null

  try {
    const user = await getCurrentUser()
    if (user) {
      initialSettings = await getPrivacySettings(user.id)
    }
  } catch (err) {
    console.error('Error loading privacy settings:', err)
    error = 'Failed to load privacy settings'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Privacy Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Control how your data is shared and who can access your information.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Privacy Settings Form */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-8">
            <PrivacySettingsForm initialSettings={initialSettings} />
          </div>
        </div>

        {/* Privacy Information */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Privacy Information
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              Your privacy is important to us. These settings control how your data is shared with your partner and other users.
            </p>
            <p>
              <strong>Partner Sharing:</strong> When enabled, your partner can see the selected data types.
            </p>
            <p>
              <strong>Data Sharing:</strong> Controls which specific data types are shared when partner sharing is enabled.
            </p>
            <p>
              You can change these settings at any time. Changes take effect immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

