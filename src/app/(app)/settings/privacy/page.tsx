import { Metadata } from "next";
import PrivacySettingsForm from "@/components/settings/PrivacySettingsForm";
import { TopNavbar } from "@/components/layout/TopNavbar";

export const metadata: Metadata = {
  title: "Privacy Settings | SheSync+",
  description: "Manage your privacy settings and data sharing preferences",
};

export default async function PrivacySettingsPage() {
  return (
    <div className="min-h-screen bg-bg pb-10">
      <TopNavbar
        title="You're in control."
        subtitle="Choose exactly what gets shared with your partner. Your logs stay private unless you decide otherwise."
      />

      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-10">
        <PrivacySettingsForm />
      </main>
    </div>
  );
}
