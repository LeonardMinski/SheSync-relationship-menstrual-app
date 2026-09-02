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
        title="Privacy & Partner"
        subtitle="Control what you share and who you share it with."
      />

      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-10">
        <PrivacySettingsForm />

        <section className="rounded-[2rem] border border-border bg-bg-surface p-6 text-center shadow-md">
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Partner view only uses the data you explicitly enable here. Private
            notes and locked categories remain hidden.
          </p>
        </section>
      </main>
    </div>
  );
}
