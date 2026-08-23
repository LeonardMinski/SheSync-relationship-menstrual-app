import { Metadata } from "next";
import PrivacySettingsForm from "@/components/settings/PrivacySettingsForm";
import { TopNavbar } from "@/components/layout/Navbar";
import { Navbar } from "@/components/layout/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Privacy Settings | SheSync+",
  description: "Manage your privacy settings and data sharing preferences",
};

export default async function PrivacySettingsPage() {
  return (
    <div className="min-h-screen bg-bg pb-20">
      <TopNavbar
        title="Privacy Settings"
        subtitle="Control your data sharing preferences"
        showNotifications={false}
        showThemeToggle={true}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Privacy Settings Form */}
        <PrivacySettingsForm />

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
              Your privacy is important to us. These settings control how your
              data is shared with your partner and other users.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                <strong>Partner Sharing:</strong> When enabled, your partner can
                see the selected data types.
              </p>
              <p className="text-sm text-foreground">
                <strong>Data Sharing:</strong> Controls which specific data
                types are shared when partner sharing is enabled.
              </p>
              <p className="text-sm text-foreground">
                You can change these settings at any time. Changes take effect
                immediately.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Navbar />
    </div>
  );
}
