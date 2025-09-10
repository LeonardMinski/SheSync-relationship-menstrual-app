import { Metadata } from 'next'
import { getPrivacySettings } from '@/features/privacy/services'
import { getCurrentUser } from '@/lib/api-utils'
import PrivacySettingsForm from './_components/PrivacySettingsForm'
import { TopNavbar } from '@/components/ui/Navbar'
import { Navbar } from '@/components/ui/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

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
    <div className="min-h-screen bg-bg pb-20">
      <TopNavbar 
        title="Privacy Settings" 
        subtitle="Control your data sharing preferences"
        showNotifications={true}
        showThemeToggle={true}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Error State */}
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Privacy Settings Form */}
        <PrivacySettingsForm initialSettings={initialSettings} />

        {/* Privacy Information */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Information</CardTitle>
            <CardDescription>
              Understanding your privacy controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground">
              Your privacy is important to us. These settings control how your data is shared with your partner and other users.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                <strong>Partner Sharing:</strong> When enabled, your partner can see the selected data types.
              </p>
              <p className="text-sm text-foreground">
                <strong>Data Sharing:</strong> Controls which specific data types are shared when partner sharing is enabled.
              </p>
              <p className="text-sm text-foreground">
                You can change these settings at any time. Changes take effect immediately.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Navbar />
    </div>
  )
}

